const prisma = require("../../config/prisma");
const ExcelJS = require("exceljs");

const buildEncouragementWhere = (query) => {
  const {
    search,
    userId,
    predictedLabel,
    modelName,
    minConfidenceScore,
    maxConfidenceScore,
    startDate,
    endDate,
  } = query;

  const where = {};

  if (userId) where.userId = userId;
  if (predictedLabel) where.predictedLabel = predictedLabel;
  if (modelName) where.modelName = modelName;

  if (minConfidenceScore || maxConfidenceScore) {
    where.confidenceScore = {};
    if (minConfidenceScore)
      where.confidenceScore.gte = Number(minConfidenceScore);
    if (maxConfidenceScore)
      where.confidenceScore.lte = Number(maxConfidenceScore);
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  if (search) {
    where.OR = [
      { predictedLabel: { contains: search, mode: "insensitive" } },
      { supportMessage: { contains: search, mode: "insensitive" } },
      { modelName: { contains: search, mode: "insensitive" } },
      { user: { fullName: { contains: search, mode: "insensitive" } } },
      { user: { email: { contains: search, mode: "insensitive" } } },
      { user: { username: { contains: search, mode: "insensitive" } } },
      {
        moodEntry: {
          feelingText: { contains: search, mode: "insensitive" },
        },
      },
    ];
  }

  return where;
};

const encouragementResultSelect = {
  id: true,
  predictedLabel: true,
  supportMessage: true,
  confidenceScore: true,
  modelName: true,
  createdAt: true,
  user: {
    select: {
      id: true,
      fullName: true,
      username: true,
      email: true,
      profilePhotoUrl: true,
    },
  },
  moodEntry: {
    select: {
      id: true,
      feelingText: true,
      moodScore: true,
      analysisStatus: true,
      analysisError: true,
      entryDate: true,
      createdAt: true,
      moodLabel: {
        select: {
          id: true,
          name: true,
          emoji: true,
          paperColor: true,
        },
      },
    },
  },
};

const getEncouragementResults = async (query) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const sort = query.sort === "asc" ? "asc" : "desc";

  const skip = (page - 1) * limit;
  const where = buildEncouragementWhere(query);

  const [encouragementResults, total] = await Promise.all([
    prisma.encouragementResult.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: sort,
      },
      select: encouragementResultSelect,
    }),
    prisma.encouragementResult.count({ where }),
  ]);

  return {
    data: encouragementResults.map((item, index) => ({
      no: skip + index + 1,
      id: item.id,
      user: item.user,
      moodEntry: item.moodEntry,
      predictedLabel: item.predictedLabel,
      supportMessage: item.supportMessage,
      confidenceScore: item.confidenceScore,
      modelName: item.modelName,
      createdAt: item.createdAt,
    })),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
      sortBy: "createdAt",
      sortOrder: sort,
      search: query.search || null,
      filters: {
        userId: query.userId || null,
        predictedLabel: query.predictedLabel || null,
        modelName: query.modelName || null,
        minConfidenceScore: query.minConfidenceScore || null,
        maxConfidenceScore: query.maxConfidenceScore || null,
        startDate: query.startDate || null,
        endDate: query.endDate || null,
      },
    },
  };
};

const getEncouragementResultById = async (id) => {
  const encouragementResult = await prisma.encouragementResult.findUnique({
    where: { id },
    select: encouragementResultSelect,
  });

  if (!encouragementResult) {
    const error = new Error("Encouragement result tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  return encouragementResult;
};

const exportEncouragementResultsExcel = async (query) => {
  const sort = query.sort === "asc" ? "asc" : "desc";
  const where = buildEncouragementWhere(query);

  const encouragementResults = await prisma.encouragementResult.findMany({
    where,
    orderBy: {
      createdAt: sort,
    },
    select: encouragementResultSelect,
  });

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Encouragement Results");

  worksheet.columns = [
    { header: "No", key: "no", width: 8 },
    { header: "User", key: "user", width: 25 },
    { header: "Email", key: "email", width: 30 },
    { header: "Mood", key: "mood", width: 18 },
    { header: "Emoji", key: "emoji", width: 10 },
    { header: "Mood Score", key: "moodScore", width: 15 },
    { header: "Feeling Text", key: "feelingText", width: 50 },
    { header: "Predicted Label", key: "predictedLabel", width: 22 },
    { header: "Support Message", key: "supportMessage", width: 50 },
    { header: "Confidence Score", key: "confidenceScore", width: 20 },
    { header: "Model Name", key: "modelName", width: 20 },
    { header: "Entry Date", key: "entryDate", width: 22 },
    { header: "Created At", key: "createdAt", width: 22 },
  ];

  encouragementResults.forEach((item, index) => {
    worksheet.addRow({
      no: index + 1,
      user: item.user?.fullName || item.user?.username || "-",
      email: item.user?.email || "-",
      mood: item.moodEntry?.moodLabel?.name || "-",
      emoji: item.moodEntry?.moodLabel?.emoji || "-",
      moodScore: item.moodEntry?.moodScore ?? "-",
      feelingText: item.moodEntry?.feelingText || "-",
      predictedLabel: item.predictedLabel || "-",
      supportMessage: item.supportMessage || "-",
      confidenceScore: item.confidenceScore ?? "-",
      modelName: item.modelName || "-",
      entryDate: item.moodEntry?.entryDate || "-",
      createdAt: item.createdAt,
    });
  });

  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).alignment = {
    vertical: "middle",
    horizontal: "center",
  };

  return workbook;
};

module.exports = {
  getEncouragementResults,
  getEncouragementResultById,
  exportEncouragementResultsExcel,
};

const prisma = require("../../config/prisma");
const ExcelJS = require("exceljs");

const buildMoodEntryWhere = (query) => {
  const { search, moodLabelId, analysisStatus, startDate, endDate, userId } =
    query;

  const where = {};

  if (userId) where.userId = userId;
  if (moodLabelId) where.moodLabelId = moodLabelId;
  if (analysisStatus) where.analysisStatus = analysisStatus;

  if (startDate || endDate) {
    where.entryDate = {};
  }

  if (startDate) where.entryDate.gte = new Date(startDate);
  if (endDate) where.entryDate.lte = new Date(endDate);

  if (search) {
    where.OR = [
      { feelingText: { contains: search, mode: "insensitive" } },
      { user: { fullName: { contains: search, mode: "insensitive" } } },
      { user: { email: { contains: search, mode: "insensitive" } } },
      { user: { username: { contains: search, mode: "insensitive" } } },
    ];
  }
  return where;
};

const moodEntrySelect = {
  id: true,
  feelingText: true,
  moodScore: true,
  analysisStatus: true,
  analysisError: true,
  entryDate: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      fullName: true,
      username: true,
      email: true,
      profilePhotoUrl: true,
    },
  },
  moodLabel: {
    select: {
      id: true,
      name: true,
      emoji: true,
      paperColor: true,
    },
  },
  encouragementResult: {
    select: {
      id: true,
      predictedLabel: true,
      supportMessage: true,
      confidenceScore: true,
      modelName: true,
      createdAt: true,
    },
  },
};

const getMoodEntries = async (query) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const sort = query.sort === "asc" ? "asc" : "desc";

  const skip = (page - 1) * limit;
  const where = buildMoodEntryWhere(query);

  const [moodEntries, total] = await Promise.all([
    prisma.moodEntry.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: sort,
      },
      select: moodEntrySelect,
    }),
    prisma.moodEntry.count({ where }),
  ]);

  return {
    data: moodEntries.map((entry, index) => ({
      no: skip + index + 1,
      id: entry.id,
      user: entry.user,
      mood: entry.moodLabel,
      moodScore: entry.moodScore,
      feelingText: entry.feelingText,
      analysisStatus: entry.analysisStatus,
      analysisError: entry.analysisError,
      entryDate: entry.entryDate,
      createdAt: entry.createdAt,
      aiResult: entry.encouragementResult
        ? {
            predictedLabel: entry.encouragementResult.predictedLabel,
            supportMessage: entry.encouragementResult.supportMessage,
            confidenceScore: entry.encouragementResult.confidenceScore,
            modelName: entry.encouragementResult.modelName,
          }
        : null,
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
        moodLabelId: query.moodLabelId || null,
        analysisStatus: query.analysisStatus || null,
        startDate: query.startDate || null,
        endDate: query.endDate || null,
      },
    },
  };
};

const getMoodEntryDetail = async (id) => {
  const moodEntry = await prisma.moodEntry.findUnique({
    where: { id },
    select: moodEntrySelect,
  });

  if (!moodEntry) {
    const error = new Error("Mood entry tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }
  return moodEntry;
};

const exportMoodEntriesExcel = async (query) => {
  const sort = query.sort === "asc" ? "asc" : "desc";
  const where = buildMoodEntryWhere(query);

  const moodEntries = await prisma.moodEntry.findMany({
    where,
    orderBy: {
      entryDate: sort,
    },
    select: moodEntrySelect,
  });

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Mood Entries");

  worksheet.columns = [
    { header: "No", key: "no", width: 8 },
    { header: "User", key: "user", width: 25 },
    { header: "Email", key: "email", width: 30 },
    { header: "Mood", key: "mood", width: 18 },
    { header: "Emoji", key: "emoji", width: 10 },
    { header: "Mood Score", key: "moodScore", width: 15 },
    { header: "Feeling Text", key: "feelingText", width: 50 },
    { header: "Analysis Status", key: "analysisStatus", width: 18 },
    { header: "Analysis Error", key: "analysisError", width: 35 },
    { header: "Entry Date", key: "entryDate", width: 22 },
    { header: "AI Predicted Label", key: "predictedLabel", width: 22 },
    { header: "AI Support Message", key: "supportMessage", width: 50 },
    { header: "AI Confidence Score", key: "confidenceScore", width: 22 },
    { header: "AI Model", key: "modelName", width: 20 },
  ];

  moodEntries.forEach((entry, index) => {
    worksheet.addRow({
      no: index + 1,
      user: entry.user?.fullName || entry.user?.username || "-",
      email: entry.user?.email || "-",
      mood: entry.moodLabel?.name || "-",
      emoji: entry.moodLabel?.emoji || "-",
      moodScore: entry.moodScore ?? "-",
      feelingText: entry.feelingText,
      analysisStatus: entry.analysisStatus,
      analysisError: entry.analysisError || "-",
      entryDate: entry.entryDate,
      predictedLabel: entry.encouragementResult?.predictedLabel || "-",
      supportMessage: entry.encouragementResult?.supportMessage || "-",
      confidenceScore: entry.encouragementResult?.confidenceScore ?? "-",
      modelName: entry.encouragementResult?.modelName || "-",
    });
  });
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" };

  return workbook;
};

module.exports = {
  getMoodEntries,
  getMoodEntryDetail,
  exportMoodEntriesExcel,
};

const prisma = require("../../config/prisma");
const ExcelJS = require("exceljs");

const buildSocialBatteryLogWhere = (query) => {
  const {
    search,
    userId,
    batteryStatusId,
    startDate,
    endDate,
    minBatteryScore,
    maxBatteryScore,
    minSocialIntensityScore,
    maxSocialIntensityScore,
  } = query;

  const where = {};

  if (userId) where.userId = userId;
  if (batteryStatusId) where.batteryStatusId = batteryStatusId;

  if (startDate || endDate) {
    where.date = {};
  }

  if (startDate) where.date.gte = new Date(startDate);
  if (endDate) where.date.lte = new Date(endDate);

  if (minBatteryScore || maxBatteryScore) {
    where.batteryScore = {};
  }

  if (minBatteryScore) where.batteryScore.gte = Number(minBatteryScore);
  if (maxBatteryScore) where.batteryScore.lte = Number(maxBatteryScore);

  if (minSocialIntensityScore || maxSocialIntensityScore) {
    where.socialIntensityScore = {};
  }

  if (minSocialIntensityScore) {
    where.socialIntensityScore.gte = Number(minSocialIntensityScore);
  }

  if (maxSocialIntensityScore) {
    where.socialIntensityScore.lte = Number(maxSocialIntensityScore);
  }

  if (search) {
    where.OR = [
      { calculationNotes: { contains: search, mode: "insensitive" } },
      { aiInsight: { contains: search, mode: "insensitive" } },
      { aiScoreExplanation: { contains: search, mode: "insensitive" } },
      { recoverySuggestion: { contains: search, mode: "insensitive" } },
      { aiModelName: { contains: search, mode: "insensitive" } },
      { user: { fullName: { contains: search, mode: "insensitive" } } },
      { user: { email: { contains: search, mode: "insensitive" } } },
      { user: { username: { contains: search, mode: "insensitive" } } },
      { batteryStatus: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  return where;
};

const socialBatteryLogSelect = {
  id: true,
  date: true,
  totalEvents: true,
  totalDurationMinutes: true,
  socialIntensityScore: true,
  batteryScore: true,
  calculationNotes: true,
  aiInsight: true,
  aiScoreExplanation: true,
  recoverySuggestion: true,
  aiModelName: true,
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
  batteryStatus: {
    select: {
      id: true,
      name: true,
      description: true,
      minScore: true,
      maxScore: true,
      color: true,
    },
  },
};

const getSocialBatteryLogs = async (query) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const sort = query.sort === "asc" ? "asc" : "desc";

  const skip = (page - 1) * limit;
  const where = buildSocialBatteryLogWhere(query);

  const [logs, total] = await Promise.all([
    prisma.socialBatteryLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        date: sort,
      },
      select: socialBatteryLogSelect,
    }),
    prisma.socialBatteryLog.count({ where }),
  ]);

  return {
    data: logs.map((log, index) => ({
      no: skip + index + 1,
      id: log.id,
      user: log.user,
      batteryStatus: log.batteryStatus,
      date: log.date,
      totalEvents: log.totalEvents,
      totalDurationMinutes: log.totalDurationMinutes,
      socialIntensityScore: log.socialIntensityScore,
      batteryScore: log.batteryScore,
      calculationNotes: log.calculationNotes,
      aiInsight: log.aiInsight,
      aiScoreExplanation: log.aiScoreExplanation,
      recoverySuggestion: log.recoverySuggestion,
      aiModelName: log.aiModelName,
      createdAt: log.createdAt,
      updatedAt: log.updatedAt,
    })),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
      sortBy: "date",
      sortOrder: sort,
      search: query.search || null,
      filters: {
        userId: query.userId || null,
        batteryStatusId: query.batteryStatusId || null,
        startDate: query.startDate || null,
        endDate: query.endDate || null,
        minBatteryScore: query.minBatteryScore || null,
        maxBatteryScore: query.maxBatteryScore || null,
        minSocialIntensityScore: query.minSocialIntensityScore || null,
        maxSocialIntensityScore: query.maxSocialIntensityScore || null,
      },
    },
  };
};

const getSocialBatteryLogDetail = async (id) => {
  const log = await prisma.socialBatteryLog.findUnique({
    where: { id },
    select: socialBatteryLogSelect,
  });

  if (!log) {
    const error = new Error("Social battery log tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  return log;
};

const getSocialBatteryLogSummary = async (query) => {
  const where = buildSocialBatteryLogWhere(query);

  const [totalLogs, uniqueUsers, aggregate, statusGroups] = await Promise.all([
    prisma.socialBatteryLog.count({ where }),

    prisma.socialBatteryLog.findMany({
      where,
      distinct: ["userId"],
      select: {
        userId: true,
      },
    }),

    prisma.socialBatteryLog.aggregate({
      where,
      _avg: {
        batteryScore: true,
        socialIntensityScore: true,
      },
      _sum: {
        totalEvents: true,
        totalDurationMinutes: true,
      },
    }),

    prisma.socialBatteryLog.groupBy({
      by: ["batteryStatusId"],
      where,
      _count: {
        batteryStatusId: true,
      },
    }),
  ]);

  const batteryStatusIds = statusGroups.map((item) => item.batteryStatusId);

  const batteryStatuses = await prisma.batteryStatus.findMany({
    where: {
      id: {
        in: batteryStatusIds,
      },
    },
    select: {
      id: true,
      name: true,
      color: true,
    },
  });

  const batteryStatusCounts = statusGroups.map((group) => {
    const status = batteryStatuses.find(
      (item) => item.id === group.batteryStatusId,
    );

    return {
      batteryStatusId: group.batteryStatusId,
      name: status?.name || "-",
      color: status?.color || null,
      total: group._count.batteryStatusId,
    };
  });

  return {
    totalLogs,
    totalUsers: uniqueUsers.length,
    averageBatteryScore: aggregate._avg.batteryScore || 0,
    averageSocialIntensityScore: aggregate._avg.socialIntensityScore || 0,
    totalEvents: aggregate._sum.totalEvents || 0,
    totalDurationMinutes: aggregate._sum.totalDurationMinutes || 0,
    batteryStatusCounts,
  };
};

const exportSocialBatteryLogsExcel = async (query) => {
  const sort = query.sort === "asc" ? "asc" : "desc";
  const where = buildSocialBatteryLogWhere(query);

  const logs = await prisma.socialBatteryLog.findMany({
    where,
    orderBy: {
      date: sort,
    },
    select: socialBatteryLogSelect,
  });

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Social Battery Logs");

  worksheet.columns = [
    { header: "No", key: "no", width: 8 },
    { header: "User", key: "user", width: 25 },
    { header: "Email", key: "email", width: 30 },
    { header: "Battery Status", key: "batteryStatus", width: 20 },
    { header: "Battery Score", key: "batteryScore", width: 18 },
    {
      header: "Social Intensity Score",
      key: "socialIntensityScore",
      width: 25,
    },
    { header: "Total Events", key: "totalEvents", width: 15 },
    {
      header: "Total Duration Minutes",
      key: "totalDurationMinutes",
      width: 25,
    },
    { header: "Date", key: "date", width: 22 },
    { header: "Calculation Notes", key: "calculationNotes", width: 45 },
    { header: "AI Insight", key: "aiInsight", width: 45 },
    { header: "AI Score Explanation", key: "aiScoreExplanation", width: 50 },
    { header: "Recovery Suggestion", key: "recoverySuggestion", width: 50 },
    { header: "AI Model", key: "aiModelName", width: 22 },
    { header: "Created At", key: "createdAt", width: 22 },
  ];

  logs.forEach((log, index) => {
    worksheet.addRow({
      no: index + 1,
      user: log.user?.fullName || log.user?.username || "-",
      email: log.user?.email || "-",
      batteryStatus: log.batteryStatus?.name || "-",
      batteryScore: log.batteryScore ?? "-",
      socialIntensityScore: log.socialIntensityScore ?? "-",
      totalEvents: log.totalEvents ?? 0,
      totalDurationMinutes: log.totalDurationMinutes ?? 0,
      date: log.date,
      calculationNotes: log.calculationNotes || "-",
      aiInsight: log.aiInsight || "-",
      aiScoreExplanation: log.aiScoreExplanation || "-",
      recoverySuggestion: log.recoverySuggestion || "-",
      aiModelName: log.aiModelName || "-",
      createdAt: log.createdAt,
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
  getSocialBatteryLogs,
  getSocialBatteryLogDetail,
  getSocialBatteryLogSummary,
  exportSocialBatteryLogsExcel,
};

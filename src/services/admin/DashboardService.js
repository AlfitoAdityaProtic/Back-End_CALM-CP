const prisma = require("../../config/prisma");

const getDashboardSummary = async () => {
  const [
    totalUsers,
    totalMoodEntries,
    totalSupportMessages,
    failedAnalysis,
    pendingAnalysis,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.moodEntry.count(),
    prisma.encouragementResult.count(),
    prisma.moodEntry.count({
      where: { analysisStatus: "failed" },
    }),
    prisma.moodEntry.count({
      where: { analysisStatus: "pending" },
    }),
  ]);

  return {
    totalUsers,
    totalMoodEntries,
    totalSupportMessages,
    analysisProblems: {
      failed: failedAnalysis,
      pending: pendingAnalysis,
      total: failedAnalysis + pendingAnalysis,
    },
  };
};

const getUserGrowthChart = async () => {
  const users = await prisma.user.findMany({
    select: {
      createdAt: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const grouped = {};

  users.forEach((user) => {
    const month = user.createdAt.toISOString().slice(0, 7); // YYYY-MM
    grouped[month] = (grouped[month] || 0) + 1;
  });

  return Object.entries(grouped).map(([month, total]) => ({
    month,
    total,
  }));
};

const getMoodDistributionChart = async () => {
  const moodEntries = await prisma.moodEntry.groupBy({
    by: ["moodLabelId"],
    _count: {
      id: true,
    },
  });

  const moodLabels = await prisma.moodLabel.findMany({
    select: {
      id: true,
      name: true,
      emoji: true,
      paperColor: true,
    },
  });

  return moodEntries.map((entry) => {
    const label = moodLabels.find((item) => item.id === entry.moodLabelId);

    return {
      moodLabelId: entry.moodLabelId,
      name: label?.name || "Unknown",
      emoji: label?.emoji || null,
      color: label?.paperColor || null,
      total: entry._count.id,
    };
  });
};

const getMoodTrendChart = async () => {
  const moodEntries = await prisma.moodEntry.findMany({
    where: {
      moodScore: {
        not: null,
      },
    },
    select: {
      moodScore: true,
      entryDate: true,
    },
    orderBy: {
      entryDate: "asc",
    },
  });

  const grouped = {};

  moodEntries.forEach((entry) => {
    const date = entry.entryDate.toISOString().slice(0, 10); // YYYY-MM-DD

    if (!grouped[date]) {
      grouped[date] = {
        totalScore: 0,
        count: 0,
      };
    }

    grouped[date].totalScore += entry.moodScore;
    grouped[date].count += 1;
  });

  return Object.entries(grouped).map(([date, value]) => ({
    date,
    averageMoodScore: Number((value.totalScore / value.count).toFixed(2)),
  }));
};

const getSocialBatteryTrendChart = async () => {
  const logs = await prisma.socialBatteryLog.findMany({
    select: {
      date: true,
      batteryScore: true,
      socialIntensityScore: true,
    },
    orderBy: {
      date: "asc",
    },
  });

  const grouped = {};

  logs.forEach((log) => {
    const date = log.date.toISOString().slice(0, 10);

    if (!grouped[date]) {
      grouped[date] = {
        totalBatteryScore: 0,
        totalSocialIntensityScore: 0,
        count: 0,
      };
    }

    grouped[date].totalBatteryScore += log.batteryScore;
    grouped[date].totalSocialIntensityScore += log.socialIntensityScore;
    grouped[date].count += 1;
  });

  return Object.entries(grouped).map(([date, value]) => ({
    date,
    averageBatteryScore: Number(
      (value.totalBatteryScore / value.count).toFixed(2),
    ),
    averageSocialIntensityScore: Number(
      (value.totalSocialIntensityScore / value.count).toFixed(2),
    ),
  }));
};

const getSocialBatteryStatusDistributionChart = async () => {
  const batteryLogs = await prisma.socialBatteryLog.groupBy({
    by: ["batteryStatusId"],
    _count: {
      id: true,
    },
  });

  const batteryStatuses = await prisma.batteryStatus.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      color: true,
    },
  });

  return batteryLogs.map((log) => {
    const status = batteryStatuses.find(
      (item) => item.id === log.batteryStatusId,
    );

    return {
      batteryStatusId: log.batteryStatusId,
      name: status?.name || "Unknown",
      description: status?.description || null,
      color: status?.color || null,
      total: log._count.id,
    };
  });
};

const getRecentActivityTable = async () => {
  return prisma.activityLog.findMany({
    take: 10,
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      action: true,
      description: true,
      ipAddress: true,
      userAgent: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          email: true,
          fullName: true,
          username: true,
        },
      },
    },
  });
};

const getDashboardData = async () => {
  const [
    summary,
    userGrowth,
    moodDistribution,
    moodTrend,
    socialBatteryTrend,
    socialBatteryStatusDistribution,
    recentActivities,
  ] = await Promise.all([
    getDashboardSummary(),
    getUserGrowthChart(),
    getMoodDistributionChart(),
    getMoodTrendChart(),
    getSocialBatteryTrendChart(),
    getSocialBatteryStatusDistributionChart(),
    getRecentActivityTable(),
  ]);

  return {
    summary,
    charts: {
      userGrowth,
      moodDistribution,
      moodTrend,
      socialBatteryTrend,
      socialBatteryStatusDistribution,
    },
    recentActivities,
  };
};

module.exports = {
  getDashboardData,
  getDashboardSummary,
  getUserGrowthChart,
  getMoodDistributionChart,
  getMoodTrendChart,
  getSocialBatteryTrendChart,
  getSocialBatteryStatusDistributionChart,
  getRecentActivityTable,
};

const prisma = require("../../config/prisma");
const socialBatteryService = require("./socialBattery/socialBatteryService");
const moodEntryService = require("./moodJar/moodEntryService");

async function getDashboardUser(userId) {
  if (!userId) {
    throw new Error("User ID is required");
  }

  const [user, socialBattery, moodEntriesResult] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          fullName: true,
          username: true,
        },
      }),

      socialBatteryService.getTodaySocialBattery(userId),
      moodEntryService.getMyMoodEntries(userId, {
        page: 1,
        limit: 1,
      }),
    ]);

  if (!user) {
    const error = new Error("User tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  const moodEntries = moodEntriesResult?.data || [];
  const latestMood = moodEntries[0] || null;

  return {
    user,
    greeting: {
      title: `Hi, ${user.fullName || user.username || "user"} !`,
      subtitle:
        "Biar Interaksi jalan terus dan mental tetap aman, yuk pantau social battery-mu sekarang!",
    },
    socialBattery: {
      score: socialBattery?.batteryScore || 0,
      status: socialBattery?.batteryStatus?.name || "unknown",
      totalEvents: socialBattery?.totalEvents || 0,
      socialIntensityScore: socialBattery?.socialIntensityScore || 0,
      recoverySuggestion: socialBattery?.recoverySuggestion || null,
    },
    moodSummary: {
      latestSupportMessage:
        latestMood?.encouragementResult?.supportMessage || null,
    },
  };
}

module.exports = {
  getDashboardUser,
};

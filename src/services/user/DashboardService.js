const prisma = require("../../config/prisma");
const socialBatteryService = require("./socialBattery/socialBatteryService");
const googleCalendarService = require("./googleCalendarService");
const moodEntryService = require("./moodJar/moodEntryService");

function getStartAndEndOfDay(date = new Date()) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

async function getDashboardUser(userId) {
  if (!userId) {
    throw new Error("User ID is required");
  }

  const { start, end } = getStartAndEndOfDay();

  const [user, socialBattery, dailyEvents, moodEntriesResult] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          fullName: true,
          username: true,
          profilePhotoUrl: true,
        },
      }),

      socialBatteryService.getTodaySocialBattery(userId),

      googleCalendarService.getCalendarEventsByRange(userId, start, end),

      moodEntryService.getMyMoodEntries(userId, {
        page: 1,
        limit: 7,
      }),
    ]);

  if (!user) {
    const error = new Error("User tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  const moodEntries = moodEntriesResult.data || [];
  const latestMood = moodEntries[0] || null;

  const moodSummary = buildMoodSummary(moodEntries);

  return {
    user,
    greeting: {
      title: `Hi, ${user.fullName || user.username || "user"} !`,
      // subtitle: "Let's help you stay on the top of your social battery",
      subtitle:
        "Biar Interaksi jalan terus dan mental tetap aman, yuk pantau social battery-mu sekarang!",
    },
    socialBattery: formatSocialBattery(socialBattery),
    dailyEvents: dailyEvents.map(formatDailyEvent),
    moodSummary: {
      ...moodSummary,
      latestSupportMessage:
        latestMood?.encouragementResult?.supportMessage || null,
    },
  };
}

function formatSocialBattery(log) {
  if (!log) {
    return {
      score: 0,
      status: "unknown",
      statusColor: null,
      totalEvents: 0,
      totalDurationMinutes: 0,
      socialIntensityScore: 0,
      aiInsight: null,
      recoverySuggestion: null,
    };
  }

  return {
    score: log.batteryScore,
    status: log.batteryStatus?.name || "unknown",
    statusColor: log.batteryStatus?.color || null,
    totalEvents: log.totalEvents,
    totalDurationMinutes: log.totalDurationMinutes,
    socialIntensityScore: log.socialIntensityScore,
    aiInsight: log.aiInsight,
    recoverySuggestion: log.recoverySuggestion,
  };
}

function formatDailyEvent(event) {
  return {
    id: event.id,
    title: event.title,
    startTime: event.startTime,
    endTime: event.endTime,
    location: event.location,
    attendeeCount: event.attendeeCount,
    eventType: event.eventType,
  };
}

function buildMoodSummary(entries) {
  if (!entries.length) {
    return {
      totalEntries: 0,
      averageMoodScore: null,
      happyDays: 0,
      difficultDays: 0,
      summaryText: "Belum ada mood entry minggu ini.",
    };
  }

  const scores = entries
    .map((entry) => entry.moodScore)
    .filter((score) => typeof score === "number");

  const averageMoodScore = scores.length
    ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2))
    : null;

  const happyDays = scores.filter((score) => score >= 70).length;
  const difficultDays = scores.filter((score) => score < 50).length;

  return {
    totalEntries: entries.length,
    averageMoodScore,
    happyDays,
    difficultDays,
    summaryText: `Minggu ini kamu punya ${happyDays} hari yang cukup membaik dan ${difficultDays} hari yang cukup berat. Jangan lupa istirahat dulu!`,
  };
}

module.exports = {
  getDashboardUser,
};

const prisma = require("../../../config/prisma");
const logActivity = require("../../../utils/activityLogger");
const { getIO } = require("../../../config/socket");
const notificationService = require("../notificationService");
const aiSocialBatteryService = require("./ai-socialBatteryService");

function getStartAndEndOfDay(date) {
  let targetDate;

  // Kalau date string format "YYYY-MM-DD" dari frontend
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [year, month, day] = date.split("-").map(Number);
    targetDate = new Date(year, month - 1, day); // parse sebagai local time
  } else {
    targetDate = new Date(date);
  }

  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  return { startOfDay, endOfDay };
}

function calculateDurationMinutes(startTime, endTime) {
  const start = new Date(startTime);
  const end = new Date(endTime);

  const durationMs = end - start;
  return Math.max(0, Math.floor(durationMs / 60000));
}

function calculateSocialIntensityScore(events, totalDurationMinutes) {
  const totalEvents = events.length;
  const totalDurationHours = totalDurationMinutes / 60;

  let attendeeScore = 0;
  let longEventPenalty = 0;

  for (const event of events) {
    const attendeeCount = event.attendeeCount || 0;
    const duration = calculateDurationMinutes(event.startTime, event.endTime);

    if (attendeeCount >= 5) {
      attendeeScore += 5;
    }

    if (attendeeCount >= 10) {
      attendeeScore += 15;
    }

    if (duration >= 180) {
      longEventPenalty += 5;
    }
  }

  const eventScore = totalEvents * 1.5;
  const durationScore = totalDurationHours * 3;

  return Math.min(
    100,
    eventScore + durationScore + attendeeScore + longEventPenalty,
  );
}

function calculateBatteryScore(socialIntensityScore) {
  return Math.max(0, Math.min(100, 100 - socialIntensityScore));
}

// rumus calculation notes
function buildCalculationNotes({
  totalEvents,
  totalDurationMinutes,
  socialIntensityScore,
  batteryScore,
}) {
  return `Social battery dihitung dari ${totalEvents} event dengan total durasi ${totalDurationMinutes} menit. Social intensity score adalah ${socialIntensityScore.toFixed(
    2,
  )}, sehingga battery score menjadi ${batteryScore.toFixed(2)}.`;
}

async function getBatteryStatusByScore(batteryScore) {
  const batteryStatus = await prisma.batteryStatus.findFirst({
    where: {
      isActive: true,
      minScore: {
        lte: batteryScore,
      },
      maxScore: {
        gte: batteryScore,
      },
    },
  });

  if (!batteryStatus) {
    throw new Error("Battery status not found for this score");
  }

  return batteryStatus;
}

async function getActiveGoogleAccount(userId) {
  const googleAccount = await prisma.googleAccount.findUnique({
    where: { userId },
  });

  if (!googleAccount) {
    throw new Error("Google account not connected");
  }

  return googleAccount;
}

// fungsi untuk menghitung social battery
async function calculateSocialBatteryByDate(
  userId,
  date = new Date(),
  ipAddress = null,
  userAgent = null,
) {
  if (!userId) {
    throw new Error("User ID is required");
  }

  const { startOfDay, endOfDay } = getStartAndEndOfDay(date);
  const googleAccount = await getActiveGoogleAccount(userId);

  const events = await prisma.calendarEvent.findMany({
    where: {
      userId,
      googleAccountId: googleAccount.id,
      AND: [
        {
          startTime: {
            lte: endOfDay,
          },
        },
        {
          endTime: {
            gte: startOfDay,
          },
        },
      ],
    },
    orderBy: {
      startTime: "asc",
    },
  });

  const totalEvents = events.length;

  const totalDurationMinutes = events.reduce((total, event) => {
    return total + calculateDurationMinutes(event.startTime, event.endTime);
  }, 0);

  const socialIntensityScore = Number(
    calculateSocialIntensityScore(events, totalDurationMinutes).toFixed(2),
  );

  const batteryScore = Number(
    calculateBatteryScore(socialIntensityScore).toFixed(2),
  );

  const batteryStatus = await getBatteryStatusByScore(batteryScore);

  const calculationNotes = buildCalculationNotes({
    totalEvents,
    totalDurationMinutes,
    socialIntensityScore,
    batteryScore,
  });

  const socialBatteryLog = await prisma.socialBatteryLog.upsert({
    where: {
      userId_date: {
        userId,
        date: startOfDay,
      },
    },
    update: {
      batteryStatusId: batteryStatus.id,
      totalEvents,
      totalDurationMinutes,
      socialIntensityScore,
      batteryScore,
      calculationNotes,
    },
    create: {
      userId,
      batteryStatusId: batteryStatus.id,
      date: startOfDay,
      totalEvents,
      totalDurationMinutes,
      socialIntensityScore,
      batteryScore,
      calculationNotes,
    },
    include: {
      batteryStatus: true,
    },
  });

  await logActivity({
    userId,
    action: "SOCIAL_BATTERY_CALCULATE",
    description: `User menghitung social battery untuk tanggal ${startOfDay
      .toISOString()
      .slice(0, 10)} dengan score ${batteryScore.toFixed(2)}`,
    ipAddress,
    userAgent,
  });
  getIO().to("admin_dashboard").emit("dashboard_updated", {
    type: "CALCULATE_SOCIAL_BATTERY_LOG",
  });

  return socialBatteryLog;
}

async function getTodaySocialBattery(userId) {
  const { startOfDay } = getStartAndEndOfDay(new Date());

  return prisma.socialBatteryLog.findUnique({
    where: {
      userId_date: {
        userId,
        date: startOfDay,
      },
    },
    include: {
      batteryStatus: true,
    },
  });
}

async function getSocialBatteryByDate(userId, date) {
  const { startOfDay } = getStartAndEndOfDay(date);

  return prisma.socialBatteryLog.findUnique({
    where: {
      userId_date: {
        userId,
        date: startOfDay,
      },
    },
    include: {
      batteryStatus: true,
    },
  });
}

async function getSocialBatteryHistory(userId, page = 1, limit = 7) {
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.socialBatteryLog.findMany({
      where: {
        userId,
      },
      include: {
        batteryStatus: true,
      },
      orderBy: {
        date: "desc",
      },
      skip,
      take: limit,
    }),
    prisma.socialBatteryLog.count({
      where: {
        userId,
      },
    }),
  ]);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

async function generateSocialBatteryAiInsight(
  userId,
  date = new Date(),
  ipAddress = null,
  userAgent = null,
) {
  if (!userId) {
    throw new Error("User ID is required");
  }

  const { startOfDay, endOfDay } = getStartAndEndOfDay(date);
  const googleAccount = await getActiveGoogleAccount(userId);

  const socialBatteryLog = await prisma.socialBatteryLog.findUnique({
    where: {
      userId_date: {
        userId,
        date: startOfDay,
      },
    },
    include: {
      batteryStatus: true,
    },
  });

  if (!socialBatteryLog) {
    throw new Error(
      "Social battery Tidak Ditemukan, Tolong Sinkronkan Kalender Anda terlebih dahulu.",
    );
  }

  const events = await prisma.calendarEvent.findMany({
    where: {
      userId,
      googleAccountId: googleAccount.id,
      AND: [
        {
          startTime: {
            lte: endOfDay,
          },
        },
        {
          endTime: {
            gte: startOfDay,
          },
        },
      ],
    },
    orderBy: {
      startTime: "asc",
    },
  });

  const aiPayload = {
    totalEvents: socialBatteryLog.totalEvents,
    totalDurationMinutes: socialBatteryLog.totalDurationMinutes,
    socialIntensityScore: socialBatteryLog.socialIntensityScore,
    batteryScore: socialBatteryLog.batteryScore,
    batteryStatus: socialBatteryLog.batteryStatus.name,
    events: events.map((event) => ({
      title: event.title,
      startTime: event.startTime,
      endTime: event.endTime,
      attendeeCount: Math.max(event.attendeeCount ?? 1, 1),
      location: event.location,
      eventType: event.eventType,
    })),
  };

  const aiResult =
    await aiSocialBatteryService.generateSocialBatteryInsight(aiPayload);

  const { aiInsight, aiScoreExplanation, recoverySuggestion, aiModelName } =
    aiResult;

  const updatedLog = await prisma.socialBatteryLog.update({
    where: {
      userId_date: {
        userId,
        date: startOfDay,
      },
    },
    data: {
      aiInsight,
      aiScoreExplanation,
      recoverySuggestion,
      aiModelName,
    },
    include: {
      batteryStatus: true,
    },
  });

  await logActivity({
    userId,
    action: "SOCIAL_BATTERY_AI_INSIGHT_GENERATE",
    description: `User generate AI insight social battery untuk tanggal ${startOfDay
      .toISOString()
      .slice(0, 10)}`,
    ipAddress,
    userAgent,
  });

  getIO().to("admin_dashboard").emit("dashboard_updated", {
    type: "CREATE_AI_INSIGHT_SOCIAL_BATTERY_LOG",
  });

  const socialBatteryNotificationMessage =
    `Social Battery-mu sudah dicek nih 😌\n` +
    `${aiInsight} 🌟\n\n` +
    `${aiScoreExplanation} 💛\n\n` +
    `Tips dari CALM:\n` +
    `${recoverySuggestion} 😊\n\n` +
    `Insight ini dianalisis menggunakan model AI: ${aiModelName}`;

  const socialBatteryNotificationHtml =
    `Social Battery-mu sudah dicek nih 😌<br>` +
    `${aiInsight} 🌟<br><br>` +
    `${aiScoreExplanation} 💛<br><br>` +
    `Tips dari CALM:<br>` +
    `${recoverySuggestion} 😊<br><br>` +
    `<i>Insight ini dianalisis menggunakan model AI: ${aiModelName}</i>`;

  await notificationService.sendAllNotifications({
    userId,
    type: "social_battery_result",
    title: "Social Battery kamu sudah dianalisis",
    message: socialBatteryNotificationMessage, // ← WA & in-app
    htmlMessage: socialBatteryNotificationHtml, // ← email
    relatedSocialBatteryLogId: updatedLog.id,
  });

  return {
    socialBattery: updatedLog,
    events: aiPayload.events,
  };
}

module.exports = {
  calculateSocialBatteryByDate,
  getTodaySocialBattery,
  getSocialBatteryByDate,
  getSocialBatteryHistory,
  generateSocialBatteryAiInsight,
};

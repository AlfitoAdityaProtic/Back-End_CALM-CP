const prisma = require("../../config/prisma");
const logActivity = require("../../utils/activityLogger");
const { getIO } = require("../../config/socket");

function getStartAndEndOfDay(date) {
  const targetDate = new Date(date);

  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  return { startOfDay, endOfDay };
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
      "Social battery log not found. Please sync calendar first.",
    );
  }

  const events = await prisma.calendarEvent.findMany({
    where: {
      userId,
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

  // TODO: nanti bagian ini diganti dengan real AI integration
  const aiInsight = `Hari ini kamu memiliki ${socialBatteryLog.totalEvents} event dengan total durasi ${socialBatteryLog.totalDurationMinutes} menit. Aktivitas sosialmu berada pada level ${socialBatteryLog.batteryStatus.name}.`;

  const aiScoreExplanation = `Score ${socialBatteryLog.batteryScore.toFixed(
    2,
  )} dihitung berdasarkan jumlah event, total durasi, jumlah attendee, dan event berdurasi panjang. Semakin padat jadwal dan semakin tinggi intensitas sosial, semakin rendah battery score.`;

  const recoverySuggestion =
    socialBatteryLog.batteryScore >= 80
      ? "Energi sosialmu masih cukup baik. Tetap jaga jeda antar aktivitas agar tidak cepat terkuras."
      : socialBatteryLog.batteryScore >= 50
        ? "Ambil jeda singkat 15-30 menit setelah aktivitas sosial yang padat."
        : "Prioritaskan waktu tenang, kurangi aktivitas sosial tambahan, dan coba istirahat tanpa notifikasi.";

  const aiModelName = "dummy-ai-v1";

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

  return {
    socialBattery: updatedLog,
    events,
  };
}

module.exports = {
  generateSocialBatteryAiInsight,
};

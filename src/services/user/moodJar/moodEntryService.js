const prisma = require("../../../config/prisma");
const aiAnalysisService = require("./ai-analysisMoodService");
const notificationService = require("../notificationService");
const logActivity = require("../../../utils/activityLogger");
const { getIO } = require("../../../config/socket");

const createMoodEntry = async (userId, data, meta = {}) => {
  const moodLabelId = data.moodLabelId;
  const feelingText =
    typeof data.feelingText === "string" ? data.feelingText.trim() : "";
  const { ipAddress = null, userAgent = null } = meta;

  if (!moodLabelId) {
    const error = new Error("Mood label wajib dipilih");
    error.statusCode = 400;
    throw error;
  }

  if (!feelingText) {
    const error = new Error("Feeling text wajib diisi");
    error.statusCode = 400;
    throw error;
  }

  const moodLabel = await prisma.moodLabel.findFirst({
    where: {
      id: moodLabelId,
      isActive: true,
    },
  });

  if (!moodLabel) {
    const error = new Error("Mood label tidak valid atau tidak aktif");
    error.statusCode = 404;
    throw error;
  }
  // CEK APAKAH USER SUDAH INPUT HARI INI
  const now = new Date();

  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const existingMoodEntryToday = await prisma.moodEntry.findFirst({
    where: {
      userId,
      entryDate: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
  });

  if (existingMoodEntryToday) {
    const error = new Error("Kamu sudah mengisi mood hari ini");
    error.statusCode = 409;
    throw error;
  }

  // simpan input user dulu
  const moodEntry = await prisma.moodEntry.create({
    data: {
      userId,
      moodLabelId,
      feelingText,
      analysisStatus: "pending",
    },
  });

  try {
    // kirim ke AI/mock
    const aiResult = await aiAnalysisService.analyzeMood({
      feelingText,
    });

    // update mood entry
    const updatedMoodEntry = await prisma.moodEntry.update({
      where: { id: moodEntry.id },
      data: {
        analysisStatus: "success",
        analysisError: null,
      },
    });

    // simpan encouragement result
    const encouragementResult = await prisma.encouragementResult.create({
      data: {
        userId,
        moodEntryId: moodEntry.id,
        predictedLabel: aiResult.predictedLabel ?? null,
        supportMessage: aiResult.supportMessage,
        confidenceScore: aiResult.confidenceScore ?? null,
        modelName: aiResult.modelName ?? null,
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: {
        onboardingCompleted: true,
      },
    });

    const confidencePercentage = Math.round(
      (aiResult.confidenceScore ?? 0) * 100,
    );

    // Plain text → WA & in-app (sudah benar, pertahankan)
    const moodJarNotificationMessage =
      `${moodLabel.emoji} Mood pilihanmu: ${moodLabel.name}\n\n` +
      `AI membaca mood kamu sebagai: ${aiResult.predictedLabel}\n` +
      `Confidence Score: ${confidencePercentage}%\n\n` +
      `${aiResult.supportMessage}`;

    // HTML → email (tambah ini)
    const moodJarNotificationHtml =
      `${moodLabel.emoji} Mood pilihanmu: <strong>${moodLabel.name}</strong><br><br>` +
      `AI membaca mood kamu sebagai: <strong>${aiResult.predictedLabel}</strong><br>` +
      `Confidence Score: <strong>${confidencePercentage}%</strong><br><br>` +
      `${aiResult.supportMessage}`;

    await notificationService.sendAllNotifications({
      userId,
      type: "mood_jar_result",
      title: "Mood Jar berhasil dianalisis",
      message: moodJarNotificationMessage, // ← WA & in-app
      htmlMessage: moodJarNotificationHtml, // ← email
      relatedMoodEntryId: moodEntry.id,
    });

    await logActivity({
      userId,
      action: "CREATE_MOOD_ENTRY",
      description: `User membuat mood entry dengan label ${moodLabel.name} dan feeling text "${feelingText}".`,
      ipAddress,
      userAgent,
    });

    getIO().to("admin_dashboard").emit("dashboard_updated", {
      type: "CREATE_MOOD_ENTRY",
    });

    return {
      moodEntry: updatedMoodEntry,
      encouragementResult,
      onboardingCompleted: true,
    };
  } catch (err) {
    const failedMoodEntry = await prisma.moodEntry.update({
      where: { id: moodEntry.id },
      data: {
        analysisStatus: "failed",
        analysisError: err.message,
      },
    });
    // kalau AI gagal
    await prisma.user.update({
      where: { id: userId },
      data: {
        onboardingCompleted: true,
      },
    });

    await logActivity({
      userId,
      action: "CREATE_MOOD_ENTRY_FAILED",
      description: `Gagal memproses mood entry dengan label "${moodLabel.name}": ${err.message}`,
      ipAddress,
      userAgent,
    });
    getIO().to("admin_dashboard").emit("dashboard_updated", {
      type: "MOOD_ENTRY_FAILED",
    });

    return {
      moodEntry: failedMoodEntry,
      encouragementResult: null,
      onboardingCompleted: true,
      aiFailed: true,
      message:
        "Mood entry berhasil disimpan, namun analisis AI gagal. Silakan coba lagi nanti.",
    };

    // throw err;
  }
};

const getMyMoodEntries = async (userId, query = {}) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.max(Number(query.limit) || 5, 1);
  const skip = (page - 1) * limit;

  const where = { userId };

  const [entries, totalItems] = await Promise.all([
    prisma.moodEntry.findMany({
      where,
      include: {
        moodLabel: true,
        encouragementResult: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    }),
    prisma.moodEntry.count({ where }),
  ]);

  const totalPages = Math.ceil(totalItems / limit);

  return {
    data: entries,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
};

const getMoodEntryById = async (userId, id) => {
  const moodEntry = await prisma.moodEntry.findFirst({
    where: {
      id,
      userId,
    },
    include: {
      moodLabel: true,
      encouragementResult: true,
    },
  });

  if (!moodEntry) {
    const error = new Error("Mood entry tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  return moodEntry;
};

module.exports = {
  createMoodEntry,
  getMyMoodEntries,
  getMoodEntryById,
};

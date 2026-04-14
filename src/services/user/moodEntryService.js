const prisma = require("../../config/prisma");
const aiAnalysisService = require("./ai-analysisMoodService");
const logActivity = require("../../utils/activityLogger");

const createMoodEntry = async (userId, data) => {
  const moodLabelId = data.moodLabelId;
  const feelingText =
    typeof data.feelingText === "string" ? data.feelingText.trim() : "";

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
      moodLabel: moodLabel.name,
      feelingText,
    });

    // update mood entry
    const updatedMoodEntry = await prisma.moodEntry.update({
      where: { id: moodEntry.id },
      data: {
        moodScore: aiResult.moodScore ?? null,
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

    await logActivity({
      userId,
      action: "CREATE_MOOD_ENTRY",
      description: `User membuat mood entry dengan label ${moodLabel.name} dan feeling text "${feelingText}".`,
    });

    return {
      moodEntry: updatedMoodEntry,
      encouragementResult,
    };
  } catch (err) {
    // kalau AI gagal
    await prisma.moodEntry.update({
      where: { id: moodEntry.id },
      data: {
        analysisStatus: "failed",
        analysisError: err.message,
      },
    });

    await logActivity({
      userId,
      action: "CREATE_MOOD_ENTRY_FAILED",
      description: `Gagal memproses mood entry dengan label "${moodLabel.name}": ${err.message}`,
    });

    throw err;
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

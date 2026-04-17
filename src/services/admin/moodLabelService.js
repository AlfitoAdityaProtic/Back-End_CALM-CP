const prisma = require("../../config/prisma");

const normalizeString = (value) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
};

const parseBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return undefined;

  const normalized = value.trim().toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;

  return undefined;
};

const allowedSortFields = [
  "name",
  "score",
  "createdAt",
  "updatedAt",
  "isActive",
];

const allowedSortOrders = ["asc", "desc"];

const validatePaperColor = (value) => {
  if (value === null || value === undefined) return true;

  // Support format hex: #RGB / #RRGGBB
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(value);
};

const validateEmoji = (value) => {
  if (value === null || value === undefined) return true;

  // Maksimal menyesuaikan schema @db.VarChar(16)
  if (value.length > 16) {
    return false;
  }

  // Cek apakah mengandung karakter emoji
  return /\p{Extended_Pictographic}/u.test(value);
};

// Logika untuk membuat Mood Label baru
const createMoodLabel = async (data) => {
  const name = normalizeString(data.name);
  const description = normalizeString(data.description);
  const emoji = normalizeString(data.emoji);
  const paperColor = normalizeString(data.paperColor);

  const score =
    data.score !== undefined && data.score !== null ? Number(data.score) : null;

  if (!name) {
    throw new Error("Nama Mood Label wajib di isi");
  }

  if (score !== null && Number.isNaN(score)) {
    const error = new Error("Score harus berupa angka");
    error.statusCode = 400;
    throw error;
  }

  if (!validateEmoji(emoji)) {
    const error = new Error(
      "Emoji tidak valid. Pastikan emoji benar dan maksimal 16 karakter",
    );
    error.statusCode = 400;
    throw error;
  }

  if (!validatePaperColor(paperColor)) {
    const error = new Error(
      "paperColor harus berupa kode warna hex, contoh: #FDE68A",
    );
    error.statusCode = 400;
    throw error;
  }

  const existingMoodLabel = await prisma.moodLabel.findUnique({
    where: { name },
    select: { id: true },
  });

  if (existingMoodLabel) {
    const error = new Error("Nama Mood Label sudah digunakan");
    error.statusCode = 409;
    throw error;
  }

  const moodLabel = await prisma.moodLabel.create({
    data: {
      name,
      description,
      score,
      emoji,
      paperColor,
      isActive: true,
    },
  });

  return moodLabel;
};

// Logika untuk mendapatkan semua Mood Label dengan server-side table
const getAllMoodLabels = async (query) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);
  const search = normalizeString(query.search);

  const sortBy = allowedSortFields.includes(query.sortBy)
    ? query.sortBy
    : "createdAt";

  const sortOrder = allowedSortOrders.includes(
    String(query.sortOrder).toLowerCase(),
  )
    ? String(query.sortOrder).toLowerCase()
    : "desc";

  const isActive = parseBoolean(query.isActive);

  const score =
    query.score !== undefined && query.score !== null && query.score !== ""
      ? Number(query.score)
      : undefined;

  const fromDate = query.fromDate ? new Date(query.fromDate) : undefined;
  const toDate = query.toDate ? new Date(query.toDate) : undefined;

  if (query.score !== undefined && Number.isNaN(score)) {
    const error = new Error("Filter score harus berupa angka");
    error.statusCode = 400;
    throw error;
  }

  if (fromDate && Number.isNaN(fromDate.getTime())) {
    const error = new Error("fromDate tidak valid");
    error.statusCode = 400;
    throw error;
  }

  if (toDate && Number.isNaN(toDate.getTime())) {
    const error = new Error("toDate tidak valid");
    error.statusCode = 400;
    throw error;
  }

  const where = {};

  if (search) {
    where.OR = [
      {
        name: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        description: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        emoji: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        paperColor: {
          contains: search,
          mode: "insensitive",
        },
      },
    ];
  }

  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  if (score !== undefined) {
    where.score = score;
  }

  if (fromDate || toDate) {
    where.createdAt = {};

    if (fromDate) {
      where.createdAt.gte = fromDate;
    }

    if (toDate) {
      const adjustedToDate = new Date(toDate);
      adjustedToDate.setHours(23, 59, 59, 999);
      where.createdAt.lte = adjustedToDate;
    }
  }

  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.moodLabel.findMany({
      where,
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip,
      take: limit,
    }),
    prisma.moodLabel.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      sortBy,
      sortOrder,
      search: search || null,
      filters: {
        isActive: isActive ?? null,
        score: score ?? null,
        fromDate: query.fromDate || null,
        toDate: query.toDate || null,
      },
    },
  };
};

// Logika untuk mendapatkan Mood Label berdasarkan ID
const getMoodLabelById = async (id) => {
  const moodLabel = await prisma.moodLabel.findUnique({
    where: { id },
  });

  if (!moodLabel) {
    const error = new Error("Mood Label tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  return moodLabel;
};

// Logika untuk memperbarui Mood Label
const updateMoodLabel = async (id, data) => {
  const existingMoodLabel = await prisma.moodLabel.findUnique({
    where: { id },
  });

  if (!existingMoodLabel) {
    const error = new Error("Mood Label tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  const name =
    data.name !== undefined
      ? normalizeString(data.name)
      : existingMoodLabel.name;

  const description =
    data.description !== undefined
      ? normalizeString(data.description)
      : existingMoodLabel.description;

  const emoji =
    data.emoji !== undefined
      ? normalizeString(data.emoji)
      : existingMoodLabel.emoji;

  const paperColor =
    data.paperColor !== undefined
      ? normalizeString(data.paperColor)
      : existingMoodLabel.paperColor;

  const score =
    data.score !== undefined && data.score !== null
      ? Number(data.score)
      : data.score === null
        ? null
        : existingMoodLabel.score;

  const isActive =
    data.isActive !== undefined
      ? data.isActive === true || data.isActive === "true"
      : existingMoodLabel.isActive;

  if (!name) {
    throw new Error("Nama Mood Label wajib di isi");
  }

  if (score !== null && Number.isNaN(score)) {
    const error = new Error("Score harus berupa angka");
    error.statusCode = 400;
    throw error;
  }

  if (!validateEmoji(emoji)) {
    const error = new Error(
      "Emoji tidak valid. Pastikan emoji benar dan maksimal 16 karakter",
    );
    error.statusCode = 400;
    throw error;
  }

  if (!validatePaperColor(paperColor)) {
    const error = new Error(
      "paperColor harus berupa kode warna hex, contoh: #FDE68A",
    );
    error.statusCode = 400;
    throw error;
  }

  const duplicateMoodLabel = await prisma.moodLabel.findFirst({
    where: {
      name,
      NOT: {
        id,
      },
    },
    select: { id: true },
  });

  if (duplicateMoodLabel) {
    const error = new Error("Nama Mood Label sudah digunakan");
    error.statusCode = 409;
    throw error;
  }

  return prisma.moodLabel.update({
    where: { id },
    data: {
      name,
      description,
      score,
      emoji,
      paperColor,
      isActive,
    },
  });
};

// Logika untuk Menonaktifkan atau Mengaktifkan Mood Label
const toggleMoodLabelActive = async (id) => {
  const existingMoodLabel = await prisma.moodLabel.findUnique({
    where: { id },
  });

  if (!existingMoodLabel) {
    const error = new Error("Mood label tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  return prisma.moodLabel.update({
    where: { id },
    data: {
      isActive: !existingMoodLabel.isActive,
    },
  });
};

// Logika untuk menghapus Mood Label
const deleteMoodLabel = async (id) => {
  const existingMoodLabel = await prisma.moodLabel.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          moodEntries: true,
        },
      },
    },
  });

  if (!existingMoodLabel) {
    const error = new Error("Mood label tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  if (existingMoodLabel._count.moodEntries > 0) {
    const error = new Error(
      "Mood label tidak bisa dihapus karena sudah digunakan pada mood entry",
    );
    error.statusCode = 400;
    throw error;
  }

  await prisma.moodLabel.delete({
    where: { id },
  });

  return { message: "Mood label berhasil dihapus" };
};

module.exports = {
  createMoodLabel,
  getAllMoodLabels,
  getMoodLabelById,
  updateMoodLabel,
  toggleMoodLabelActive,
  deleteMoodLabel,
};
const prisma = require("../../config/prisma");

const normalizeString = (value) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
};

// Logika untuk membuat Mood Label baru
const createMoodLabel = async (data) => {
  const name = normalizeString(data.name);
  const description = normalizeString(data.description);
  const score =
    data.score !== undefined && data.score !== null ? Number(data.score) : null;

  if (!name) {
    throw new Error("Nama Mood Label wajib di isi");
  }
  if (score !== null && Number.isNaN(score)) {
    throw new Error("Score harus berupa angka");
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
      isActive: true,
    },
  });
  return moodLabel;
};

// Logika untuk mendapatkan semua Mood Label
const getAllMoodLabels = async () => {
  return prisma.moodLabel.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
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
  const score =
    data.score !== undefined && data.score !== null
      ? Number(data.score)
      : data.score === null
        ? null
        : existingMoodLabel.score;
  const isActive =
    data.isActive !== undefined
      ? Boolean(data.isActive)
      : existingMoodLabel.isActive;

  if (!name) {
    throw new Error("Nama Mood Label Wajib di isi");
  }

  if (score !== null && Number.isNaN(score)) {
    throw new Error("Score harus berupa angka");
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

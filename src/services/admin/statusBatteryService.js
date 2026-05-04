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
  "description",
  "minScore",
  "maxScore",
  "isActive",
  "updatedAt",
  "createdAt",
];

const allowedSortOrders = ["asc", "desc"];

const validateColor = (value) => {
  if (value === null || value === undefined) return true;

  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value);
};

const createStatusBattery = async (data) => {
  const name = normalizeString(data.name)?.toLowerCase();
  const description = normalizeString(data.description);
  const color = normalizeString(data.color);

  const minScore =
    data.minScore === undefined || data.minScore === null
      ? null
      : Number(data.minScore);

  const maxScore =
    data.maxScore === undefined || data.maxScore === null
      ? null
      : Number(data.maxScore);

  const parsedIsActive = parseBoolean(data.isActive);

  if (data.isActive !== undefined && parsedIsActive === undefined) {
    const error = new Error("isActive harus bernilai true atau false");
    error.statusCode = 400;
    throw error;
  }

  const isActive = parsedIsActive ?? true;

  if (!name) {
    const error = new Error("Nama Status Battery Wajib diisi");
    error.statusCode = 400;
    throw error;
  }

  if (minScore !== null && Number.isNaN(minScore)) {
    const error = new Error("Minimal Score harus berupa angka");
    error.statusCode = 400;
    throw error;
  }

  if (maxScore !== null && Number.isNaN(maxScore)) {
    const error = new Error("Maximal Score harus berupa angka");
    error.statusCode = 400;
    throw error;
  }

  if (minScore !== null && maxScore !== null && minScore > maxScore) {
    const error = new Error(
      "Minimal Score tidak boleh lebih besar dari Maximal Score",
    );
    error.statusCode = 400;
    throw error;
  }

  if (!validateColor(color)) {
    const error = new Error(
      "Color harus berupa kode warna hex, contoh: #FD6B57",
    );
    error.statusCode = 400;
    throw error;
  }

  const existingStatusBattery = await prisma.batteryStatus.findUnique({
    where: { name },
  });

  if (existingStatusBattery) {
    const error = new Error("Nama Status Battery sudah digunakan");
    error.statusCode = 409;
    throw error;
  }

  if (minScore !== null && maxScore !== null) {
    const overlapping = await prisma.batteryStatus.findFirst({
      where: {
        minScore: { lte: maxScore },
        maxScore: { gte: minScore },
      },
    });

    if (overlapping) {
      const error = new Error("Range score bertabrakan dengan status lain");
      error.statusCode = 400;
      throw error;
    }
  }

  return prisma.batteryStatus.create({
    data: {
      name,
      description,
      minScore,
      maxScore,
      color,
      isActive,
    },
  });
};

const getAllStatusBattery = async (query) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const search = normalizeString(query.search);

  const sortBy = allowedSortFields.includes(query.sortBy)
    ? query.sortBy
    : "createdAt";

  const sortOrder = allowedSortOrders.includes(query.sortOrder)
    ? query.sortOrder
    : "desc";

  const parsedIsActive = parseBoolean(query.isActive);

  if (query.isActive !== undefined && parsedIsActive === undefined) {
    const error = new Error("Filter isActive harus bernilai true atau false");
    error.statusCode = 400;
    throw error;
  }

  const minScore =
    query.minScore === undefined ||
    query.minScore === null ||
    query.minScore === ""
      ? null
      : Number(query.minScore);

  const maxScore =
    query.maxScore === undefined ||
    query.maxScore === null ||
    query.maxScore === ""
      ? null
      : Number(query.maxScore);

  if (minScore !== null && Number.isNaN(minScore)) {
    const error = new Error("Filter minScore harus berupa angka");
    error.statusCode = 400;
    throw error;
  }

  if (maxScore !== null && Number.isNaN(maxScore)) {
    const error = new Error("Filter maxScore harus berupa angka");
    error.statusCode = 400;
    throw error;
  }

  const skip = (page - 1) * limit;

  const where = {
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ],
    }),

    ...(query.isActive !== undefined && {
      isActive: parsedIsActive,
    }),

    ...(minScore !== null && {
      minScore: { gte: minScore },
    }),

    ...(maxScore !== null && {
      maxScore: { lte: maxScore },
    }),
  };

  const [data, total] = await Promise.all([
    prisma.batteryStatus.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
    }),
    prisma.batteryStatus.count({ where }),
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
        isActive: query.isActive !== undefined ? parsedIsActive : null,
        minScore,
        maxScore,
      },
    },
  };
};

const updateStatusBattery = async (id, data) => {
  const existingStatus = await prisma.batteryStatus.findUnique({
    where: { id },
  });

  if (!existingStatus) {
    const error = new Error("Status Battery tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  const name =
    data.name !== undefined
      ? normalizeString(data.name)?.toLowerCase()
      : existingStatus.name;

  const description =
    data.description !== undefined
      ? normalizeString(data.description)
      : existingStatus.description;

  const color =
    data.color !== undefined
      ? normalizeString(data.color)
      : existingStatus.color;

  const minScore =
    data.minScore !== undefined
      ? data.minScore === null
        ? null
        : Number(data.minScore)
      : existingStatus.minScore;

  const maxScore =
    data.maxScore !== undefined
      ? data.maxScore === null
        ? null
        : Number(data.maxScore)
      : existingStatus.maxScore;

  const parsedIsActive = parseBoolean(data.isActive);

  if (data.isActive !== undefined && parsedIsActive === undefined) {
    const error = new Error("isActive harus bernilai true atau false");
    error.statusCode = 400;
    throw error;
  }

  const isActive =
    data.isActive !== undefined ? parsedIsActive : existingStatus.isActive;

  if (!name) {
    const error = new Error("Nama Status Battery wajib diisi");
    error.statusCode = 400;
    throw error;
  }

  if (minScore !== null && Number.isNaN(minScore)) {
    const error = new Error("Minimal Score harus berupa angka");
    error.statusCode = 400;
    throw error;
  }

  if (maxScore !== null && Number.isNaN(maxScore)) {
    const error = new Error("Maximal Score harus berupa angka");
    error.statusCode = 400;
    throw error;
  }

  if (minScore !== null && maxScore !== null && minScore > maxScore) {
    const error = new Error(
      "Minimal Score tidak boleh lebih besar dari Maximal Score",
    );
    error.statusCode = 400;
    throw error;
  }

  if (!validateColor(color)) {
    const error = new Error(
      "Color harus berupa kode warna hex, contoh: #FD6B57",
    );
    error.statusCode = 400;
    throw error;
  }

  const duplicateName = await prisma.batteryStatus.findFirst({
    where: {
      name,
      NOT: { id },
    },
  });

  if (duplicateName) {
    const error = new Error("Nama Status Battery sudah digunakan");
    error.statusCode = 409;
    throw error;
  }

  if (minScore !== null && maxScore !== null) {
    const overlapping = await prisma.batteryStatus.findFirst({
      where: {
        NOT: { id },
        minScore: { lte: maxScore },
        maxScore: { gte: minScore },
      },
    });

    if (overlapping) {
      const error = new Error("Range score bertabrakan dengan status lain");
      error.statusCode = 400;
      throw error;
    }
  }

  return prisma.batteryStatus.update({
    where: { id },
    data: {
      name,
      description,
      minScore,
      maxScore,
      color,
      isActive,
    },
  });
};

const deleteStatusBattery = async (id) => {
  const existingStatus = await prisma.batteryStatus.findUnique({
    where: { id },
  });

  if (!existingStatus) {
    const error = new Error("Status Battery tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  return prisma.batteryStatus.delete({
    where: { id },
  });
};

const toggleStatusBattery = async (id) => {
  const existingStatus = await prisma.batteryStatus.findUnique({
    where: { id },
  });

  if (!existingStatus) {
    const error = new Error("Status Battery tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  return prisma.batteryStatus.update({
    where: { id },
    data: {
      isActive: !existingStatus.isActive,
    },
  });
};
const getStatusBatteryById = async (id) => {
  const statusBattery = await prisma.batteryStatus.findUnique({
    where: { id },
  });

  if (!statusBattery) {
    const error = new Error("Status Battery tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  return statusBattery;
};

module.exports = {
  createStatusBattery,
  getAllStatusBattery,
  getStatusBatteryById,
  updateStatusBattery,
  deleteStatusBattery,
  toggleStatusBattery,
};

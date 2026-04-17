const prisma = require("../../config/prisma");
const bcrypt = require("bcrypt");

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
  "email",
  "fullName",
  "username",
  "role",
  "authProvider",
  "isActive",
  "isEmailVerified",
  "createdAt",
  "updatedAt",
];

const allowedSortOrders = ["asc", "desc"];

const SALT_ROUNDS = 10;

const validateRole = (role) => {
  if (role === undefined || role === null) return true;
  return ["user", "admin"].includes(role);
};

const validateEmail = (email) => {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const sanitizeUserResponse = (user) => {
  if (!user) return null;

  const { passwordHash, ...safeUser } = user;
  return safeUser;
};

// CREATE USER
const createUser = async (data) => {
  const email = normalizeString(data.email)?.toLowerCase();
  const password = normalizeString(data.password);
  const fullName = normalizeString(data.fullName);
  const username = normalizeString(data.username);
  const phoneNumber = normalizeString(data.phoneNumber);
  const profilePhotoUrl = normalizeString(data.profilePhotoUrl);
  const role = normalizeString(data.role) || "user";
  const isActive =
    data.isActive !== undefined ? parseBoolean(String(data.isActive)) : true;
  const isEmailVerified =
    data.isEmailVerified !== undefined
      ? parseBoolean(String(data.isEmailVerified))
      : false;

  if (!email) {
    const error = new Error("Email wajib diisi");
    error.statusCode = 400;
    throw error;
  }

  if (!validateEmail(email)) {
    const error = new Error("Format email tidak valid");
    error.statusCode = 400;
    throw error;
  }

  if (!password) {
    const error = new Error("Password wajib diisi");
    error.statusCode = 400;
    throw error;
  }

  if (password.length < 8) {
    const error = new Error("Password minimal 8 karakter");
    error.statusCode = 400;
    throw error;
  }

  if (!validateRole(role)) {
    const error = new Error("Role tidak valid");
    error.statusCode = 400;
    throw error;
  }

  if (data.isActive !== undefined && isActive === undefined) {
    const error = new Error("isActive harus berupa boolean");
    error.statusCode = 400;
    throw error;
  }

  if (data.isEmailVerified !== undefined && isEmailVerified === undefined) {
    const error = new Error("isEmailVerified harus berupa boolean");
    error.statusCode = 400;
    throw error;
  }

  const existingEmail = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingEmail) {
    const error = new Error("Email sudah digunakan");
    error.statusCode = 409;
    throw error;
  }

  if (username) {
    const existingUsername = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (existingUsername) {
      const error = new Error("Username sudah digunakan");
      error.statusCode = 409;
      throw error;
    }
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      fullName,
      username,
      phoneNumber,
      profilePhotoUrl,
      authProvider: "local",
      role,
      isActive,
      isEmailVerified,
    },
  });

  return sanitizeUserResponse(user);
};

// GET ALL USERS
const getAllUsers = async (query) => {
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

  const role = normalizeString(query.role);
  const authProvider = normalizeString(query.authProvider);
  const isActive = parseBoolean(query.isActive);
  const isEmailVerified = parseBoolean(query.isEmailVerified);

  const fromDate = query.fromDate ? new Date(query.fromDate) : undefined;
  const toDate = query.toDate ? new Date(query.toDate) : undefined;

  if (role && !validateRole(role)) {
    const error = new Error("Filter role tidak valid");
    error.statusCode = 400;
    throw error;
  }

  if (authProvider && !["local", "google"].includes(authProvider)) {
    const error = new Error("Filter authProvider tidak valid");
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
        email: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        fullName: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        username: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        phoneNumber: {
          contains: search,
          mode: "insensitive",
        },
      },
    ];
  }

  if (role) {
    where.role = role;
  }

  if (authProvider) {
    where.authProvider = authProvider;
  }

  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  if (isEmailVerified !== undefined) {
    where.isEmailVerified = isEmailVerified;
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

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip,
      take: limit,
      select: {
        id: true,
        email: true,
        fullName: true,
        username: true,
        phoneNumber: true,
        profilePhotoUrl: true,
        authProvider: true,
        role: true,
        isActive: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data: users,
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
        role: role || null,
        authProvider: authProvider || null,
        isActive: isActive ?? null,
        isEmailVerified: isEmailVerified ?? null,
        fromDate: query.fromDate || null,
        toDate: query.toDate || null,
      },
    },
  };
};

// GET USER BY ID
const getUserById = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      fullName: true,
      username: true,
      phoneNumber: true,
      profilePhotoUrl: true,
      authProvider: true,
      role: true,
      isActive: true,
      isEmailVerified: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          refreshTokens: true,
          activityLogs: true,
          calendarEvents: true,
          socialBatteryLogs: true,
          moodEntries: true,
          encouragements: true,
        },
      },
    },
  });

  if (!user) {
    const error = new Error("User tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  return user;
};

// UPDATE USER
const updateUser = async (id, data, currentAdminUserId = null) => {
  const existingUser = await prisma.user.findUnique({
    where: { id },
  });

  if (!existingUser) {
    const error = new Error("User tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  const email =
    data.email !== undefined
      ? normalizeString(data.email)?.toLowerCase()
      : existingUser.email;

  const fullName =
    data.fullName !== undefined
      ? normalizeString(data.fullName)
      : existingUser.fullName;

  const username =
    data.username !== undefined
      ? normalizeString(data.username)
      : existingUser.username;

  const phoneNumber =
    data.phoneNumber !== undefined
      ? normalizeString(data.phoneNumber)
      : existingUser.phoneNumber;

  const profilePhotoUrl =
    data.profilePhotoUrl !== undefined
      ? normalizeString(data.profilePhotoUrl)
      : existingUser.profilePhotoUrl;

  const role =
    data.role !== undefined ? normalizeString(data.role) : existingUser.role;

  const isActive =
    data.isActive !== undefined
      ? parseBoolean(String(data.isActive))
      : existingUser.isActive;

  const isEmailVerified =
    data.isEmailVerified !== undefined
      ? parseBoolean(String(data.isEmailVerified))
      : existingUser.isEmailVerified;

  if (!email) {
    const error = new Error("Email wajib diisi");
    error.statusCode = 400;
    throw error;
  }

  if (!validateEmail(email)) {
    const error = new Error("Format email tidak valid");
    error.statusCode = 400;
    throw error;
  }

  if (!validateRole(role)) {
    const error = new Error("Role tidak valid");
    error.statusCode = 400;
    throw error;
  }

  if (data.isActive !== undefined && isActive === undefined) {
    const error = new Error("isActive harus berupa boolean");
    error.statusCode = 400;
    throw error;
  }

  if (data.isEmailVerified !== undefined && isEmailVerified === undefined) {
    const error = new Error("isEmailVerified harus berupa boolean");
    error.statusCode = 400;
    throw error;
  }

  if (data.authProvider !== undefined) {
    const error = new Error("authProvider tidak dapat diubah oleh admin");
    error.statusCode = 400;
    throw error;
  }

  if (
    currentAdminUserId &&
    existingUser.id === currentAdminUserId &&
    data.role !== undefined &&
    role !== existingUser.role
  ) {
    const error = new Error("Admin tidak dapat mengubah role akun sendiri");
    error.statusCode = 400;
    throw error;
  }

  if (
    currentAdminUserId &&
    existingUser.id === currentAdminUserId &&
    data.isActive !== undefined &&
    isActive !== existingUser.isActive
  ) {
    const error = new Error("Admin tidak dapat mengubah status aktif akun sendiri");
    error.statusCode = 400;
    throw error;
  }

  if (data.password !== undefined && data.password !== null) {
    const normalizedPassword = normalizeString(data.password);

    if (!normalizedPassword) {
      const error = new Error("Password tidak boleh kosong");
      error.statusCode = 400;
      throw error;
    }

    if (normalizedPassword.length < 8) {
      const error = new Error("Password minimal 8 karakter");
      error.statusCode = 400;
      throw error;
    }
  }

  const duplicateEmail = await prisma.user.findFirst({
    where: {
      email,
      NOT: {
        id,
      },
    },
    select: { id: true },
  });

  if (duplicateEmail) {
    const error = new Error("Email sudah digunakan");
    error.statusCode = 409;
    throw error;
  }

  if (username) {
    const duplicateUsername = await prisma.user.findFirst({
      where: {
        username,
        NOT: {
          id,
        },
      },
      select: { id: true },
    });

    if (duplicateUsername) {
      const error = new Error("Username sudah digunakan");
      error.statusCode = 409;
      throw error;
    }
  }

  let passwordHash = existingUser.passwordHash;

  if (data.password !== undefined && data.password !== null) {
    passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: {
      email,
      fullName,
      username,
      phoneNumber,
      profilePhotoUrl,
      role,
      isActive,
      isEmailVerified,
      passwordHash,
    },
  });

  return sanitizeUserResponse(updatedUser);
};

// TOGGLE ACTIVE
const toggleUserActive = async (id, currentAdminUserId = null) => {
  const existingUser = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      fullName: true,
      isActive: true,
    },
  });

  if (!existingUser) {
    const error = new Error("User tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  if (currentAdminUserId && existingUser.id === currentAdminUserId) {
    const error = new Error("Admin tidak dapat mengubah status aktif akun sendiri");
    error.statusCode = 400;
    throw error;
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: {
      isActive: !existingUser.isActive,
    },
  });

  return sanitizeUserResponse(updatedUser);
};

// DELETE USER
const deleteUser = async (id, currentAdminUserId = null) => {
  const existingUser = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      role: true,
    },
  });

  if (!existingUser) {
    const error = new Error("User tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  if (currentAdminUserId && existingUser.id === currentAdminUserId) {
    const error = new Error("Admin tidak dapat menghapus akun sendiri");
    error.statusCode = 400;
    throw error;
  }

  await prisma.user.delete({
    where: { id },
  });

  return {
    message: "User berhasil dihapus",
  };
};

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  toggleUserActive,
  deleteUser,
};
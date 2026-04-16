const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const prisma = require("../../config/prisma");
const logActivity = require("../../utils/activityLogger");
const { registerQueue, loginQueue } = require("../../utils/authQueues");

const SALT_ROUNDS = 10;

const normalizeEmail = (email) => email?.trim().toLowerCase();
const normalizeString = (value) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
};

const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const isValidUsername = (username) => {
  return /^[a-zA-Z0-9_]+$/.test(username);
};

const generateAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
    },
  );
};

const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString("hex");
};

const getRefreshTokenExpiryDate = () => {
  const expiry = new Date();
  const refreshTokenTtl = process.env.REFRESH_TOKEN_EXPIRES_IN || "2d";

  const match = refreshTokenTtl.match(/^(\d+)([dhm])$/);

  if (!match) {
    throw new Error(
      "Format REFRESH_TOKEN_EXPIRES_IN tidak valid. Gunakan format seperti 7d, 12h, atau 30m",
    );
  }

  const value = Number(match[1]);
  const unit = match[2];

  if (unit === "d") {
    expiry.setDate(expiry.getDate() + value);
  } else if (unit === "h") {
    expiry.setHours(expiry.getHours() + value);
  } else if (unit === "m") {
    expiry.setMinutes(expiry.getMinutes() + value);
  }

  return expiry;
};

const register = async (req, res) => {
  try {
    const result = await registerQueue.enqueue(async () => {
      // const { email, password, fullName, username, phoneNumber } = req.body;
      const email = normalizeEmail(req.body.email);
      const password = req.body.password;
      const fullName = normalizeString(req.body.fullName);
      const username = normalizeString(req.body.username)?.toLowerCase();
      const phoneNumber = normalizeString(req.body.phoneNumber);

      if (!email || !password) {
        return {
          status: 400,
          body: {
            message: "Email dan password wajib diisi",
          },
        };
      }

      if (!isValidEmail(email)) {
        return {
          status: 400,
          body: {
            message: "Format email tidak valid",
          },
        };
      }

      if (password.length < 8) {
        return {
          status: 400,
          body: {
            message: "Password minimal 8 karakter",
          },
        };
      }

      if (username && !isValidUsername(username)) {
        return {
          status: 400,
          body: {
            message: "Username hanya boleh huruf, angka, dan underscore",
          },
        };
      }

      const existingUserByEmail = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });

      if (existingUserByEmail) {
        return {
          status: 409,
          body: {
            message: "Email sudah terdaftar",
          },
        };
      }

      if (username) {
        const existingUserByUsername = await prisma.user.findUnique({
          where: { username },
          select: { id: true },
        });

        if (existingUserByUsername) {
          return {
            status: 409,
            body: {
              message: "Username sudah dipakai",
            },
          };
        }
      }

      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      const newUser = await prisma.user.create({
        data: {
          email,
          passwordHash: hashedPassword,
          fullName,
          username,
          phoneNumber,
          authProvider: "local",
          role: "user",
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          username: true,
          phoneNumber: true,
          authProvider: true,
          role: true,
          createdAt: true,
        },
      });

      await logActivity({
        userId: newUser.id,
        action: "REGISTER",
        description: `User register dengan email ${newUser.email}`,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });

      return {
        status: 201,
        body: {
          message: "Register berhasil",
          data: newUser,
        },
      };
    });
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("REGISTER ERROR:", error);

    if (error.message === "AUTH_QUEUE_FULL") {
      return res.status(503).json({
        message: "Server sedang sibuk, coba lagi beberapa saat",
      });
    }

    if (error.code === "P2002") {
      return res.status(409).json({
        message: "Email atau username sudah digunakan",
      });
    }

    return res.status(500).json({
      message: "Terjadi kesalahan pada server",
      // error: error.message,
    });
  }
};

const login = async (req, res) => {
  try {
    const result = await loginQueue.enqueue(async () => {
      const identifier = req.body.identifier?.trim();
      const password = req.body.password;

      if (!identifier || !password) {
        return {
          status: 400,
          body: { message: "Email/username dan password wajib diisi" },
        };
      }

      if (!process.env.JWT_ACCESS_SECRET) {
        throw new Error("JWT_ACCESS_SECRET belum dikonfigurasi");
      }

      const normalizedIdentifier = identifier.toLowerCase();

      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: normalizedIdentifier },
            { username: normalizedIdentifier },
          ],
        },
        select: {
          id: true,
          email: true,
          username: true,
          passwordHash: true,
          authProvider: true,
          role: true,
          isEmailVerified: true,
          createdAt: true,
        },
      });

      if (!user) {
        return {
          status: 401,
          body: { message: "Email/username atau password salah" },
        };
      }

      if (!user.passwordHash || user.authProvider === "google") {
        return {
          status: 401,
          body: {
            message:
              "Akun ini terdaftar via Google. Silakan login dengan Google",
          },
        };
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

      if (!isPasswordValid) {
        return {
          status: 401,
          body: { message: "Email/Username atau password salah" },
        };
      }
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken();
      const refreshTokenExpiry = getRefreshTokenExpiryDate();

      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: refreshTokenExpiry,
        },
      });

      await logActivity({
        userId: user.id,
        action: "LOGIN",
        description: `User login dengan identifier ${identifier}`,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });

      return {
        status: 200,
        body: {
          message: "Login berhasil",
          accessToken,
          refreshToken,
          data: {
            id: user.id,
            email: user.email,
            username: user.username,
            authProvider: user.authProvider,
            role: user.role,
            createdAt: user.createdAt,
          },
        },
      };
    });
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    if (error.message === "AUTH_QUEUE_FULL") {
      return res.status(503).json({
        message: "Server sedang sibuk, coba lagi beberapa saat",
      });
    }

    return res.status(500).json({
      message: "Terjadi kesalahan pada server",
      // error: error.message,
    });
  }
};

const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        message: "Refresh token wajib diisi",
      });
    }

    const savedRefreshToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!savedRefreshToken) {
      return res.status(401).json({
        message: "Refresh token tidak valid",
      });
    }

    if (savedRefreshToken.expiresAt < new Date()) {
      await prisma.refreshToken.delete({
        where: { token: refreshToken },
      });

      return res.status(401).json({
        message: "Refresh token expired",
      });
    }

    const newAccessToken = generateAccessToken(savedRefreshToken.user);

    return res.status(200).json({
      message: "Access token berhasil diperbarui",
      accessToken: newAccessToken,
    });
  } catch (error) {
    console.error("REFRESH TOKEN ERROR:", error);

    return res.status(500).json({
      message: "Terjadi kesalahan pada server",
    });
  }
};

const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (!refreshToken) {
      return res.status(400).json({
        message: "Refresh token wajib diisi",
      });
    }

    const existingRefreshToken = await prisma.refreshToken.findFirst({
      where: {
        token: refreshToken,
        userId: req.user.userId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
          },
        },
      },
    });

    if (!existingRefreshToken) {
      return res.status(404).json({
        message: "Refresh token tidak ditemukan atau tidak valid",
      });
    }

    await prisma.refreshToken.delete({
      where: {
        token: refreshToken,
      },
    });

    const activityLog = await logActivity({
      userId: existingRefreshToken.user.id,
      action: "LOGOUT",
      description: `User logout dengan email ${existingRefreshToken.user.email}`,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    if (!activityLog) {
      console.warn("Logout berhasil, tetapi activity log gagal disimpan");
    }

    return res.status(200).json({
      message: "Logout berhasil",
    });
  } catch (error) {
    console.error("LOGOUT ERROR:", error);

    return res.status(500).json({
      message: "Terjadi kesalahan pada server",
    });
  }
};

module.exports = {
  register,
  login,
  refreshAccessToken,
  logout,
};

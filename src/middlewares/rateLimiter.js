const rateLimit = require("express-rate-limit");

const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 menit
  max: 10,
  message: {
    message: "Terlalu banyak percobaan login, Tunggu 1 menit dan coba lagi",
    retryAfter: "60 detik",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: {
    message: "Terlalu banyak percobaan register, Tunggu 1 menit dan coba lagi",
    retryAfter: "60 detik",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const refreshTokenLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: {
    message: "Terlalu banyak percobaan refresh token, coba lagi sebentar",
    retryAfter: "60 detik",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  loginLimiter,
  registerLimiter,
  refreshTokenLimiter,
};

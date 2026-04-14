const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const {
  register,
  login,
  refreshAccessToken,
  logout,
} = require("../controllers/AuthController/authController");

const {
  loginLimiter,
  registerLimiter,
  refreshTokenLimiter,
} = require("../middlewares/rateLimiter");
router.post("/register", registerLimiter, register);
router.post("/login", loginLimiter, login);
router.post("/refresh-token", refreshTokenLimiter, refreshAccessToken);
router.post("/logout", authMiddleware, logout);

module.exports = router;

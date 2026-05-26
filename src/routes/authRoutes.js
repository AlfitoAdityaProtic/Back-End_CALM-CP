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
  forgotPassword,
  resetPassword,
} = require("../controllers/AuthController/resetPasswordController");

const {
  googleLogin,
  googleCallback,
  exchangeGoogleCode,
} = require("../controllers/AuthController/LoginWithGoogle");

const {
  loginLimiter,
  registerLimiter,
  refreshTokenLimiter,
} = require("../middlewares/rateLimiter");
router.post("/register", registerLimiter, register);
router.post("/login", loginLimiter, login);
router.post("/refresh-token", refreshTokenLimiter, refreshAccessToken);
router.post("/logout", logout);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.get("/google/login", googleLogin);
router.get("/google/callback", googleCallback);
router.post("/google/exchange-code", exchangeGoogleCode);

module.exports = router;

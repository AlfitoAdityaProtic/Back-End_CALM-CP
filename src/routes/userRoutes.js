const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");
const {
  getUserProfile,
  updateProfile,
  updatePassword,
} = require("../controllers/UserController/userController");

const { updatePasswordLimiter } = require("../middlewares/rateLimiter");

router.get("/profile", authMiddleware, getUserProfile);
router.patch(
  "/profile",
  authMiddleware,
  upload.single("profilePhoto"),
  updateProfile,
);
router.patch(
  "/profile/password",
  authMiddleware,
  updatePasswordLimiter,
  updatePassword,
);

module.exports = router;

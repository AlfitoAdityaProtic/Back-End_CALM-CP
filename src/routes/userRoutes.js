const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const { getUserProfile, updateProfile } = require("../controllers/UserController/userController");

router.get("/profile", authMiddleware, getUserProfile);
router.patch("/profile", authMiddleware, updateProfile);

module.exports = router;
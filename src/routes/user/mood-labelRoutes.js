const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middlewares/authMiddleware");
const moodLabelController = require("../../controllers/UserController/moodLabelController");

// Rute untuk mendapatkan semua Mood Label aktif
router.get(
  "/mood-labels/active",
  authMiddleware,
  moodLabelController.getActiveMoodLabels,
);

module.exports = router;

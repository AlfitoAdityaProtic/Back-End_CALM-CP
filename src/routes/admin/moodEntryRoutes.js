const express = require("express");
const router = express.Router();

const authMiddleware = require("../../middlewares/authMiddleware");
const authorizeRole = require("../../middlewares/authorizeRole");
const moodEntriesController = require("../../controllers/adminController/moodEntryController");

router.get(
  "/mood-entries",
  authMiddleware,
  authorizeRole("admin"),
  moodEntriesController.getMoodEntries,
);

router.get(
  "/mood-entries/export/excel",
  authMiddleware,
  authorizeRole("admin"),
  moodEntriesController.exportMoodEntriesExcel,
);
router.get(
  "/mood-entries/:id",
  authMiddleware,
  authorizeRole("admin"),
  moodEntriesController.getMoodEntryDetail,
);
module.exports = router;

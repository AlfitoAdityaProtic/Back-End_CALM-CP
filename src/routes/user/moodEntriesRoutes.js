const express = require("express");
const router = express.Router();

const authMiddleware = require("../../middlewares/authMiddleware");
const moodEntryController = require("../../controllers/UserController/moodEntryController");

router.use(authMiddleware);

router.post("/mood-entries", moodEntryController.createMoodEntry);
router.get("/mood-entries", moodEntryController.getMyMoodEntries);
router.get("/mood-entries/:id", moodEntryController.getMoodEntryById);

module.exports = router;
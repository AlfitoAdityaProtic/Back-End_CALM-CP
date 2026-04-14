const express = require("express");
const router = express.Router();
const moodLabelController = require("../../controllers/adminController/moodLabelController");
const authMiddleware = require("../../middlewares/authMiddleware");
const authorizeRole = require("../../middlewares/authorizeRole");

router.use(authMiddleware, authorizeRole("admin"));

// Rute untuk membuat Mood Label baru
router.post("/mood-labels", moodLabelController.createMoodLabel);

// Rute untuk mendapatkan semua Mood Label
router.get("/mood-labels", moodLabelController.getAllMoodLabels);

// Rute untuk mendapatkan Mood Label berdasarkan ID
router.get("/mood-labels/:id", moodLabelController.getMoodLabelById);

// Rute untuk memperbarui Mood Label berdasarkan ID
router.put("/mood-labels/:id", moodLabelController.updateMoodLabel);

// Rute untuk Menonaktifkan atau Mengaktifkan Mood Label
router.patch("/mood-labels/:id/toggle-active", moodLabelController.toggleMoodLabelActive);

// Rute untuk menghapus Mood Label berdasarkan ID
router.delete("/mood-labels/:id", moodLabelController.deleteMoodLabel);

module.exports = router;

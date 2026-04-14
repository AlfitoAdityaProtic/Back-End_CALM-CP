const moodEntryService = require("../../services/user/moodEntryService");

const createMoodEntry = async (req, res) => {
  try {
    const result = await moodEntryService.createMoodEntry(
      req.user.userId,
      req.body,
    );

    return res.status(201).json({
      message: "Mood entry berhasil diproses",
      data: result,
    });
  } catch (error) {
    console.error("CREATE MOOD ENTRY ERROR:", error);

    return res.status(error.statusCode || 500).json({
      message: error.message || "Terjadi kesalahan pada server",
    });
  }
};

const getMyMoodEntries = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const result = await moodEntryService.getMyMoodEntries(userId, req.query);

    return res.status(200).json({
      message: "Riwayat mood entry berhasil diambil",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("GET MY MOOD ENTRIES ERROR:", error);

    return res.status(error.statusCode || 500).json({
      message: "Terjadi kesalahan pada server",
    });
  }
};

const getMoodEntryById = async (req, res) => {
  try {
    const result = await moodEntryService.getMoodEntryById(
      req.user.userId,
      req.params.id,
    );

    return res.status(200).json({
      message: "Detail mood entry berhasil diambil",
      data: result,
    });
  } catch (error) {
    console.error("GET MOOD ENTRY BY ID ERROR:", error);

    return res.status(error.statusCode || 500).json({
      message: error.message || "Terjadi kesalahan pada server",
    });
  }
};

module.exports = {
  createMoodEntry,
  getMyMoodEntries,
  getMoodEntryById,
};

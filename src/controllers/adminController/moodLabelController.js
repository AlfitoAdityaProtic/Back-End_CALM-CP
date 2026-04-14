const moodLabelService = require("../../services/admin/moodLabelService");

const createMoodLabel = async (req, res) => {
  try {
    const moodLabel = await moodLabelService.createMoodLabel(req.body);

    return res.status(201).json({
      message: "Mood label berhasil dibuat",
      data: moodLabel,
    });
  } catch (error) {
    console.error("CREATE MOOD LABEL ERROR:", error);

    return res.status(error.statusCode || 500).json({
      message: error.message || "Terjadi kesalahan pada server",
    });
  }
};

const getAllMoodLabels = async (req, res) => {
  try {
    const moodLabels = await moodLabelService.getAllMoodLabels();

    return res.status(200).json({
      message: "Daftar mood label berhasil diambil",
      data: moodLabels,
    });
  } catch (error) {
    console.error("GET ALL MOOD LABELS ERROR:", error);

    return res.status(500).json({
      message: "Terjadi kesalahan pada server",
    });
  }
};

const getMoodLabelById = async (req, res) => {
  try {
    const moodLabel = await moodLabelService.getMoodLabelById(req.params.id);

    return res.status(200).json({
      message: "Detail mood label berhasil diambil",
      data: moodLabel,
    });
  } catch (error) {
    console.error("GET MOOD LABEL BY ID ERROR:", error);

    return res.status(error.statusCode || 500).json({
      message: error.message || "Terjadi kesalahan pada server",
    });
  }
};

const updateMoodLabel = async (req, res) => {
  try {
    const moodLabel = await moodLabelService.updateMoodLabel(
      req.params.id,
      req.body,
    );

    return res.status(200).json({
      message: "Mood label berhasil diperbarui",
      data: moodLabel,
    });
  } catch (error) {
    console.error("UPDATE MOOD LABEL ERROR:", error);

    return res.status(error.statusCode || 500).json({
      message: error.message || "Terjadi kesalahan pada server",
    });
  }
};

const toggleMoodLabelActive = async (req, res) => {
  try {
    const moodLabel = await moodLabelService.toggleMoodLabelActive(req.params.id);

    return res.status(200).json({
      message: "Status mood label berhasil diubah",
      data: moodLabel,
    });
  } catch (error) {
    console.error("TOGGLE MOOD LABEL ACTIVE ERROR:", error);

    return res.status(error.statusCode || 500).json({
      message: error.message || "Terjadi kesalahan pada server",
    });
  }
};

const deleteMoodLabel = async (req, res) => {
  try {
    const result = await moodLabelService.deleteMoodLabel(req.params.id);

    return res.status(200).json(result);
  } catch (error) {
    console.error("DELETE MOOD LABEL ERROR:", error);

    return res.status(error.statusCode || 500).json({
      message: error.message || "Terjadi kesalahan pada server",
    });
  }
};

module.exports = {
  createMoodLabel,
  getAllMoodLabels,
  getMoodLabelById,
  updateMoodLabel,
  toggleMoodLabelActive,
  deleteMoodLabel,
};
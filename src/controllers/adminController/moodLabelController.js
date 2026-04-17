const moodLabelService = require("../../services/admin/moodLabelService");
const logActivity = require("../../utils/activityLogger");

const createMoodLabel = async (req, res) => {
  try {
    const moodLabel = await moodLabelService.createMoodLabel(req.body);

    const activityLog = await logActivity({
      userId: req.user.userId,
      action: "CREATE_MOOD_LABEL",
      description: `Membuat mood label ${moodLabel.name} dengan emoji ${moodLabel.emoji || "-"}`,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    if (!activityLog) {
      console.warn("Create mood label berhasil, tetapi activity log gagal disimpan");
    }

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
    const result = await moodLabelService.getAllMoodLabels(req.query);

    return res.status(200).json({
      message: "Daftar mood label berhasil diambil",
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    console.error("GET ALL MOOD LABELS ERROR:", error);

    return res.status(error.statusCode || 500).json({
      message: error.message || "Terjadi kesalahan pada server",
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

    const activityLog = await logActivity({
      userId: req.user.userId,
      action: "UPDATE_MOOD_LABEL",
      description: `Update mood label ${moodLabel.name} (score: ${moodLabel.score ?? "-"}, emoji: ${moodLabel.emoji || "-"})`,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    if (!activityLog) {
      console.warn("Update mood label berhasil, tetapi activity log gagal disimpan");
    }

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
    const moodLabel = await moodLabelService.toggleMoodLabelActive(
      req.params.id,
    );

    const activityLog = await logActivity({
      userId: req.user.userId,
      action: "TOGGLE_MOOD_LABEL_ACTIVE",
      description: `Mengubah status mood label ${moodLabel.name} menjadi ${moodLabel.isActive ? "aktif" : "nonaktif"}`,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    if (!activityLog) {
      console.warn("Toggle status mood label berhasil, tetapi activity log gagal disimpan");
    }

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
    const moodLabel = await moodLabelService.getMoodLabelById(req.params.id);
    const result = await moodLabelService.deleteMoodLabel(req.params.id);

    const activityLog = await logActivity({
      userId: req.user.userId,
      action: "DELETE_MOOD_LABEL",
      description: `Menghapus mood label ${moodLabel.name}`,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    if (!activityLog) {
      console.warn("Delete mood label berhasil, tetapi activity log gagal disimpan");
    }

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
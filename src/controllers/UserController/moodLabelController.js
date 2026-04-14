const MoodLabelService = require("../../services/user/moodLabelServices");

const getActiveMoodLabels = async (req, res) => {
  try {
    const moodLabels = await MoodLabelService.getActiveMoodLabels();

    return res.status(200).json({
      message: "Daftar mood label aktif berhasil diambil",
      data: moodLabels,
    });
  } catch (error) {
    console.error("GET ACTIVE MOOD LABELS ERROR:", error);

    return res.status(500).json({
      message: "Terjadi kesalahan pada server",
    });
  }
};

module.exports = {
  getActiveMoodLabels,
};

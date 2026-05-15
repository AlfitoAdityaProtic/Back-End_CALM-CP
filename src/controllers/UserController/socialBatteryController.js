const socialBatteryService = require("../../services/user/socialBattery/socialBatteryService");

async function getTodaySocialBattery(req, res) {
  try {
    const userId = req.user.userId;

    const data = await socialBatteryService.getTodaySocialBattery(userId);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("getTodaySocialBattery error:", error);
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil data social battery Harian",
      error: error.message,
    });
  }
}

async function generateAiInsight(req, res) {
  try {
    const userId = req.user.userId;
    const { date } = req.body || {};

    const result = await socialBatteryService.generateSocialBatteryAiInsight(
      userId,
      date ? new Date(date) : new Date(),
      req.ip,
      req.headers["user-agent"],
    );

    return res.status(200).json({
      success: true,
      message: "AI insight generated successfully",
      data: result,
    });
  } catch (error) {
    console.error("generateAiInsight error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate AI insight",
      error: error.message,
    });
  }
}
async function getSocialBatteryByDate(req, res) {
  try {
    const userId = req.user.userId;
    const { date } = req.params;

    const data = await socialBatteryService.getSocialBatteryByDate(
      userId,
      date,
    );

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("getSocialBatteryByDate error:", error);
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil data social battery berdasarkan tanggal",
      error: error.message,
    });
  }
}

async function getSocialBatteryHistory(req, res) {
  try {
    const userId = req.user.userId;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 7;

    const data = await socialBatteryService.getSocialBatteryHistory(
      userId,
      page,
      limit,
    );

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("getSocialBatteryHistory error:", error);
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil history social battery",
      error: error.message,
    });
  }
}

async function calculateSocialBattery(req, res) {
  try {
    const userId = req.user.userId;
    const { date } = req.body || {};

    const data = await socialBatteryService.calculateSocialBatteryByDate(
      userId,
      date ? new Date(date) : new Date(),
      req.ip,
      req.headers["user-agent"],
    );

    return res.status(200).json({
      success: true,
      message: "Social battery calculated successfully",
      data,
    });
  } catch (error) {
    console.error("calculateSocialBattery error:", error);
    return res.status(500).json({
      success: false,
      message: "Gagal menghitung social battery",
      error: error.message,
    });
  }
}

module.exports = {
  getTodaySocialBattery,
  generateAiInsight,
  getSocialBatteryByDate,
  getSocialBatteryHistory,
  calculateSocialBattery,
};

const dashboardService = require("../../services/admin/dashboardService");

const getDashboard = async (req, res, next) => {
  try {
    const data = await dashboardService.getDashboardData();

    res.status(200).json({
      success: true,
      message: "Dashboard data fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
};

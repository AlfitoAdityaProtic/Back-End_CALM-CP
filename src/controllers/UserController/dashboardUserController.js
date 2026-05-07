const dashboardUserService = require("../../services/user/DashboardService");

async function getDashboard(req, res, next) {
  try {
    const userId = req.user.userId;

    const dashboard = await dashboardUserService.getDashboardUser(userId);

    res.status(200).json({
      success: true,
      message: "Dashboard user fetched successfully",
      data: dashboard,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDashboard,
};

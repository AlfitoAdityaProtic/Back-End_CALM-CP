const activityLogService = require("../../services/admin/activityLogService");

const getActivityLogs = async (req, res) => {
  try {
    const result = await activityLogService.getActivityLogs(req.query);

    return res.status(200).json({
      success: true,
      message: "Activity logs fetched successfully",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("getActivityLogs error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch activity logs",
      error: error.message,
    });
  }
};

module.exports = {
  getActivityLogs,
};

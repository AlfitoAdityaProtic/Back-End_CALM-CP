const socialBatteryLogService = require("../../services/admin/socialBatteryLogsService");
const logActivity = require("../../utils/activityLogger");

const getSocialBatteryLogs = async (req, res, next) => {
  try {
    const result = await socialBatteryLogService.getSocialBatteryLogs(
      req.query,
    );

    return res.status(200).json({
      message: "Daftar social battery logs berhasil diambil",
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    next(error);
  }
};

const getSocialBatteryLogSummary = async (req, res, next) => {
  try {
    const result = await socialBatteryLogService.getSocialBatteryLogSummary(
      req.query,
    );

    return res.status(200).json({
      message: "Ringkasan social battery logs berhasil diambil",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getSocialBatteryLogDetail = async (req, res, next) => {
  try {
    const result = await socialBatteryLogService.getSocialBatteryLogDetail(
      req.params.id,
    );

    return res.status(200).json({
      message: "Detail social battery log berhasil diambil",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const exportSocialBatteryLogsExcel = async (req, res, next) => {
  try {
    const workbook = await socialBatteryLogService.exportSocialBatteryLogsExcel(
      req.query,
    );

    const activityLog = await logActivity({
      userId: req.user.userId,
      action: "EXPORT_SOCIAL_BATTERY_LOGS_EXCEL",
      description: `Admin mengekspor social battery logs excel dengan query: ${JSON.stringify(
        req.query,
      )}`,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    if (!activityLog) {
      console.warn(
        "Export Social Battery Logs berhasil, tetapi activity log gagal disimpan",
      );
    }

    const filename = `social-battery-logs-${Date.now()}.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);

    await workbook.xlsx.write(res);
    return res.end();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSocialBatteryLogs,
  getSocialBatteryLogSummary,
  getSocialBatteryLogDetail,
  exportSocialBatteryLogsExcel,
};

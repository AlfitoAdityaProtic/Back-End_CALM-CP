const EncouragementService = require("../../services/admin/encouragementService");
const logActivity = require("../../utils/activityLogger");

const getEncouragementResults = async (req, res, next) => {
  try {
    const result = await EncouragementService.getEncouragementResults(
      req.query,
    );

    res.status(200).json({
      success: true,
      message: "Data encouragement result berhasil diambil",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

const getEncouragementResultById = async (req, res, next) => {
  try {
    const result = await EncouragementService.getEncouragementResultById(
      req.params.id,
    );

    res.status(200).json({
      success: true,
      message: "Detail encouragement result berhasil diambil",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const exportEncouragementResults = async (req, res, next) => {
  try {
    const workbook =
      await EncouragementService.exportEncouragementResultsExcel(
        req.query,
      );

    const activityLog = await logActivity({
      userId: req.user.userId,
      action: "EXPORT_ENCOURAGEMENT_RESULTS_EXCEL",
      description: `Admin mengekspor encouragement results excel dengan query: ${JSON.stringify(
        req.query,
      )}`,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    if (!activityLog) {
      console.warn(
        "Export Encouragement Result berhasil, tetapi activity log gagal disimpan",
      );
    }

    const fileName = `encouragement-results-${Date.now()}.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );

    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);

    await workbook.xlsx.write(res);
    return res.end();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEncouragementResults,
  getEncouragementResultById,
  exportEncouragementResults,
};

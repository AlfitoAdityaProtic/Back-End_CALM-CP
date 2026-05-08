const moodEntryService = require("../../services/admin/moodEntryService");
const logActivity = require("../../utils/activityLogger");

const getMoodEntries = async (req, res, next) => {
  try {
    const result = await moodEntryService.getMoodEntries(req.query);

    return res.status(200).json({
      message: "Daftar mood entries berhasil diambil",
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    next(error);
  }
};

const getMoodEntryDetail = async (req, res, next) => {
  try {
    const result = await moodEntryService.getMoodEntryDetail(req.params.id);

    return res.status(200).json({
      message: "Detail mood entry berhasil diambil",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const exportMoodEntriesExcel = async (req, res, next) => {
  try {
    const workbook = await moodEntryService.exportMoodEntriesExcel(req.query);
    const activityLog = await logActivity({
      userId: req.user.userId,
      action: "EXPORT_MOOD_ENTRIES_EXCEL",
      description: `Admin mengekspor mood entries excel dengan query: ${JSON.stringify(req.query)}`,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    if (!activityLog) {
      console.warn(
        "Export Mood Entry berhasil, tetapi activity log gagal disimpan",
      );
    }
    const filename = `mood-entries-${Date.now()}.xlsx`;

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
  getMoodEntries,
  getMoodEntryDetail,
  exportMoodEntriesExcel,
};

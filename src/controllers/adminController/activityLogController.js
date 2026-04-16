const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");
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

const exportActivityLogsExcel = async (req, res) => {
  try {
    const logs = await activityLogService.getActivityLogsForExport(req.query);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Activity Logs");

    worksheet.columns = [
      { header: "No", key: "no", width: 8 },
      { header: "User ID", key: "userId", width: 25 },
      { header: "Full Name", key: "fullName", width: 25 },
      { header: "Email", key: "email", width: 30 },
      { header: "Username", key: "username", width: 20 },
      { header: "Role", key: "role", width: 15 },
      { header: "Action", key: "action", width: 20 },
      { header: "Description", key: "description", width: 40 },
      { header: "Created At", key: "createdAt", width: 25 },
    ];

    logs.forEach((log, index) => {
      worksheet.addRow({
        no: index + 1,
        userId: log.user?.id || "-",
        fullName: log.user?.fullName || "-",
        email: log.user?.email || "-",
        username: log.user?.username || "-",
        role: log.user?.role || "-",
        action: log.action || "-",
        description: log.description || "-",
        createdAt: log.createdAt
          ? new Date(log.createdAt).toLocaleString("id-ID")
          : "-",
      });
    });

    worksheet.getRow(1).font = { bold: true };

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="activity-logs.xlsx"',
    );

    await workbook.xlsx.write(res);
    return res.end();
  } catch (error) {
    console.error("exportActivityLogsExcel error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to export activity logs to Excel",
      error: error.message,
    });
  }
};

const exportActivityLogsPdf = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required for PDF export",
      });
    }

    const logs = await activityLogService.getActivityLogsForExport(req.query);

    const doc = new PDFDocument({ margin: 40, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="activity-log-user.pdf"',
    );

    doc.pipe(res);

    const user = logs[0]?.user;

    doc.fontSize(18).text("User Activity Log Report", { align: "center" });
    doc.moveDown();

    doc.fontSize(12).text(`User ID: ${user?.id || userId}`);
    doc.text(`Full Name: ${user?.fullName || "-"}`);
    doc.text(`Email: ${user?.email || "-"}`);
    doc.text(`Username: ${user?.username || "-"}`);
    doc.text(`Role: ${user?.role || "-"}`);
    doc.text(`Total Activities: ${logs.length}`);
    doc.moveDown();

    if (logs.length === 0) {
      doc.fontSize(11).text("No activity logs found for this user.");
    } else {
      logs.forEach((log, index) => {
        doc.fontSize(11).text(`${index + 1}. Action: ${log.action || "-"}`);
        doc.fontSize(10).text(`Description: ${log.description || "-"}`);
        doc.text(
          `Created At: ${
            log.createdAt
              ? new Date(log.createdAt).toLocaleString("id-ID")
              : "-"
          }`,
        );
        doc.moveDown();
      });
    }

    doc.end();
  } catch (error) {
    console.error("exportActivityLogsPdf error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to export activity logs to PDF",
      error: error.message,
    });
  }
};

module.exports = {
  getActivityLogs,
  exportActivityLogsExcel,
  exportActivityLogsPdf,
};

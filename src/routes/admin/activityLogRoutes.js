const express = require("express");
const router = express.Router();

const authMiddleware = require("../../middlewares/authMiddleware");
const authorizeRole = require("../../middlewares/authorizeRole");
const activityLogController = require("../../controllers/adminController/activityLogController");

router.get(
  "/activity/logs",
  authMiddleware,
  authorizeRole("admin"),
  activityLogController.getActivityLogs,
);
router.get(
  "/activity/logs/export/excel",
  authMiddleware,
  authorizeRole("admin"),
  activityLogController.exportActivityLogsExcel,
);

router.get(
  "/activity/logs/export/pdf",
  authMiddleware,
  authorizeRole("admin"),
  activityLogController.exportActivityLogsPdf,
);

module.exports = router;

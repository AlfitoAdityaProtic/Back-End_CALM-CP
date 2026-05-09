const express = require("express");
const router = express.Router();

const SocialBatteryController = require("../../controllers/adminController/socialBatteryLogsController");
const authMiddleware = require("../../middlewares/authMiddleware");
const authorizeRole = require("../../middlewares/authorizeRole");

router.get(
  "/social-battery-logs/summary",
  authMiddleware,
  authorizeRole("admin"),
  SocialBatteryController.getSocialBatteryLogSummary,
);

router.get(
  "/social-battery-logs/export/excel",
  authMiddleware,
  authorizeRole("admin"),
  SocialBatteryController.exportSocialBatteryLogsExcel,
);

router.get(
  "/social-battery-logs",
  authMiddleware,
  authorizeRole("admin"),
  SocialBatteryController.getSocialBatteryLogs,
);

router.get(
  "/social-battery-logs/:id",
  authMiddleware,
  authorizeRole("admin"),
  SocialBatteryController.getSocialBatteryLogDetail,
);

module.exports = router;

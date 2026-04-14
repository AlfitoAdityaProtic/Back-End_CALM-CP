const express = require("express");
const router = express.Router();

const authMiddleware = require("../../middlewares/authMiddleware");
const authorizeRole = require("../../middlewares/authorizeRole");
const activityLogController = require("../../controllers/adminController/activityLogController");

router.get(
  "/activity/logs",
  authMiddleware,
  authorizeRole("admin"),
  activityLogController.getActivityLogs
);

module.exports = router;

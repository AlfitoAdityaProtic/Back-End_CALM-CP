const express = require("express");
const router = express.Router();
const notificationController = require("../../controllers/UserController/notificationController");

const authMiddleware = require("../../middlewares/authMiddleware");

router.get("/", authMiddleware, notificationController.getNotifications);
router.get(
  "/unread-count",
  authMiddleware,
  notificationController.getUnreadCount,
);
router.get("/:id", authMiddleware, notificationController.getNotificationById);

router.patch(
  "/read-all",
  authMiddleware,
  notificationController.readAllNotifications,
);
router.patch(
  "/:id/read",
  authMiddleware,
  notificationController.readNotification,
);

module.exports = router;

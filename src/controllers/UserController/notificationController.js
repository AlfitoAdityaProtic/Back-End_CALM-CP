const notificationService = require("../../services/user/notificationService");

const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const notifications =
      await notificationService.getUserNotifications(userId);

    return res.status(200).json({
      success: true,
      message: "Notifications fetched successfully",
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
};

const getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const count = await notificationService.getUnreadNotificationCount(userId);

    return res.status(200).json({
      success: true,
      message: "Unread notification count fetched successfully",
      data: {
        count,
      },
    });
  } catch (error) {
    next(error);
  }
};

const readNotification = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await notificationService.markNotificationAsRead(userId, id);

    if (result.count === 0) {
      return res.status(404).json({
        success: false,
        message: "Notifikasi tidak ditemukan",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notifikasi telah dibaca",
    });
  } catch (error) {
    next(error);
  }
};

const readAllNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;

    await notificationService.markAllNotificationsAsRead(userId);

    return res.status(200).json({
      success: true,
      message: "semua notifikasi telah dibaca",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  readNotification,
  readAllNotifications,
};

const prisma = require("../../config/prisma");
const nodemailer = require("nodemailer");
const axios = require("axios");

const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});
// kirim notif ke in-app notification
const createInAppNotification = async ({
  userId,
  type,
  title,
  message,
  relatedMoodEntryId = null,
  relatedSocialBatteryLogId = null,
}) => {
  return prisma.notification.create({
    data: {
      userId,
      type,
      channel: "in_app",
      status: "sent",
      title,
      message,
      relatedMoodEntryId,
      relatedSocialBatteryLogId,
      sentAt: new Date(),
    },
  });
};
// kirim notif ke email
const sendEmailNotification = async ({
  userId,
  type,
  title,
  message,
  relatedMoodEntryId = null,
  relatedSocialBatteryLogId = null,
}) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      fullName: true,
      isEmailVerified: true,
    },
  });

  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      channel: "email",
      status: "pending",
      title,
      message,
      relatedMoodEntryId,
      relatedSocialBatteryLogId,
    },
  });

  try {
    if (!user || !user.email) {
      throw new Error("Email user tidak ditemukan");
    }

    await emailTransporter.sendMail({
      from: process.env.SMTP_FROM,
      to: user.email,
      subject: title,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>${title}</h2>
          <p>Halo ${user.fullName || "teman"},</p>
          <p>${message}</p>
          <p>Semoga harimu lebih ringan hari ini.</p>
        </div>
      `,
    });

    return prisma.notification.update({
      where: { id: notification.id },
      data: {
        status: "sent",
        sentAt: new Date(),
        error: null,
      },
    });
  } catch (error) {
    await prisma.notification.update({
      where: { id: notification.id },
      data: {
        status: "failed",
        error: error.message,
      },
    });

    return notification;
  }
};
// kirim notif ke whatsapp
const sendWhatsappNotification = async ({
  userId,
  type,
  title,
  message,
  relatedMoodEntryId = null,
  relatedSocialBatteryLogId = null,
}) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      phoneNumber: true,
      fullName: true,
    },
  });

  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      channel: "whatsapp",
      status: "pending",
      title,
      message,
      relatedMoodEntryId,
      relatedSocialBatteryLogId,
    },
  });

  try {
    if (!user || !user.phoneNumber) {
      throw new Error("Nomor WhatsApp user tidak ditemukan");
    }

    await axios.post(
      process.env.FONNTE_URL,
      {
        target: user.phoneNumber,
        message: `✨ ${title}\n\n${message}`,
      },
      {
        headers: {
          Authorization: process.env.FONNTE_TOKEN,
        },
      },
    );

    return prisma.notification.update({
      where: { id: notification.id },
      data: {
        status: "sent",
        sentAt: new Date(),
        error: null,
      },
    });
  } catch (error) {
    return prisma.notification.update({
      where: { id: notification.id },
      data: {
        status: "failed",
        error: error.message,
      },
    });
  }
};
// kirim notif ke in-app dan email sekaligus
const sendInAppAndEmailNotification = async ({
  userId,
  type,
  title,
  message,
  relatedMoodEntryId = null,
  relatedSocialBatteryLogId = null,
}) => {
  const payload = {
    userId,
    type,
    title,
    message,
    relatedMoodEntryId,
    relatedSocialBatteryLogId,
  };

  const inAppNotification = await createInAppNotification(payload);

  sendEmailNotification(payload).catch((error) => {
    console.error("Gagal mengirim email notification:", error.message);
  });

  return inAppNotification;
};
// kirim notif ke in-app, email, dan whatsapp
const sendAllNotifications = async ({
  userId,
  type,
  title,
  message,
  relatedMoodEntryId = null,
  relatedSocialBatteryLogId = null,
}) => {
  const payload = {
    userId,
    type,
    title,
    message,
    relatedMoodEntryId,
    relatedSocialBatteryLogId,
  };

  const inAppNotification = await createInAppNotification(payload);

  sendEmailNotification(payload).catch((error) => {
    console.error("Gagal mengirim email notification:", error.message);
  });

  sendWhatsappNotification(payload).catch((error) => {
    console.error("Gagal mengirim WhatsApp notification:", error.message);
  });

  return inAppNotification;
};

const getUserNotifications = async (userId) => {
  return prisma.notification.findMany({
    where: {
      userId,
      channel: "in_app",
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

const getUnreadNotificationCount = async (userId) => {
  return prisma.notification.count({
    where: {
      userId,
      channel: "in_app",
      readAt: null,
    },
  });
};

const markNotificationAsRead = async (userId, notificationId) => {
  return prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId,
      channel: "in_app",
    },
    data: {
      readAt: new Date(),
    },
  });
};

const markAllNotificationsAsRead = async (userId) => {
  return prisma.notification.updateMany({
    where: {
      userId,
      channel: "in_app",
      readAt: null,
    },
    data: {
      readAt: new Date(),
    },
  });
};

module.exports = {
  createInAppNotification,
  sendEmailNotification,
  sendInAppAndEmailNotification,
  sendWhatsappNotification,
  sendAllNotifications,
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};

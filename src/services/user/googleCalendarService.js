const { google } = require("googleapis");
const prisma = require("../../config/prisma");
const logActivity = require("../../utils/activityLogger");
const socialBatteryService = require("./socialBattery/socialBatteryService");
const notificationService = require("./notificationService");

function createOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );
}

async function getGoogleAccountByUserId(userId) {
  if (!userId) {
    throw new Error("User ID is required");
  }

  const googleAccount = await prisma.googleAccount.findUnique({
    where: { userId },
  });

  if (!googleAccount) {
    throw new Error("Google account not connected");
  }

  return googleAccount;
}

async function syncGoogleCalendarEvents(
  userId,
  ipAddress = null,
  userAgent = null,
) {
  const googleAccount = await getGoogleAccountByUserId(userId);

  const oauth2Client = createOAuthClient();
  oauth2Client.setCredentials({
    access_token: googleAccount.accessToken,
    refresh_token: googleAccount.refreshToken,
    expiry_date: googleAccount.tokenExpiry
      ? new Date(googleAccount.tokenExpiry).getTime()
      : undefined,
  });

  const calendar = google.calendar({
    version: "v3",
    auth: oauth2Client,
  });

  const timeMin = new Date();
  timeMin.setMonth(timeMin.getMonth() - 1);

  const timeMax = new Date();
  timeMax.setMonth(timeMax.getMonth() + 3);

  const response = await calendar.events.list({
    calendarId: "primary",
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
  });

  // const events = response.data.items || [];
  const events = (response.data.items || []).filter(
    (event) => event.status !== "cancelled",
  );

  let createdCount = 0;
  let updatedCount = 0;

  for (const event of events) {
    if (!event.id) continue;

    const startRaw = event.start?.dateTime || event.start?.date;
    const endRaw = event.end?.dateTime || event.end?.date;

    if (!startRaw || !endRaw) continue;

    const data = {
      userId,
      googleAccountId: googleAccount.id,
      googleEventId: event.id,
      title: event.summary || "Untitled Event",
      description: event.description || null,
      location: event.location || null,
      startTime: new Date(startRaw),
      endTime: new Date(endRaw),
      isAllDay: !!event.start?.date,
      attendeeCount: event.attendees ? event.attendees.length : 0,
      eventType: event.eventType || null,
    };

    const existingEvent = await prisma.calendarEvent.findUnique({
      where: {
        googleAccountId_googleEventId: {
          googleAccountId: googleAccount.id,
          googleEventId: event.id,
        },
      },
    });

    if (existingEvent) {
      await prisma.calendarEvent.update({
        where: {
          googleAccountId_googleEventId: {
            googleAccountId: googleAccount.id,
            googleEventId: event.id,
          },
        },
        data,
      });
      updatedCount++;
    } else {
      await prisma.calendarEvent.create({
        data,
      });
      createdCount++;
    }
  }

  const googleEventIds = events
    .filter((event) => event.id)
    .map((event) => event.id);

  let deletedCount = 0;

  if (googleEventIds.length > 0) {
    const deletedResult = await prisma.calendarEvent.deleteMany({
      where: {
        userId,
        googleAccountId: googleAccount.id,
        googleEventId: {
          notIn: googleEventIds,
        },
        startTime: {
          gte: timeMin,
          lte: timeMax,
        },
      },
    });

    deletedCount = deletedResult.count;
  }

  const today = new Date();

  const socialBatteryResult =
    await socialBatteryService.calculateSocialBatteryByDate(userId, today);

  await logActivity({
    userId,
    action: "GOOGLE_CALENDAR_SYNC",
    description: `User melakukan sinkronisasi Google Calendar (${events.length} event diproses)`,
    ipAddress,
    userAgent,
  });

  await notificationService.createInAppNotification({
    userId,
    type: "system",
    title: "Kalender berhasil disinkronkan",
    message: `Sinkronisasi selesai. ${createdCount} event baru, ${updatedCount} event diperbarui, dan ${deletedCount} event dihapus.`,
  });

  return {
    totalFetched: events.length,
    createdCount,
    updatedCount,
    deletedCount,
    socialBattery: socialBatteryResult,
  };
}

async function getCalendarEvents(userId) {
  const googleAccount = await getGoogleAccountByUserId(userId);

  return prisma.calendarEvent.findMany({
    where: {
      userId,
      googleAccountId: googleAccount.id,
    },
    orderBy: { startTime: "asc" },
  });
}

async function getCalendarEventsByRange(userId, start, end) {
  const googleAccount = await getGoogleAccountByUserId(userId);

  return prisma.calendarEvent.findMany({
    where: {
      userId,
      googleAccountId: googleAccount.id,
      startTime: {
        gte: new Date(start),
      },
      endTime: {
        lte: new Date(end),
      },
    },
    orderBy: { startTime: "asc" },
  });
}

module.exports = {
  syncGoogleCalendarEvents,
  getCalendarEvents,
  getCalendarEventsByRange,
};

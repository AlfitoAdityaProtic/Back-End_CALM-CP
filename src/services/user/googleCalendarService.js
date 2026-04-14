const { google } = require("googleapis");
const prisma = require("../../config/prisma");
const logActivity = require("../../utils/activityLogger");

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

  const events = response.data.items || [];

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
        userId_googleEventId: {
          userId,
          googleEventId: event.id,
        },
      },
    });

    if (existingEvent) {
      await prisma.calendarEvent.update({
        where: {
          userId_googleEventId: {
            userId,
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

  await logActivity({
    userId,
    action: "GOOGLE_CALENDAR_SYNC",
    description: `User melakukan sinkronisasi Google Calendar (${events.length} event diproses)`,
    ipAddress,
    userAgent,
  });

  return {
    totalFetched: events.length,
    createdCount,
    updatedCount,
  };
}

async function getCalendarEvents(userId) {
  return prisma.calendarEvent.findMany({
    where: { userId },
    orderBy: { startTime: "asc" },
  });
}

async function getCalendarEventsByRange(userId, start, end) {
  return prisma.calendarEvent.findMany({
    where: {
      userId,
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
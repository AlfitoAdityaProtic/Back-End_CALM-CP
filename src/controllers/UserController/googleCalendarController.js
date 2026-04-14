const googleCalendarService = require("../../services/user/googleCalendarService");

async function syncGoogleCalendar(req, res) {
  try {
    const userId = req.user.userId;

    const result = await googleCalendarService.syncGoogleCalendarEvents(
      userId,
      req.ip,
      req.get("user-agent"),
    );

    return res.status(200).json({
      success: true,
      message: "Google Calendar synced successfully",
      data: result,
    });
  } catch (error) {
    console.error("syncGoogleCalendar error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to sync Google Calendar",
      error: error.message,
    });
  }
}

async function getGoogleCalendarEvents(req, res) {
  try {
    const userId = req.user.userId;
    const events = await googleCalendarService.getCalendarEvents(userId);

    return res.status(200).json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error("getGoogleCalendarEvents error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get calendar events",
      error: error.message,
    });
  }
}

async function getGoogleCalendarEventsByRange(req, res) {
  try {
    const userId = req.user.userId;
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({
        success: false,
        message: "start and end query are required",
      });
    }

    const events = await googleCalendarService.getCalendarEventsByRange(
      userId,
      start,
      end,
    );

    return res.status(200).json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error("getGoogleCalendarEventsByRange error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get calendar events by range",
      error: error.message,
    });
  }
}

module.exports = {
  syncGoogleCalendar,
  getGoogleCalendarEvents,
  getGoogleCalendarEventsByRange,
};
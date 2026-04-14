const express = require("express");
const router = express.Router();

const authMiddleware = require("../../middlewares/authMiddleware");
const googleCalendarController = require("../../controllers/UserController/googleCalendarController");

router.post("/sync", authMiddleware, googleCalendarController.syncGoogleCalendar);
router.get("/events", authMiddleware, googleCalendarController.getGoogleCalendarEvents);
router.get(
  "/events/range",
  authMiddleware,
  googleCalendarController.getGoogleCalendarEventsByRange,
);

module.exports = router;
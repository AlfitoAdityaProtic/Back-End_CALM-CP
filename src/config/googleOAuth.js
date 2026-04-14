const { google } = require("googleapis");

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI,
);

const GOOGLE_SCOPES = [
  "openid",
  "email",
  "profile",
  process.env.GOOGLE_CALENDAR_SCOPE ||
    "https://www.googleapis.com/auth/calendar.readonly",
];

module.exports = {
  oauth2Client,
  GOOGLE_SCOPES,
};

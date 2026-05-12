const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/authRoutes");
// routes milik user
const userDashboardRoutes = require("./routes/user/dashboardUserRoutes");
const notificationRoute = require("./routes/user/notificationRoutes");
const userRoutes = require("./routes/userRoutes");
const userMoodLabelRoutes = require("./routes/user/mood-labelRoutes");
const userMoodEntriesRoutes = require("./routes/user/moodEntriesRoutes");
const googleRoutes = require("./routes/user/googleRoutes");
const googleCalendarRoutes = require("./routes/user/googleCalendarRoutes");
const socialBatteryRoutes = require("./routes/user/socialBatteryRoutes");

// routes milik admin
const adminDashboardRoutes = require("./routes/admin/dashboardRoutes");
const adminMoodEntriesRoutes = require("./routes/admin/moodEntryRoutes");
const adminEncouragementRoutes = require("./routes/admin/encouragementRoutes");
const adminSocialBatteryRoutes = require("./routes/admin/socialBatteryLogsRoutes");
const adminActivityLogRoutes = require("./routes/admin/activityLogRoutes");
const adminMoodLabelRoutes = require("./routes/admin/mood-labelRoutes");
const adminUserRoutes = require("./routes/admin/userRoutes");
const adminStatusBatteryRoutes = require("./routes/admin/statusBatteryRoutes");

const app = express();

app.set("trust proxy", 1);

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://mycalmspace.online",
      "https://www.mycalmspace.online",
    ],
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Selamat datang di MyCalmSpace API",
    system: {
      name: "MyCalmSpace API",
      version: "1.0.0",
      status: "running",
      environment: process.env.NODE_ENV || "development",
      timestamp: new Date().toISOString(),
    },
    features: [
      "Authentication & Authorization",
      "Mood Tracking",
      "AI Encouragement Analysis",
      "Social Battery Monitoring",
      "Google Calendar Integration",
      "Admin Dashboard Management",
    ],
  });
});

app.use("/api/auth", authRoutes);

// api milik user
app.use("/api/users", userDashboardRoutes);
app.use("/api/users", userRoutes);
app.use("/api/users", userMoodLabelRoutes);
app.use("/api/users", userMoodEntriesRoutes);
app.use("/api/users", socialBatteryRoutes);
app.use("/api/google", googleRoutes);
app.use("/api/google/calendar", googleCalendarRoutes);
app.use("/api/users/notifications", notificationRoute);

// api milik admin
app.use("/api/admin", adminDashboardRoutes);
app.use("/api/admin", adminMoodEntriesRoutes);
app.use("/api/admin", adminEncouragementRoutes);
app.use("/api/admin", adminSocialBatteryRoutes);
app.use("/api/admin", adminActivityLogRoutes);
app.use("/api/admin", adminMoodLabelRoutes);
app.use("/api/admin", adminUserRoutes);
app.use("/api/admin", adminStatusBatteryRoutes);

module.exports = app;

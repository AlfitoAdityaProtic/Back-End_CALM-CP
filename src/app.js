const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/authRoutes");
// routes milik user
const userDashboardRoutes = require("./routes/user/dashboardUserRoutes");
const userRoutes = require("./routes/userRoutes");
const userMoodLabelRoutes = require("./routes/user/mood-labelRoutes");
const userMoodEntriesRoutes = require("./routes/user/moodEntriesRoutes");
const googleRoutes = require("./routes/user/googleRoutes");
const googleCalendarRoutes = require("./routes/user/googleCalendarRoutes");
const socialBatteryRoutes = require("./routes/user/socialBatteryRoutes");

// routes milik admin
const adminDashboardRoutes = require("./routes/admin/dashboardRoutes");
const adminMoodEntriesRoutes = require("./routes/admin/moodEntryRoutes");
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
  res.json({
    message: "API jalan, selamat datang di MyCalmSpace API",
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

// api milik admin
app.use("/api/admin", adminDashboardRoutes);
app.use("/api/admin", adminMoodEntriesRoutes);
app.use("/api/admin", adminActivityLogRoutes);
app.use("/api/admin", adminMoodLabelRoutes);
app.use("/api/admin", adminUserRoutes);
app.use("/api/admin", adminStatusBatteryRoutes);

module.exports = app;

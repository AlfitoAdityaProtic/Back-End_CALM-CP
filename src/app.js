const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/authRoutes");
// routes milik user
const userRoutes = require("./routes/userRoutes");
const userMoodLabelRoutes = require("./routes/user/mood-labelRoutes");
const userMoodEntriesRoutes = require("./routes/user/moodEntriesRoutes");
const googleRoutes = require("./routes/user/googleRoutes");
const googleCalendarRoutes = require("./routes/user/googleCalendarRoutes");

// routes milik admin
const adminActivityLogRoutes = require("./routes/admin/activityLogRoutes");
const adminMoodLabelRoutes = require("./routes/admin/mood-labelRoutes");

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.json({
    message: "API jalan",
  });
});

app.use("/api/auth", authRoutes);

// api milik user
app.use("/api/users", userRoutes);
app.use("/api/users", userMoodLabelRoutes);
app.use("/api/users", userMoodEntriesRoutes);
app.use("/api/google", googleRoutes);
app.use("/api/google/calendar", googleCalendarRoutes);

// api milik admin
app.use("/api/admin", adminActivityLogRoutes);
app.use("/api/admin", adminMoodLabelRoutes);

module.exports = app;

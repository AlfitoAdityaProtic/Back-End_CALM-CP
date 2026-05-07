const express = require("express");
const router = express.Router();

const authMiddleware = require("../../middlewares/authMiddleware");
const authorizeRole = require("../../middlewares/authorizeRole");
const dashboardController = require("../../controllers/adminController/DashboardAdminController");

router.get(
  "/",
  authMiddleware,
  authorizeRole("admin"),
  dashboardController.getDashboard,
);

module.exports = router;

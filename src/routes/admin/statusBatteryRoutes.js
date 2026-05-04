const express = require("express");
const router = express.Router();

const statusBatteryController = require("../../controllers/adminController/statusBatteryController");
const authMiddleware = require("../../middlewares/authMiddleware");
const authorizeRole = require("../../middlewares/authorizeRole");

router.use(authMiddleware, authorizeRole("admin"));

router.post("/status-batteries", statusBatteryController.createStatusBattery);

router.get("/status-batteries", statusBatteryController.getAllStatusBattery);

router.get(
  "/status-batteries/:id",
  statusBatteryController.getStatusBatteryById,
);

router.put(
  "/status-batteries/:id",
  statusBatteryController.updateStatusBattery,
);

router.delete(
  "/status-batteries/:id",
  statusBatteryController.deleteStatusBattery,
);

router.patch(
  "/status-batteries/:id/toggle-active",
  statusBatteryController.toggleStatusBattery,
);

module.exports = router;

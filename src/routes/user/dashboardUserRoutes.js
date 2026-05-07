const express = require("express");
const router = express.Router();

const authMiddleware = require("../../middlewares/authMiddleware");
const dashboardUserController = require("../../controllers/UserController/dashboardUserController");

router.get("/", authMiddleware, dashboardUserController.getDashboard);

module.exports = router;

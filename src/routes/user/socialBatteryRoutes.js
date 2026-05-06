const express = require("express");
const router = express.Router();
const socialBatteryController = require("../../controllers/UserController/socialBatteryController");
const authMiddleware = require("../../middlewares/authMiddleware");


router.post(
  "/social-battery/calculate",
  authMiddleware,
  socialBatteryController.calculateSocialBattery,
);

router.post(
  "/social-battery/generate-ai-insight",
  authMiddleware,
  socialBatteryController.generateAiInsight,
);

router.get(
  "/social-battery/today",
  authMiddleware,
  socialBatteryController.getTodaySocialBattery,
);

router.get(
  "/social-battery/history",
  authMiddleware,
  socialBatteryController.getSocialBatteryHistory,
);

router.get(
  "/social-battery/:date",
  authMiddleware,
  socialBatteryController.getSocialBatteryByDate,
);

module.exports = router;

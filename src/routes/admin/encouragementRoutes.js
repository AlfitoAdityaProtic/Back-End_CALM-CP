const express = require("express");
const router = express.Router();

const EncouragementController = require("../../controllers/adminController/encouragementController");

const authMiddleware = require("../../middlewares/authMiddleware");
const authorizeRole = require("../../middlewares/authorizeRole");

router.get(
  "/encouragement-results",
  authMiddleware,
  authorizeRole("admin"),
  EncouragementController.getEncouragementResults,
);

router.get(
  "/encouragement-results/export/excel",
  authMiddleware,
  authorizeRole("admin"),
  EncouragementController.exportEncouragementResults,
);
router.get(
  "/encouragement-results/:id",
  authMiddleware,
  authorizeRole("admin"),
  EncouragementController.getEncouragementResultById,
);

module.exports = router;

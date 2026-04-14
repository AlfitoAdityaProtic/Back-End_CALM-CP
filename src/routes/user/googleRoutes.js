const express = require('express');
const router = express.Router();

const googleController = require('../../controllers/UserController/googleController');
const authMiddleware = require('../../middlewares/authMiddleware');

router.get('/connect', authMiddleware, googleController.connectGoogle);
router.get('/callback', googleController.googleCallback);
router.get('/status', authMiddleware, googleController.getGoogleStatus);
router.delete('/disconnect', authMiddleware, googleController.disconnectGoogle);

module.exports = router;
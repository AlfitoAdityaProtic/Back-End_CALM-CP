const googleService = require("../../services/user/googleService");

async function connectGoogle(req, res) {
  try {
    console.log("connect req.user:", req.user);

    const userId = req.user.userId;
    const authUrl = googleService.getGoogleAuthURL(userId);

    // return res.redirect(authUrl);
    return res.status(200).json({
      success: true,
      data: authUrl,
    });
  } catch (error) {
    console.error("connectGoogle error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to connect Google account",
      error: error.message,
    });
  }
}

async function googleCallback(req, res) {
  try {
    const { code, state } = req.query;

    // console.log("GOOGLE CALLBACK QUERY:", req.query);

    if (!code || !state) {
      return res.status(400).json({
        success: false,
        message: "Invalid Google callback parameters",
      });
    }

    let parsedState;
    try {
      parsedState = JSON.parse(state);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid state format",
      });
    }

    // console.log("GOOGLE CALLBACK parsedState:", parsedState);

    const userId = parsedState.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID not found in state",
      });
    }

    const tokens = await googleService.exchangeCodeForTokens(code);
    // console.log("GOOGLE TOKENS RECEIVED:", {
    //   hasAccessToken: !!tokens.access_token,
    //   hasRefreshToken: !!tokens.refresh_token,
    //   expiryDate: tokens.expiry_date || null,
    // });

    const profile = await googleService.getGoogleUserProfile(tokens);
    // console.log("GOOGLE PROFILE RECEIVED:", profile);

    const savedGoogleAccount = await googleService.saveGoogleAccount({
      userId,
      profile,
      tokens,
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    // return res.status(200).json({
    //   success: true,
    //   message: "Google account connected successfully",
    //   data: {
    //     id: savedGoogleAccount.id,
    //     userId: savedGoogleAccount.userId,
    //     googleEmail: savedGoogleAccount.googleEmail,
    //     googleSub: savedGoogleAccount.googleSub,
    //   },
    // });

    return res.redirect(
      `${process.env.FRONTEND_URL}/google-success?connected=true`,
    );
  } catch (error) {
    console.error("googleCallback error:", error);

    // return res.status(500).json({
    //   success: false,
    //   message: "Failed to handle Google callback",
    //   error: error.message,
    // });

    return res.redirect(
      `${process.env.FRONTEND_URL}/google-success?connected=false`,
    );
  }
}
async function getGoogleStatus(req, res) {
  try {
    const userId = req.user.userId;
    const status = await googleService.getGoogleConnectionStatus(userId);

    return res.status(200).json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error("getGoogleStatus error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get Google connection status",
      error: error.message,
    });
  }
}

async function disconnectGoogle(req, res) {
  try {
    const userId = req.user.userId;
    const result = await googleService.disconnectGoogleAccount(
      userId,
      req.ip,
      req.get("user-agent"),
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Google account not connected",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Google account disconnected successfully",
    });
  } catch (error) {
    console.error("disconnectGoogle error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to disconnect Google account",
      error: error.message,
    });
  }
}

module.exports = {
  connectGoogle,
  googleCallback,
  getGoogleStatus,
  disconnectGoogle,
};

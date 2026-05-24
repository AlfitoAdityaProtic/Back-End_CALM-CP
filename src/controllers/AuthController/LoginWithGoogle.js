const crypto = require("crypto");
const axios = require("axios");
const prisma = require("../../config/prisma");
const logActivity = require("../../utils/activityLogger");

const {
  generateAccessToken,
  generateRefreshToken,
  getRefreshTokenExpiryDate,
} = require("../../utils/token");

const googleLogin = (req, res) => {
  const url =
    `https://accounts.google.com/o/oauth2/v2/auth` +
    `?client_id=${process.env.GOOGLE_CLIENT_ID}` +
    `&redirect_uri=${process.env.GOOGLE_LOGIN_REDIRECT_URI}` +
    `&response_type=code` +
    `&scope=openid%20email%20profile`;

  return res.redirect(url);
};

const googleCallback = async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_code`);
    }

    const params = new URLSearchParams();
    params.append("code", code);
    params.append("client_id", process.env.GOOGLE_CLIENT_ID);
    params.append("client_secret", process.env.GOOGLE_CLIENT_SECRET);
    params.append("redirect_uri", process.env.GOOGLE_LOGIN_REDIRECT_URI);
    params.append("grant_type", "authorization_code");

    const tokenRes = await axios.post(
      "https://oauth2.googleapis.com/token",
      params,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );

    const { access_token } = tokenRes.data;

    const userRes = await axios.get(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      },
    );

    const googleUser = userRes.data;
    const email = googleUser.email.toLowerCase();

    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          fullName: googleUser.name,
          profilePhotoUrl: googleUser.picture,
          authProvider: "google",
          isEmailVerified: true,
          role: "user",
        },
      });
    }

    if (!user.isActive) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=inactive`);
    }

    if (user.authProvider !== "google") {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          // authProvider: "google",
          isEmailVerified: true,
        },
      });
    }

    const refreshToken = generateRefreshToken();

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: getRefreshTokenExpiryDate(),
      },
    });

    const oauthCode = crypto.randomBytes(32).toString("hex");

    await prisma.oAuthCode.create({
      data: {
        code: oauthCode,
        refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    await logActivity({
      userId: user.id,
      action: "LOGIN_GOOGLE",
      description: `User login dengan Google: ${user.email}`,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.redirect(
      `${process.env.FRONTEND_URL}/oauth-success?code=${encodeURIComponent(
        oauthCode,
      )}`,
    );
  } catch (error) {
    console.error("GOOGLE LOGIN ERROR:", error.response?.data || error.message);
    return res.redirect(
      `${process.env.FRONTEND_URL}/login?error=google_failed`,
    );
  }
};

const exchangeGoogleCode = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        message: "OAuth code wajib diisi",
      });
    }

    const oauthCode = await prisma.oAuthCode.findFirst({
      where: {
        code,
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: {
          // select: {
          //   id: true,
          //   email: true,
          //   role: true,
          //   isActive: true,
          //   onboardingCompleted: true,
          // },
          select: {
            id: true,
            email: true,
            username: true,
            fullName: true,
            profilePhotoUrl: true,
            authProvider: true,
            role: true,
            isActive: true,
            onboardingCompleted: true,
            createdAt: true,
          },
        },
      },
    });

    if (!oauthCode) {
      return res.status(401).json({
        message: "OAuth code tidak valid atau sudah expired",
      });
    }

    if (!oauthCode.user.isActive) {
      return res.status(403).json({
        message: "Akun anda telah dinonaktifkan",
      });
    }

    await prisma.oAuthCode.update({
      where: { id: oauthCode.id },
      data: { used: true },
    });

    const accessToken = generateAccessToken(oauthCode.user);

    return res.status(200).json({
      message: "Login Google berhasil",
      accessToken,
      refreshToken: oauthCode.refreshToken,
      // data: {
      //   id: oauthCode.user.id,
      //   email: oauthCode.user.email,
      //   role: oauthCode.user.role,
      //   onboardingCompleted: oauthCode.user.onboardingCompleted,
      // },
      data: {
        id: oauthCode.user.id,
        email: oauthCode.user.email,
        username: oauthCode.user.username,
        fullName: oauthCode.user.fullName,
        profilePhotoUrl: oauthCode.user.profilePhotoUrl,
        authProvider: oauthCode.user.authProvider,
        role: oauthCode.user.role,
        onboardingCompleted: oauthCode.user.onboardingCompleted,
        createdAt: oauthCode.user.createdAt,
      },
    });
  } catch (error) {
    console.error("EXCHANGE GOOGLE CODE ERROR:", error);

    return res.status(500).json({
      message: "Terjadi kesalahan pada server",
    });
  }
};

module.exports = {
  googleLogin,
  googleCallback,
  exchangeGoogleCode,
};

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
          authProvider: "google",
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

    // res.cookie("refreshToken", refreshToken, {
    //   httpOnly: true,
    //   secure: process.env.NODE_ENV === "production",
    //   //   sameSite: "lax",
    //   sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    //   maxAge: 7 * 24 * 60 * 60 * 1000,
    // });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      domain: ".calm-be.online",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    await logActivity({
      userId: user.id,
      action: "LOGIN_GOOGLE",
      description: `User login dengan Google: ${user.email}`,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.redirect(`${process.env.FRONTEND_URL}/oauth-success`);
  } catch (error) {
    console.error("GOOGLE LOGIN ERROR:", error.response?.data || error.message);
    console.error("GOOGLE LOGIN ERROR STATUS:", error.response?.status);
    console.error("GOOGLE LOGIN ERROR DATA:", error.response?.data);
    console.error("GOOGLE LOGIN ERROR MESSAGE:", error.message);
    return res.redirect(
      `${process.env.FRONTEND_URL}/login?error=google_failed`,
    );
  }
};

const getGoogleLoginAccessToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        message: "Refresh token tidak ditemukan",
      });
    }

    const savedRefreshToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
      },
    });

    if (!savedRefreshToken) {
      return res.status(401).json({
        message: "Refresh token tidak valid",
      });
    }

    if (savedRefreshToken.expiresAt < new Date()) {
      await prisma.refreshToken.delete({
        where: { token: refreshToken },
      });

      return res.status(401).json({
        message: "Refresh token expired",
      });
    }

    if (!savedRefreshToken.user.isActive) {
      return res.status(403).json({
        message: "Akun anda telah dinonaktifkan",
      });
    }

    const accessToken = generateAccessToken(savedRefreshToken.user);

    return res.status(200).json({
      message: "Access token berhasil dibuat",
      accessToken,
      data: {
        id: savedRefreshToken.user.id,
        email: savedRefreshToken.user.email,
        role: savedRefreshToken.user.role,
      },
    });
  } catch (error) {
    console.error("GET GOOGLE ACCESS TOKEN ERROR:", error);

    return res.status(500).json({
      message: "Terjadi kesalahan pada server",
    });
  }
};

module.exports = {
  googleLogin,
  googleCallback,
  getGoogleLoginAccessToken,
};

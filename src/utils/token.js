const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const generateAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
    },
  );
};

const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString("hex");
};

const getRefreshTokenExpiryDate = () => {
  const expiry = new Date();
  const refreshTokenTtl = process.env.REFRESH_TOKEN_EXPIRES_IN || "2d";

  const match = refreshTokenTtl.match(/^(\d+)([dhm])$/);

  if (!match) {
    throw new Error(
      "Format REFRESH_TOKEN_EXPIRES_IN tidak valid. Gunakan format seperti 7d, 12h, atau 30m",
    );
  }

  const value = Number(match[1]);
  const unit = match[2];

  if (unit === "d") expiry.setDate(expiry.getDate() + value);
  if (unit === "h") expiry.setHours(expiry.getHours() + value);
  if (unit === "m") expiry.setMinutes(expiry.getMinutes() + value);

  return expiry;
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  getRefreshTokenExpiryDate,
};

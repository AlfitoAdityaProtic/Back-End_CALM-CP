const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Token tidak ditemukan",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!process.env.JWT_ACCESS_SECRET) {
      throw new Error("JWT_ACCESS_SECRET belum dikonfigurasi");
    }

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // req.user = decoded;
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Token tidak valid atau expired",
    });
  }
};

module.exports = authMiddleware;

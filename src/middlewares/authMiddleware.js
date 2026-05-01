// const jwt = require("jsonwebtoken");

// const authMiddleware = (req, res, next) => {
//   try {
//     const authHeader = req.headers.authorization;

//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//       return res.status(401).json({
//         message: "Token tidak ditemukan",
//       });
//     }

//     const token = authHeader.split(" ")[1];

//     if (!process.env.JWT_ACCESS_SECRET) {
//       throw new Error("JWT_ACCESS_SECRET belum dikonfigurasi");
//     }

//     const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

//     // req.user = decoded;
//     req.user = {
//       userId: decoded.userId,
//       email: decoded.email,
//       role: decoded.role,
//     };

//     next();
//   } catch (error) {
//     return res.status(401).json({
//       message: "Token tidak valid atau expired",
//     });
//   }
// };

// module.exports = authMiddleware;

const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma"); 

const authMiddleware = async (req, res, next) => {
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

    const user = await prisma.user.findUnique({
      where: {
        id: decoded.userId,
      },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        code: "USER_NOT_FOUND",
        message: "User tidak ditemukan",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        code: "ACCOUNT_DISABLED",
        message: "Akun Anda telah dinonaktifkan",
      });
    }

    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      code: "INVALID_OR_EXPIRED_TOKEN",
      message: "Token tidak valid atau expired",
    });
  }
};

module.exports = authMiddleware;

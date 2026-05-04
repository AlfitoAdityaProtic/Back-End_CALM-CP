const crypto = require("crypto");
const bcrypt = require("bcrypt");
const sendEmail = require("../../utils/sendEmail");
const prisma = require("../../config/prisma");
const logActivity = require("../../utils/activityLogger");

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email wajib diisi",
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        authProvider: true,
      },
    });

    const responseMessage = {
      message: "Jika email terdaftar, link reset password akan dikirim",
    };

    if (!user) {
      return res.status(200).json(responseMessage);
    }

    if (user.authProvider !== "local") {
      return res.status(200).json(responseMessage);
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    await sendEmail({
      to: user.email,
      subject: "Reset Password MyCalmSpace",
      html: `
  <div style="font-family: Arial, sans-serif; background: linear-gradient(135deg, #3b82f6, #ffffff); padding: 40px 20px;">
    <div style="max-width: 500px; margin: auto; background: #ffffff; border-radius: 12px; padding: 30px; text-align: center; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
      <h2 style="color: #1e3a8a; margin-bottom: 10px;">
        Reset Password
      </h2>

      <p style="color: #555; font-size: 14px; margin-bottom: 25px;">
        Kami menerima permintaan untuk mengatur ulang password akun kamu.
        Klik tombol di bawah ini untuk melanjutkan.
      </p>

      <!-- Button -->
      <a href="${resetUrl}" 
         style="
           display: inline-block;
           padding: 12px 24px;
           background: #3b82f6;
           color: #ffffff;
           text-decoration: none;
           border-radius: 8px;
           font-weight: bold;
           margin-bottom: 20px;
         ">
         Reset Password
      </a>

      <p style="font-size: 12px; color: #888;">
        Link ini hanya berlaku selama 15 menit.
      </p>

      <p style="font-size: 12px; color: #aaa; margin-top: 20px;">
        Jika kamu tidak meminta reset password, abaikan email ini.
      </p>

    </div>
  </div>
`,
    });
    return res.status(200).json(responseMessage);
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);

    return res.status(error.statusCode || 500).json({
      message: "Terjadi kesalahan pada server",
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message: "Token, Password baru dan Konfirmasi Password wajib di Isi",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "Konfirmasi Password tidak Sesuai dengan Password Baru",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        message: "Password minimal 8 karakter",
      });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
        passwordHash: true,
      },
    });

    if (!user) {
      return res.status(400).json({
        message: "Token tidak Valid atau sudah Kadaluwarsa",
      });
    }
    const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash);
    if (isSamePassword) {
      return res.status(400).json({
        message: "Password Baru tidak boleh sama dengan Password Lama",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    await prisma.refreshToken.deleteMany({
      where: { userId: user.id },
    });

    await logActivity({
      userId: user.id,
      action: "RESET_PASSWORD",
      description: "User melakukan reset password",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
    return res.status(200).json({
      message: "Password berhasil direset, silahkan login kembali",
    });
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);

    return res.status(error.statusCode || 500).json({
      message: "Terjadi kesalahan pada server",
    });
  }
};

module.exports = {
  forgotPassword,
  resetPassword,
};

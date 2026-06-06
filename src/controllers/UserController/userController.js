const prisma = require("../../config/prisma");
const logActivity = require("../../utils/activityLogger");
const bcrypt = require("bcrypt");
const supabase = require("../../config/supabase");

const getUserProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.user.userId,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        username: true,
        phoneNumber: true,
        profilePhotoUrl: true,
        authProvider: true,
        isEmailVerified: true,
        onboardingCompleted: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User tidak ditemukan",
      });
    }

    return res.status(200).json({
      message: "Data profil berhasil diambil",
      data: user,
    });
  } catch (error) {
    console.error("GET ME ERROR:", error);

    return res.status(500).json({
      message: "Terjadi kesalahan pada server",
      error: error.message,
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    // const { fullName, username, email, phoneNumber, profilePhotoUrl } =
    const { fullName, username, phoneNumber, profilePhotoUrl } =
      req.body;
    const userId = req.user.userId;

    // console.log("BODY:", req.body);
    // console.log("FILE:", req.file);
    // const normalizedEmail = email?.toLowerCase().trim();

    // cek username kalau diubah
    if (username) {
      const existingUser = await prisma.user.findUnique({
        where: { username },
      });

      if (existingUser && existingUser.id !== userId) {
        return res.status(409).json({
          message: "Username sudah dipakai",
        });
      }
    }

    // if (normalizedEmail) {
    //   const existingEmail = await prisma.user.findUnique({
    //     where: { email: normalizedEmail },
    //   });

    //   if (existingEmail && existingEmail.id !== userId) {
    //     return res.status(409).json({
    //       message: "Email sudah digunakan oleh akun lain",
    //     });
    //   }
    // }

    const data = {};
    if (fullName !== undefined) data.fullName = fullName;
    if (username !== undefined) data.username = username;
    // if (email !== undefined) data.email = normalizedEmail;
    if (phoneNumber !== undefined) data.phoneNumber = phoneNumber;
    if (profilePhotoUrl !== undefined) data.profilePhotoUrl = profilePhotoUrl;

    if (req.file) {
      const fileExt = req.file.originalname.split(".").pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `profiles/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(process.env.SUPABASE_PROFILE_BUCKET)
        .upload(filePath, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: true,
        });

      if (uploadError) {
        return res.status(500).json({
          message: "Gagal upload foto profile",
          error: uploadError.message,
        });
      }

      const { data: publicUrlData } = supabase.storage
        .from(process.env.SUPABASE_PROFILE_BUCKET)
        .getPublicUrl(filePath);

      data.profilePhotoUrl = publicUrlData.publicUrl;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        fullName: true,
        username: true,
        phoneNumber: true,
        profilePhotoUrl: true,
        onboardingCompleted: true,
        role: true,
        updatedAt: true,
      },
    });

    await logActivity({
      userId,
      action: "UPDATE_PROFILE",
      description: "User memperbarui profile",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.status(200).json({
      message: "Profile berhasil diupdate",
      data: updatedUser,
    });
  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error);

    if (error.code === "P2002") {
      return res.status(409).json({
        message: "Username sudah dipakai",
      });
    }

    return res.status(500).json({
      message: "Terjadi kesalahan pada server",
      error: error.message,
    });
  }
};
const updatePassword = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message: "semua field password wajib di isi",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "Konfirmasi Password tidak Sesuai",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        message: "Password minimal 8 karakter",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        passwordHash: true,
        authProvider: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User tidak Ditemukan",
      });
    }

    if (user.authProvider !== "local") {
      return res.status(400).json({
        message: "Akun ini login dengan Google, tidak bisa ubah password",
      });
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!isValid) {
      return res.status(400).json({
        message: "Password lama salah",
      });
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash);
    if (isSamePassword) {
      return res.status(400).json({
        message: "Password baru tidak boleh sama dengan password lama",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: hashedPassword,
      },
    });

    await prisma.refreshToken.deleteMany({
      where: { userId },
    });

    await logActivity({
      userId,
      action: "UPDATE_PASSWORD",
      description: "User memperbarui password",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.status(200).json({
      message: "Password berhasil diubah. Silahkan Login Kembali",
    });
  } catch (error) {
    console.error("UPDATE PASSWORD ERROR:", error);

    return res.status(500).json({
      message: "Terjadi Kesalahan Server",
    });
  }
};

module.exports = {
  getUserProfile,
  updateProfile,
  updatePassword,
};

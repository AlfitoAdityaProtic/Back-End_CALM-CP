const prisma = require("../../config/prisma");
const logActivity = require("../../utils/activityLogger");

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
    const { fullName, username, phoneNumber, profilePhotoUrl } = req.body;
    const userId = req.user.userId;

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

    const data = {};
    if (fullName !== undefined) data.fullName = fullName;
    if (username !== undefined) data.username = username;
    if (phoneNumber !== undefined) data.phoneNumber = phoneNumber;
    if (profilePhotoUrl !== undefined) data.profilePhotoUrl = profilePhotoUrl;


    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        fullName,
        username,
        phoneNumber,
        profilePhotoUrl,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        username: true,
        phoneNumber: true,
        profilePhotoUrl: true,
        role: true,
        updatedAt: true,
      },
    });

    await logActivity({
      userId,
      action: "UPDATE_PROFILE",
      description: "User memperbarui profile",
    });

    return res.status(200).json({
      message: "Profile berhasil diupdate",
      data: updatedUser,
    });
  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error);

    return res.status(500).json({
      message: "Terjadi kesalahan pada server",
      error: error.message,
    });
  }
};


module.exports = {
  getUserProfile,
  updateProfile,
};
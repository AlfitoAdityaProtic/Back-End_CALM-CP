const userService = require("../../services/admin/userService");
const logActivity = require("../../utils/activityLogger");

const createUser = async (req, res) => {
  try {
    const user = await userService.createUser(req.body);

    const activityLog = await logActivity({
      userId: req.user.userId,
      action: "CREATE_USER",
      description: `Admin membuat user ${user.email} dengan role ${user.role}`,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    if (!activityLog) {
      console.warn("Create user berhasil, tetapi activity log gagal disimpan");
    }

    return res.status(201).json({
      message: "User berhasil dibuat",
      data: user,
    });
  } catch (error) {
    console.error("CREATE USER ERROR:", error);

    return res.status(error.statusCode || 500).json({
      message: error.message || "Terjadi kesalahan pada server",
    });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const result = await userService.getAllUsers(req.query);

    return res.status(200).json({
      message: "Daftar user berhasil diambil",
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    console.error("GET ALL USERS ERROR:", error);

    return res.status(error.statusCode || 500).json({
      message: error.message || "Terjadi kesalahan pada server",
    });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);

    return res.status(200).json({
      message: "Detail user berhasil diambil",
      data: user,
    });
  } catch (error) {
    console.error("GET USER BY ID ERROR:", error);

    return res.status(error.statusCode || 500).json({
      message: error.message || "Terjadi kesalahan pada server",
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const user = await userService.updateUser(
      req.params.id,
      req.body,
      req.user.userId,
    );
    const activityLog = await logActivity({
      userId: req.user.userId,
      action: "UPDATE_USER",
      description: `Admin memperbarui user ${user.email} dengan role ${user.role} dan status ${user.isActive ? "aktif" : "nonaktif"}`,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    if (!activityLog) {
      console.warn("Update user berhasil, tetapi activity log gagal disimpan");
    }

    return res.status(200).json({
      message: "User berhasil diperbarui",
      data: user,
    });
  } catch (error) {
    console.error("UPDATE USER ERROR:", error);

    return res.status(error.statusCode || 500).json({
      message: error.message || "Terjadi kesalahan pada server",
    });
  }
};

const toggleUserActive = async (req, res) => {
  try {
    const user = await userService.toggleUserActive(
      req.params.id,
      req.user.userId,
    );
    const activityLog = await logActivity({
      userId: req.user.userId,
      action: "TOGGLE_USER_ACTIVE",
      description: `Admin mengubah status user ${user.email} menjadi ${user.isActive ? "aktif" : "nonaktif"}`,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    if (!activityLog) {
      console.warn(
        "Toggle user active berhasil, tetapi activity log gagal disimpan",
      );
    }

    return res.status(200).json({
      message: "Status user berhasil diubah",
      data: user,
    });
  } catch (error) {
    console.error("TOGGLE USER ACTIVE ERROR:", error);

    return res.status(error.statusCode || 500).json({
      message: error.message || "Terjadi kesalahan pada server",
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);

    const result = await userService.deleteUser(req.params.id, req.user.userId);

    const activityLog = await logActivity({
      userId: req.user.userId,
      action: "DELETE_USER",
      description: `Admin menghapus user ${user.email}`,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    if (!activityLog) {
      console.warn("Delete user berhasil, tetapi activity log gagal disimpan");
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("DELETE USER ERROR:", error);

    return res.status(error.statusCode || 500).json({
      message: error.message || "Terjadi kesalahan pada server",
    });
  }
};

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  toggleUserActive,
  deleteUser,
};

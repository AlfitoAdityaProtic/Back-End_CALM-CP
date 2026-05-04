const statusBatteryService = require("../../services/admin/statusBatteryService");
const logActivity = require("../../utils/activityLogger");

const createStatusBattery = async (req, res) => {
  try {
    const statusBattery = await statusBatteryService.createStatusBattery(
      req.body,
    );

    const activityLog = await logActivity({
      userId: req.user.userId,
      action: "CREATE_STATUS_BATTERY",
      description: `Membuat status battery ${statusBattery.name}`,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    if (!activityLog) {
      console.warn(
        "Create status battery berhasil, tetapi activity log gagal disimpan",
      );
    }

    return res.status(201).json({
      message: "Status battery berhasil dibuat",
      data: statusBattery,
    });
  } catch (error) {
    console.error("CREATE STATUS BATTERY ERROR:", error);

    return res.status(error.statusCode || 500).json({
      message: error.message || "Terjadi kesalahan pada server",
    });
  }
};

const getAllStatusBattery = async (req, res) => {
  try {
    const result = await statusBatteryService.getAllStatusBattery(req.query);

    return res.status(200).json({
      message: "Daftar status battery berhasil diambil",
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    console.error("GET ALL STATUS BATTERY ERROR:", error);

    return res.status(error.statusCode || 500).json({
      message: error.message || "Terjadi kesalahan pada server",
    });
  }
};

const updateStatusBattery = async (req, res) => {
  try {
    const statusBattery = await statusBatteryService.updateStatusBattery(
      req.params.id,
      req.body,
    );

    const activityLog = await logActivity({
      userId: req.user.userId,
      action: "UPDATE_STATUS_BATTERY",
      description: `Update status battery ${statusBattery.name}`,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    if (!activityLog) {
      console.warn(
        "Update status battery berhasil, tetapi activity log gagal disimpan",
      );
    }

    return res.status(200).json({
      message: "Status battery berhasil diperbarui",
      data: statusBattery,
    });
  } catch (error) {
    console.error("UPDATE STATUS BATTERY ERROR:", error);

    return res.status(error.statusCode || 500).json({
      message: error.message || "Terjadi kesalahan pada server",
    });
  }
};

const toggleStatusBattery = async (req, res) => {
  try {
    const statusBattery = await statusBatteryService.toggleStatusBattery(
      req.params.id,
    );

    const activityLog = await logActivity({
      userId: req.user.userId,
      action: "TOGGLE_STATUS_BATTERY",
      description: `Mengubah status battery ${statusBattery.name} menjadi ${
        statusBattery.isActive ? "aktif" : "nonaktif"
      }`,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    if (!activityLog) {
      console.warn(
        "Toggle status battery berhasil, tetapi activity log gagal disimpan",
      );
    }

    return res.status(200).json({
      message: "Status battery berhasil diubah",
      data: statusBattery,
    });
  } catch (error) {
    console.error("TOGGLE STATUS BATTERY ERROR:", error);

    return res.status(error.statusCode || 500).json({
      message: error.message || "Terjadi kesalahan pada server",
    });
  }
};

const deleteStatusBattery = async (req, res) => {
  try {
    const statusBattery = await statusBatteryService.deleteStatusBattery(
      req.params.id,
    );

    const activityLog = await logActivity({
      userId: req.user.userId,
      action: "DELETE_STATUS_BATTERY",
      description: `Menghapus status battery ${statusBattery.name}`,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    if (!activityLog) {
      console.warn(
        "Delete status battery berhasil, tetapi activity log gagal disimpan",
      );
    }

    return res.status(200).json({
      message: "Status battery berhasil dihapus",
      data: statusBattery,
    });
  } catch (error) {
    console.error("DELETE STATUS BATTERY ERROR:", error);

    return res.status(error.statusCode || 500).json({
      message: error.message || "Terjadi kesalahan pada server",
    });
  }
};
const getStatusBatteryById = async (req, res) => {
  try {
    const statusBattery = await statusBatteryService.getStatusBatteryById(
      req.params.id,
    );

    return res.status(200).json({
      message: "Detail status battery berhasil diambil",
      data: statusBattery,
    });
  } catch (error) {
    console.error("GET STATUS BATTERY BY ID ERROR:", error);

    return res.status(error.statusCode || 500).json({
      message: error.message || "Terjadi kesalahan pada server",
    });
  }
};

module.exports = {
  createStatusBattery,
  getAllStatusBattery,
  updateStatusBattery,
  toggleStatusBattery,
  deleteStatusBattery,
  getStatusBatteryById,
};

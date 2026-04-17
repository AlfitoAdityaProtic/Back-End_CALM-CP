const express = require("express");
const router = express.Router();
const userController = require("../../controllers/adminController/UserController");
const authMiddleware = require("../../middlewares/authMiddleware");
const authorizeRole = require("../../middlewares/authorizeRole");

router.use(authMiddleware, authorizeRole("admin"));

// Rute untuk membuat user baru
router.post("/users", userController.createUser);

// Rute untuk mendapatkan semua user dengan pagination dan filter
router.get("/users", userController.getAllUsers);

// Rute untuk mendapatkan detail user berdasarkan ID
router.get("/users/:id", userController.getUserById);

// Rute untuk memperbarui user berdasarkan ID
router.put("/users/:id", userController.updateUser);

// Rute untuk Menonaktifkan atau Mengaktifkan user
router.patch("/users/:id/toggle-active", userController.toggleUserActive);

// Rute untuk menghapus user berdasarkan ID
router.delete("/users/:id", userController.deleteUser);

module.exports = router;
const express = require("express");
const {
    registerUser,
    loginUser,
    resetPassword,
    getCurrentUserProfile,
    updateCurrentUserProfile,
    getUserOrders,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    refreshToken,
    openStore
} = require("../controllers/userController");

const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const router = express.Router();

// 📌 ✅ เส้นทางสำหรับผู้ใช้ทั่วไป
router.post("/register", registerUser); // สมัครสมาชิก
router.post("/login", loginUser); // ล็อกอิน
router.put("/reset-password", protect, resetPassword)
router.get("/profile", protect, getCurrentUserProfile); // ดูโปรไฟล์ตัวเอง
router.put("/profile", protect, upload.fields([{ name: "image", maxCount: 1 },{ name: "imageIdCard", maxCount: 1 }, { name: "promptPayQR", maxCount: 1 }]), updateCurrentUserProfile);
router.get("/orders", protect, getUserOrders); // ดูคำสั่งซื้อของตัวเอง
router.post("/open-store", protect, openStore); // เพิ่ม route ใหม่
// เพิ่มใน userRoutes.js
router.post("/refresh-token", refreshToken);

// 📌 🔒 เส้นทางสำหรับ Admin เท่านั้น
router.get("/all", protect, authorizeRoles("admin"), getAllUsers); // ดูผู้ใช้ทั้งหมด
router.get("/:id", protect, authorizeRoles("admin"), getUserById); // ดูข้อมูลผู้ใช้จาก ID
router.put("/:id", protect, authorizeRoles("admin"), updateUser); // อัปเดตข้อมูลผู้ใช้
router.delete("/:id", protect, authorizeRoles("admin"), deleteUser); // ลบผู้ใช้

module.exports = router;

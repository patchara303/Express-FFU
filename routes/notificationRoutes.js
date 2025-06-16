const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { 
    getNotifications, 
    markNotificationAsRead, 
    deleteNotification, 
    getUnreadNotifications 
} = require("../controllers/notificationController");

const router = express.Router();

// 📌 ดึงแจ้งเตือนทั้งหมด
router.get("/", protect, getNotifications);

// 📌 ดึงแจ้งเตือนที่ยังไม่ได้อ่าน
router.get("/unread", protect, getUnreadNotifications);

// 📌 อัปเดตแจ้งเตือนว่าอ่านแล้ว
router.put("/:notificationId/read", protect, markNotificationAsRead);

// 📌 ลบแจ้งเตือน
router.delete("/:notificationId", protect, deleteNotification);

module.exports = router;

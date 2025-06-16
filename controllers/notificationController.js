const Notification = require("../models/Notification");

// ✅ ดึงแจ้งเตือนทั้งหมดของผู้ใช้ (เรียงลำดับใหม่สุด)
const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.user.id })
            .sort({ createdAt: -1 });

        res.status(200).json({ message: "✅ ดึงแจ้งเตือนสำเร็จ", notifications });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const markNotificationAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;

        const notification = await Notification.findOneAndUpdate(
            { _id: notificationId, userId: req.user.id },
            { read: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ error: "❌ ไม่พบแจ้งเตือน" });
        }

        res.status(200).json({ message: "✅ แจ้งเตือนถูกอ่านแล้ว", notification });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const deleteNotification = async (req, res) => {
    try {
        const { notificationId } = req.params;

        const notification = await Notification.findOneAndDelete({ _id: notificationId, userId: req.user.id });

        if (!notification) {
            return res.status(404).json({ error: "❌ ไม่พบแจ้งเตือน" });
        }

        res.status(200).json({ message: "✅ ลบแจ้งเตือนสำเร็จ" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getUnreadNotifications = async (req, res) => {
    try {
        const unreadNotifications = await Notification.find({
            userId: req.user.id,
            read: false
        }).sort({ createdAt: -1 });

        res.status(200).json({ message: "✅ ดึงแจ้งเตือนที่ยังไม่ได้อ่านสำเร็จ", unreadNotifications });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const createNotification = async (userId, message, orderId = null) => {
    try {
        const notification = new Notification({
            userId,
            message,
            orderId
        });
        await notification.save();
    } catch (err) {
        console.error("❌ Error creating notification:", err.message);
    }
};

module.exports = {
    getNotifications,
    markNotificationAsRead,
    deleteNotification,
    createNotification,
    getUnreadNotifications
};
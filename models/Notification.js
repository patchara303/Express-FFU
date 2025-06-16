const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // ✅ ผู้รับการแจ้งเตือน
  message: { type: String, required: true }, // ✅ ข้อความแจ้งเตือน
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null }, // ✅ เชื่อมกับคำสั่งซื้อ (ถ้ามี)
  read: { type: Boolean, default: false }, // ✅ เช็กว่าอ่านแล้วหรือยัง
  createdAt: { type: Date, default: Date.now } // ✅ เวลาสร้าง
});

module.exports = mongoose.model("Notification", notificationSchema);

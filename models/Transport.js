const mongoose = require("mongoose");

const transportSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  courierService: { type: String, required: true },
  trackingNumber: { type: String, required: true, unique: true }, // ✅ กำหนดให้ไม่ซ้ำกัน
  transportStatus: { 
    type: String, 
    enum: ["pending", "in_transit", "delivered", "failed"], // ✅ ใช้ enum เพื่อลดข้อผิดพลาด
    default: "pending" 
  },
  timeSend: { type: Date, default: null }, // ✅ ค่าเริ่มต้นเป็น null
  estimatedDeliveryDate: { type: Date, default: null },
  receiveTime: { type: Date, default: null },
  sourceTransportation: { type: String },
  destinationTransportation: { type: String },
  carRegistration: { type: String },
}, { timestamps: true }); // ✅ เพิ่ม timestamps อัตโนมัติ

module.exports = mongoose.model("Transport", transportSchema);

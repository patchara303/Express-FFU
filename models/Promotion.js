const mongoose = require("mongoose");

const promotionSchema = new mongoose.Schema({
  promotionName: { type: String, required: true },
  description: { type: String },
  discountPercentage: { type: Number, required: true, min: 0, max: 100 }, // ✅ ส่วนลดเป็นเปอร์เซ็นต์
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true }, // ✅ ตรวจสอบว่าโปรโมชันยังเปิดใช้งานอยู่หรือไม่
}, { timestamps: true });

module.exports = mongoose.models.Promotion || mongoose.model("Promotion", promotionSchema);

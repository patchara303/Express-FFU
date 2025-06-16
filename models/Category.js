const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  categoryName: { type: String, required: true },
  description: { type: String },
});

// ✅ ตรวจสอบว่าโมเดล `Category` ถูกโหลดแล้วหรือไม่
module.exports = mongoose.models.Category || mongoose.model("Category", categorySchema);

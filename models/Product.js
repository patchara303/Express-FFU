const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const productSchema = new mongoose.Schema({
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  productCode: { type: String, unique: true, required: true, default: uuidv4 },
  productName: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  stockQuantity: { type: Number, required: true },
  unit: { type: String },
  grades: [{ type: String, default: ["A+", "B+", "C+", "D+"] }], // Added grades field
  units: [{ type: String, default: ["กิโลกรัม", "ตัน"] }], // Added units field
  imageUrls: [{ type: String }],
  promotionId: { type: mongoose.Schema.Types.ObjectId, ref: "Promotion", default: null },
  reviews: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    rating: { type: Number, min: 1, max: 5 },
    comment: { type: String },
    createdAt: { type: Date, default: Date.now }
  }],
  sold: { type: Number, default: 0, min: 0 },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Product", productSchema);
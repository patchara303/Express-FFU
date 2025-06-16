const mongoose = require("mongoose");

const salesDataSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  quantitySold: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  saleDate: { type: Date, default: Date.now },
});

module.exports = mongoose.model("SalesData", salesDataSchema);

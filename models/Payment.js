const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  promptPayNumber: { type: String },
  paymentDate: { type: Date, default: Date.now },
  amountPaid: { type: Number, required: true },
  paymentStatus: { type: String, required: true },
});

module.exports = mongoose.model("Payment", paymentSchema);

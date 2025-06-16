const mongoose = require("mongoose");

// ✅ OrderItem Schema รองรับหลายสินค้าต่อออเดอร์
const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true }, // ✅ ราคาปกติ
  discountedPrice: { type: Number }, // ✅ ราคาหลังหักส่วนลด
  promotionId: { type: mongoose.Schema.Types.ObjectId, ref: "Promotion", default: null },
  unit: { type: String }
});

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  orderDate: { type: Date, default: Date.now },
  items: [orderItemSchema], // ✅ รองรับหลายสินค้า
  totalPrice: { type: Number, required: true, default: 0 },
  orderStatus: { 
    type: String, 
    enum: ["cart", "pending", "waiting_confirm", "confirmed", "shipped", "delivered", "cancelled"],
    default: "cart"
  },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
  transportId: { type: mongoose.Schema.Types.ObjectId, ref: "Transport" },
  trackingNumber: { type: String, unique: true, sparse: true },
  shippingAddress: { 
    fullName: { type: String },
    phone: { type: String },
    addressLine1: { type: String },
    addressLine2: { type: String },
    city: { type: String },
    postalCode: { type: String },
    country: { type: String }
  }
});

module.exports = mongoose.models.Order || mongoose.model("Order", orderSchema);

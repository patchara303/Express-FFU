const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
    addToCart,
    getCart,
    removeFromCart,
    confirmOrder,
    confirmPayment,
    approvePayment,
    getAllOrders,
    getSellerOrders,
} = require("../controllers/orderController");
const uploadMiddleware = require("../middleware/uploadMiddleware");
const router = express.Router();

// 📌 เพิ่มสินค้าเข้าตะกร้า
router.post("/cart", protect, addToCart);
// 📌 ดูสินค้าทั้งหมดในตะกร้า
router.get("/cart", protect, getCart);
// 📌 ลบสินค้าจากตะกร้า
router.delete("/cart/:productId", protect, removeFromCart);
// 📌 ยืนยัผคำสั่งซื้อ (`cart` → `waiting_payment`) และสร้าง QR Code
router.post("/confirm", protect, confirmOrder);
// ✅ อัปโหลดหลักฐานชำระเงิน (ลูกค้า)
router.post("/confirm-payment", protect, uploadMiddleware.single("paymentProof"), confirmPayment);
// ✅ อนุมัติการชำระเงิน (ผู้ขาย)
router.post("/approve-payment", protect, approvePayment);
// 📌 ดูคำสั่งซื้อทั้งหมด (Admin เท่านั้น)
router.get("/all", protect, getAllOrders);
router.get("/all/:orderId?", protect, getAllOrders);
// 📌 ดูคำสั่งซื้อของผู้ขาย (Seller เท่านั้น)
router.get("/seller", protect, getSellerOrders);
router.get("/seller/:orderId?", protect, getSellerOrders);

module.exports = router;

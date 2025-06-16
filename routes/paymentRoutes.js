const express = require("express");
const { getSellerPromptPayQR, verifyPayment } = require("../controllers/paymentController");

const router = express.Router();

router.post("/generate-qr", getSellerPromptPayQR); // ✅ สร้าง QR Code ของแต่ละ Seller
router.post("/webhook", verifyPayment); // ✅ ตรวจสอบการชำระเงิน

module.exports = router;

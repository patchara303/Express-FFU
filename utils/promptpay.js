const QRCode = require("qrcode");

// 📌 ฟังก์ชันสร้าง `PromptPay QR Code` ตาม `Seller`
const generatePromptPayQR = async (phoneNumber, amount) => {
    try {
        if (!/^0[689]\d{8}$/.test(phoneNumber)) {
            throw new Error("❌ หมายเลข PromptPay ไม่ถูกต้อง");
        }

        const formattedPhone = `0066${phoneNumber.substring(1)}`;
        const payload = `00020101021129370016A000000677010111${formattedPhone}5303764${amount ? `54${amount.toFixed(2).padStart(6, "0")}` : ""}5802TH6304`;

        return await QRCode.toDataURL(payload);
    } catch (error) {
        throw new Error(`❌ สร้าง QR Code ล้มเหลว: ${error.message}`);
    }
};

module.exports = { generatePromptPayQR };

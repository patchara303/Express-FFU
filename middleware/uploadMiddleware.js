const fs = require("fs");
const multer = require("multer");
const path = require("path");

// 📌 ตั้งค่าการเก็บไฟล์
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = "uploads/";
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir); // ✅ สร้างโฟลเดอร์ถ้ายังไม่มี
        }
        cb(null, uploadDir); // ✅ เก็บไฟล์ในโฟลเดอร์ `uploads/`
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // ✅ ตั้งชื่อไฟล์แบบ Timestamp
    },
});

// 📌 ฟิลเตอร์เฉพาะไฟล์รูปภาพ
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
        cb(null, true);
    } else {
        cb(new Error("❌ อัปโหลดได้เฉพาะไฟล์รูปภาพเท่านั้น"), false);
    }
};

// 📌 ตั้งค่าอัปโหลดไฟล์
const upload = multer({ storage, fileFilter });

module.exports = upload;
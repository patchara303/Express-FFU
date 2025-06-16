const jwt = require("jsonwebtoken");
const User = require("../models/User");

// 📌 ตรวจสอบการเข้าสู่ระบบ (JWT Authentication)
const protect = async (req, res, next) => {
  try {
    let token;

    // ตรวจสอบว่ามี Token ใน Header หรือไม่
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1]; // ดึง Token ออกมา
    }

    if (!token) {
      return res.status(401).json({ error: "ไม่ได้รับอนุญาต กรุณาเข้าสู่ระบบ" });
    }

    // ตรวจสอบความถูกต้องของ Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password"); // นำข้อมูลผู้ใช้มาใส่ใน `req.user`

    if (!req.user) {
      return res.status(401).json({ error: "ไม่พบผู้ใช้" });
    }

    next(); // ให้ไปยัง Middleware ถัดไป
  } catch (err) {
    res.status(401).json({ error: "Token ไม่ถูกต้อง หรือหมดอายุ" });
  }
};

// 📌 กำหนดสิทธิ์เฉพาะบทบาท (Role-based Authorization)
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "คุณไม่มีสิทธิ์เข้าถึงทรัพยากรนี้" });
    }
    next();
  };
};

module.exports = { protect, authorizeRoles };
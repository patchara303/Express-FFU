const User = require("../models/User");
const Order = require("../models/Order");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const registerUser = async (req, res) => {
  try {
    const { username, password, firstName, lastName, age, idCard, email, tel, address } = req.body;

    // ตรวจสอบว่าผู้ใช้กรอกข้อมูลครบถ้วน
    if (!username || !password || !firstName || !lastName || !email || !tel) {
      return res.status(400).json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" });
    }

    // ตรวจสอบว่า username, email หรือ idCard ถูกใช้งานไปแล้ว
    const existingUser = await User.findOne({ $or: [{ username }, { email }, { idCard }] });
    if (existingUser) {
      return res.status(400).json({ error: "Username, Email หรือ ID Card ถูกใช้งานแล้ว" });
    }

    // เข้ารหัสรหัสผ่าน
    const hashedPassword = await bcrypt.hash(password, 10);

    // สร้างบัญชีผู้ใช้ใหม่
    const newUser = new User({
      password: hashedPassword,
      username,
      email,
      idCard,
      firstName,
      lastName,
      age,
      address: address
        ? [
            {
              AddressName: address.AddressName || "",
              phone: address.phone || "",
              province: address.province || "",
              district: address.district || "",
              subdistrict: address.subdistrict || "",
              postalCode: address.postalCode || "",
              street: address.street || "",
              mapLocation: address.mapLocation || "",
              isDefault: true, // ที่อยู่แรกเป็นที่อยู่หลัก
            },
          ]
        : [],
      tel,
      role: "customer",
    });

    await newUser.save();
    res.status(201).json({ message: "User registered successfully!" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const accessToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.TOKEN_EXPIRES_IN }
    );
    const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_SECRET, {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
    });

    res.status(200).json({ accessToken, refreshToken });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Verify user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "ไม่ได้รับอนุญาต" });
    }

    // Find the user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "ไม่พบผู้ใช้" });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "รหัสผ่านปัจจุบันไม่ถูกต้อง" });
    }

    // Validate new password
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: "รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    user.password = hashedPassword;
    await user.save();

    // Return updated user (excluding password)
    const updatedUser = await User.findById(req.user.id).select("-password");
    res.status(200).json({ user: updatedUser, message: "เปลี่ยนรหัสผ่านสำเร็จ" });
  } catch (err) {
    console.error("Error resetting password:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์", details: err.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json(users);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.status(200).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const user = await User.findByIdAndUpdate(id, updates, { new: true }).select("-password");
    res.status(200).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await User.findByIdAndDelete(id);
    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const getCurrentUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

const openStore = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "ไม่ได้รับอนุญาต" });
    }

    const { shopName, address, email, tel, mapLocation } = req.body;

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!shopName) {
      return res.status(400).json({ error: "กรุณาระบุชื่อร้านค้า" });
    }

    // ตรวจสอบว่า ShopName ซ้ำหรือไม่
    const existingShop = await User.findOne({ ShopNamee: shopName });
    if (existingShop) {
      return res.status(400).json({ error: "ชื่อร้านค้านี้ถูกใช้งานแล้ว" });
    }

    // ตรวจสอบว่าผู้ใช้เป็น seller อยู่แล้วหรือไม่
    const user = await User.findById(req.user.id);
    if (user.role === "seller") {
      return res.status(400).json({ error: "คุณมีร้านค้าอยู่แล้ว" });
    }

    // เตรียมข้อมูลที่อยู่ใหม่ (ถ้ามี)
    let updatedAddress = user.address || [];
    if (address) {
      const requiredFields = [
        "AddressName",
        "phone",
        "province",
        "district",
        "subdistrict",
        "postalCode",
        "street",
      ];
      const missingFields = requiredFields.filter(
        (field) => !address[field] || address[field].trim() === ""
      );
      if (missingFields.length > 0) {
        return res.status(400).json({
          error: `ที่อยู่ขาดฟิลด์ที่จำเป็น: ${missingFields.join(", ")}`,
        });
      }

      // เพิ่มที่อยู่ใหม่และตั้งเป็น default ถ้าไม่มี default address
      const newAddress = {
        ...address,
        mapLocation: mapLocation || "",
        isDefault: updatedAddress.length === 0 ? true : address.isDefault || false,
      };

      // ถ้ามี isDefault เป็น true ให้ยกเลิก default address อื่น ๆ
      if (newAddress.isDefault) {
        updatedAddress = updatedAddress.map((addr) => ({
          ...addr,
          isDefault: false,
        }));
      }

      updatedAddress.push(newAddress);
    }

    // อัปเดตข้อมูลผู้ใช้
    user.ShopName = shopName;
    user.role = "seller";
    user.email = email || user.email;
    user.tel = tel || user.tel;
    user.address = updatedAddress;
    user.updatedAt = Date.now();

    await user.save();

    // ส่งข้อมูลผู้ใช้ที่อัปเดตกลับ (ไม่รวม password)
    const updatedUser = await User.findById(req.user.id).select("-password");
    res.status(200).json({
      message: "เปิดร้านค้าสำเร็จ",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Error opening store:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์", details: err.message });
  }
};

const updateCurrentUserProfile = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "ไม่ได้รับอนุญาต" });
    }

    const updates = req.body;
    const allowedUpdates = ["firstName", "lastName", "age", "tel", "sex", "image","imageIdCard", "email", "ShopName"]; 

    if (req.user.role === "seller") {
      allowedUpdates.push("promptPayQR");
    }

    // จัดการไฟล์รูปภาพ
    if (req.files) {
      if (req.files.image) {
        updates.image = `/uploads/${req.files.image[0].filename}`;
      }
      if (req.files.promptPayQR && req.user.role === "seller") {
        updates.promptPayQR = `/uploads/${req.files.promptPayQR[0].filename}`;
      }
      if (req.files.imageIdCard) {
        updates.imageIdCard = `/uploads/${req.files.imageIdCard[0].filename}`;
      }
    }
    // ตรวจสอบความถูกต้องของฟิลด์ที่อัปเดต
    const isValidOperation = Object.keys(updates).every((key) => allowedUpdates.includes(key) || key === "address");
    if (!isValidOperation) {
      return res.status(400).json({ error: "ฟิลด์ที่อัปเดตไม่ถูกต้อง" });
    }

    // จัดการที่อยู่
    if (updates.address) {
      if (!Array.isArray(updates.address)) {
        return res.status(400).json({ error: "ที่อยู่ต้องเป็น array" });
      }

      const requiredFields = [
        "AddressName",
        "phone",
        "province",
        "district",
        "subdistrict",
        "postalCode",
        "street",
      ];

      for (const [index, addr] of updates.address.entries()) {
        const missingFields = requiredFields.filter(
          (field) => !addr[field] || addr[field].trim() === ""
        );
        if (missingFields.length > 0) {
          return res.status(400).json({
            error: `ที่อยู่ที่ index ${index} ขาดฟิลด์ที่จำเป็น: ${missingFields.join(", ")}`,
          });
        }
      }

      // ตรวจสอบ isDefault (ต้องมี default address เพียงแห่งเดียว)
      const defaultCount = updates.address.filter((addr) => addr.isDefault).length;
      if (defaultCount > 1) {
        return res.status(400).json({ error: "สามารถตั้งที่อยู่หลักได้เพียงแห่งเดียว" });
      }
      if (defaultCount === 0 && updates.address.length > 0) {
        updates.address[0].isDefault = true;
      }
    }

    // อัปเดตข้อมูลผู้ใช้
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ error: "ไม่พบผู้ใช้" });
    }

    res.status(200).json({ message: "อัปเดตโปรไฟล์สำเร็จ", user });
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์", details: err.message });
  }
};

const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ buyerName: req.user.id }).populate("products.productId");
    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ error: "Refresh token required" });
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    const accessToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.TOKEN_EXPIRES_IN }
    );

    res.status(200).json({ accessToken });
  } catch (err) {
    res.status(401).json({ error: "Invalid refresh token" });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getAllUsers,
  updateUser,
  deleteUser,
  getUserById,
  resetPassword,
  getCurrentUserProfile,
  updateCurrentUserProfile,
  getUserOrders,
  refreshToken,
  openStore
};
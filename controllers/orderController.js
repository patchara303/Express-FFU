const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { createNotification } = require("../controllers/notificationController");

// 📌 เพิ่มสินค้าเข้าตะกร้า
const addToCart = async (req, res) => {
    try {
        const { productId, quantity } = req.body;

        // ✅ โหลดข้อมูลสินค้า + โปรโมชัน
        const product = await Product.findById(productId).populate("promotionId");
        if (!product) return res.status(404).json({ error: "❌ ไม่พบสินค้า" });

        let cart = await Order.findOne({ userId: req.user.id, orderStatus: "cart" });
        if (!cart) cart = new Order({ userId: req.user.id, orderStatus: "cart", items: [] });

        // ✅ ค้นหาสินค้าในตะกร้า
        const existingItem = cart.items.find(item => item.productId.toString() === productId);
        const totalQuantityInCart = existingItem ? existingItem.quantity + quantity : quantity;

        // ✅ เช็กว่าสินค้าในตะกร้า + ใหม่ **ไม่เกิน `stockQuantity`**
        if (totalQuantityInCart > product.stockQuantity) {
            return res.status(400).json({ error: `❌ จำนวนสินค้าเกินสต็อก (เหลือ ${product.stockQuantity} ${product.unit || "หน่วย"})` });
        }

        // ✅ คำนวณส่วนลดจากโปรโมชัน (ถ้ามี)
        let discountedPrice = product.price;
        let validPromotion = null;
        const now = new Date();

        if (product.promotionId && now >= product.promotionId.startDate && now <= product.promotionId.endDate) {
            discountedPrice = product.price * (1 - product.promotionId.discountPercentage / 100);
            validPromotion = product.promotionId._id;
        }

        // ✅ เพิ่มสินค้าเข้า `cart.items`
        if (existingItem) {
            existingItem.quantity += quantity;
            existingItem.discountedPrice = discountedPrice;
            existingItem.promotionId = validPromotion;
        } else {
            cart.items.push({ productId, quantity, price: product.price, discountedPrice, promotionId: validPromotion, unit: product.unit });
        }

        // ✅ คำนวณ `totalPrice`
        cart.totalPrice = cart.items.reduce((sum, item) => sum + item.discountedPrice * item.quantity, 0);
        await cart.save();

        res.status(200).json({ message: "✅ เพิ่มสินค้าในตะกร้าเรียบร้อย", cart });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 📌 ดูสินค้าทั้งหมดในตะกร้า
const getCart = async (req, res) => {
    try {
        const cart = await Order.findOne({ userId: req.user.id, orderStatus: "cart" })
            .populate({
                path: "items.productId",
                select: "productName imageUrls price userId unit", // ✅ Include unit
            })
            .populate("items.promotionId");

        if (!cart) {
            return res.status(200).json({ message: "🛒 ตะกร้าว่างเปล่า", items: [] });
        }

        res.status(200).json(cart);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 📌 ลบสินค้าจากตะกร้า
const removeFromCart = async (req, res) => {
    try {
        const { productId } = req.params;

        let cart = await Order.findOne({ userId: req.user.id, orderStatus: "cart" });
        if (!cart) return res.status(400).json({ error: "❌ ไม่พบตะกร้าสินค้า" });

        // ✅ ค้นหาสินค้าที่ต้องการลบ
        const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
        if (itemIndex === -1) return res.status(404).json({ error: "❌ ไม่พบสินค้านี้ในตะกร้า" });

        // ✅ ลบสินค้าออกจาก `cart.items`
        cart.items.splice(itemIndex, 1);

        if (cart.items.length === 0) {
            // ✅ ถ้าไม่มีสินค้าแล้ว ให้ลบ `cart` ออกจากฐานข้อมูล
            await Order.findByIdAndDelete(cart._id);
            return res.status(200).json({ message: "🗑️ ลบสินค้าออกจากตะกร้าเรียบร้อย และลบตะกร้าสินค้า" });
        }

        // ✅ คำนวณ `totalPrice` ใหม่
        cart.totalPrice = cart.items.reduce((sum, item) => sum + item.discountedPrice * item.quantity, 0);
        
        // ✅ บันทึกการเปลี่ยนแปลง
        await cart.save();

        res.status(200).json({ message: "🗑️ ลบสินค้าออกจากตะกร้าเรียบร้อย", cart });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 📌 ยืนยันคำสั่งซื้อ (`cart` → `pending`)
const confirmOrder = async (req, res) => {
    try {
        const { shippingAddress } = req.body;
        let cart = await Order.findOne({ userId: req.user.id, orderStatus: "cart" })
            .populate({
                path: "items.productId",
                select: "productName imageUrls price userId unit stockQuantity", // ✅ Include unit
            });

        if (!cart || !cart.items || cart.items.length === 0) {
            return res.status(400).json({ error: "❌ ตะกร้าสินค้าว่างเปล่า หรือไม่พบคำสั่งซื้อ" });
        }

        // ✅ ตรวจสอบและอัปเดต stock ของสินค้า
        for (let item of cart.items) {
            let product = await Product.findById(item.productId);
            if (product) {
                if (item.quantity > product.stockQuantity) {
                    return res.status(400).json({ error: `❌ สินค้า ${product.productName} มีสต็อกไม่เพียงพอ (เหลือ ${product.stockQuantity} ${product.unit || "หน่วย"})` });
                }
                product.stockQuantity -= item.quantity;
                await product.save();
            }
        }

        // ✅ ดึงรายชื่อผู้ขายจากสินค้าที่มีในตะกร้า
        const sellerIds = [...new Set(
            cart.items.map(item => item.productId?.userId?.toString()).filter(Boolean)
        )];

        if (sellerIds.length === 0) {
            return res.status(400).json({ error: "❌ ไม่พบสินค้า หรือสินค้าบางรายการอาจถูกลบไปแล้ว" });
        }

        // ✅ เปลี่ยน `orderStatus` เป็น "pending"
        cart.orderStatus = "pending";
        cart.shippingAddress = shippingAddress;
        await cart.save();

        // ✅ แจ้งเตือนผู้ขายทุกคนที่เกี่ยวข้อง
        for (const sellerId of sellerIds) {
            await createNotification(sellerId, `📦 คำสั่งซื้อ #${cart._id} รอการชำระเงิน`);
        }

        // ✅ ใช้ QR Code จาก `promptPayQR` ของผู้ขาย
        let qrCodes = [];
        for (const sellerId of sellerIds) {
            const seller = await User.findById(sellerId);
            if (!seller || !seller.promptPayQR) continue;

            // ✅ คำนวณยอดเงินที่ต้องจ่ายให้ `Seller`
            const sellerTotal = cart.items
                .filter(item => item.productId?.userId?.toString() === sellerId)
                .reduce((sum, item) => sum + ((item.discountedPrice || item.price) * item.quantity), 0);

            if (sellerTotal > 0) {
                qrCodes.push({ 
                    sellerId: seller._id, 
                    sellerName: seller.username, 
                    qrCodeUrl: seller.promptPayQR,
                    amount: sellerTotal.toFixed(2)
                });
            }
        }

        res.status(200).json({
            message: "✅ กรุณาชำระเงินตาม QR Code",
            orderId: cart._id,
            qrCodes
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 📌 ยืนยันการชำระเงิน
const confirmPayment = async (req, res) => {
    try {
        const { orderId, transactionId } = req.body;
        const paymentProof = req.file ? `/uploads/payments/${req.file.filename}` : null;

        let order = await Order.findById(orderId).populate({
            path: "items.productId",
            select: "productName price userId unit", // ✅ Include unit
        });

        if (!order || order.orderStatus !== "pending") {
            return res.status(400).json({ error: "❌ ไม่พบคำสั่งซื้อ หรือคำสั่งซื้อนี้ไม่อยู่ในสถานะที่สามารถชำระเงินได้" });
        }

        // ✅ อัปเดตคำสั่งซื้อให้เป็น "waiting_confirm"
        order.orderStatus = "waiting_confirm";
        order.paymentProof = paymentProof;
        order.transactionId = transactionId;
        await order.save();

        // ✅ ส่งแจ้งเตือนให้ผู้ขายทุกคนที่เกี่ยวข้อง
        const sellerIds = [...new Set(order.items.map(item => item.productId?.userId?.toString()))];

        for (const sellerId of sellerIds) {
            await createNotification(sellerId, `💰 คำสั่งซื้อ #${order._id} ได้รับการชำระเงินแล้ว กรุณาตรวจสอบ`);
        }

        res.status(200).json({ 
            message: "✅ การชำระเงินได้รับการยืนยันแล้ว กำลังรอการตรวจสอบจากผู้ขาย", 
            order 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 📌 อนุมัติการชำระเงิน
const approvePayment = async (req, res) => {
    try {
        const { orderId } = req.body;
        let order = await Order.findById(orderId).populate({
            path: "items.productId",
            select: "productName price userId unit", // ✅ Include unit
        });

        if (!order || order.orderStatus !== "waiting_confirm") {
            return res.status(400).json({ error: "❌ คำสั่งซื้อนี้ไม่สามารถอนุมัติการชำระเงินได้" });
        }

        // ✅ ตรวจสอบว่าสินค้าเป็นของผู้ขายที่ล็อกอินอยู่
        const sellerItems = order.items.filter(item => item.productId.userId.toString() === req.user.id);
        if (sellerItems.length === 0) {
            return res.status(403).json({ error: "❌ คุณไม่มีสิทธิ์ยืนยันคำสั่งซื้อนี้" });
        }

        // ✅ อัปเดตสถานะคำสั่งซื้อ
        order.orderStatus = "confirmed";
        await order.save();

        // ✅ แจ้งเตือนลูกค้าเมื่อผู้ขายอนุมัติการชำระเงิน
        await createNotification(order.userId, `💰 ผู้ขายได้อนุมัติการชำระเงินสำหรับคำสั่งซื้อ #${order._id} แล้ว`);

        res.status(200).json({ 
            message: "✅ อนุมัติการชำระเงินสำเร็จ", 
            order 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 📌 ดูคำสั่งซื้อทั้งหมด (เฉพาะ Admin)
const getAllOrders = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ error: "❌ คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้" });
        }

        if (req.params.orderId) {
            const order = await Order.findById(req.params.orderId)
                .populate("userId", "username")
                .populate({
                    path: "items.productId",
                    select: "productName userId price unit", // ✅ Include unit
                });
            
            if (!order) return res.status(404).json({ error: "❌ ไม่พบคำสั่งซื้อ" });

            return res.status(200).json(order);
        }

        const orders = await Order.find()
            .populate("userId", "username")
            .populate({
                path: "items.productId",
                select: "productName userId price unit", // ✅ Include unit
            });

        res.status(200).json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 📌 ดูคำสั่งซื้อของผู้ขาย (เฉพาะ Seller)
const getSellerOrders = async (req, res) => {
    try {
        if (req.user.role !== "seller") {
            return res.status(403).json({ error: "❌ คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้" });
        }

        if (req.params.orderId) {
            const order = await Order.findById(req.params.orderId)
                .populate("userId", "username")
                .populate({
                    path: "items.productId",
                    select: "productName price userId unit", // ✅ Include unit
                    match: { userId: req.user.id }
                });

            if (!order || !order.items.some(item => item.productId !== null)) {
                return res.status(404).json({ error: "❌ ไม่พบคำสั่งซื้อของคุณ" });
            }

            return res.status(200).json(order);
        }

        const orders = await Order.find({ "items.productId": { $exists: true } })
            .populate("userId", "username")
            .populate({
                path: "items.productId",
                select: "productName price userId unit", // ✅ Include unit
                match: { userId: req.user.id }
            });

        const filteredOrders = orders.map(order => ({
            ...order.toObject(),
            items: order.items.filter(item => item.productId !== null)
        })).filter(order => order.items.length > 0);

        res.status(200).json(filteredOrders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    addToCart,
    getCart,
    removeFromCart,
    confirmOrder,
    confirmPayment,
    approvePayment,
    getAllOrders,
    getSellerOrders,
};
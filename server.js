const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const userRoutes = require("./routes/userRoutes");
const cors = require('cors'); // นำเข้า cors

dotenv.config();
const app = express();
app.use(express.json());
app.use("/uploads", express.static("uploads"));
app.use(cors({
     origin: 'http://localhost:5173', // อนุญาตให้ frontend จาก localhost:5173 เรียก API ได้
     methods: ['GET', 'POST', 'PUT', 'DELETE'], // อนุญาตวิธีการ HTTP
     allowedHeaders: ['Content-Type', 'Authorization'], // อนุญาต headers
}));

// เชื่อมต่อ MongoDB
mongoose
    .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("MongoDB Connected"))
    .catch((err) => console.log(err));

app.use("/api/users", userRoutes); // เชื่อมเส้นทาง API ของ User
const productRoutes = require("./routes/productRoutes");
app.use("/api/products", productRoutes);
const orderRoutes = require("./routes/orderRoutes");
app.use("/api/orders", orderRoutes)
const notificationRoutes = require("./routes/notificationRoutes");
app.use("/api/notifications", notificationRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

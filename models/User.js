const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  ShopName: { type: String, required: true, unique: true },
  role: { type: String, enum: ["customer", "seller", "admin"], default: "customer" },
  firstName: { type: String },
  lastName: { type: String },
  age: { type: Date },
  idCard: { type: String },
  address: [
    {
      AddressName: { type: String, required: true },
      phone: { type: String, required: true },
      province: { type: String, required: true },
      district: { type: String, required: true },
      subdistrict: { type: String, required: true },
      postalCode: { type: String, required: true },
      street: { type: String, required: true },
      mapLocation: { type: String },
      isDefault: { type: Boolean, default: false },
    },
  ],
  email: { type: String, unique: true },
  tel: { type: String },
  sex: { type: String },
  image: { type: String },
  imageIdCard: { type: String },
  promptPayQR: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);
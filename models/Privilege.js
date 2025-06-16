const mongoose = require("mongoose");

const privilegeSchema = new mongoose.Schema({
  nameTh: { type: String, required: true },
  nameEn: { type: String, required: true },
});

module.exports = mongoose.model("Privilege", privilegeSchema);

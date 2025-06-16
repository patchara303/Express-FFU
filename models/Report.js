const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  salesId: { type: mongoose.Schema.Types.ObjectId, ref: "SalesData", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  reportName: { type: String, required: true },
  description: { type: String },
  reportType: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Report", reportSchema);

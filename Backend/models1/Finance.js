// models/Finance.js
const mongoose = require("mongoose");

const financeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    month: { type: Number, required: true }, // 1–12
    year: { type: Number, required: true },
    income: { type: Number, required: true },
    expenses: { type: Number, required: true },
    portfolio: { type: Number, required: true },
    goal: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Finance", financeSchema);

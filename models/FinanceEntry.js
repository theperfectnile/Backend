const mongoose = require("mongoose");

const financeEntrySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  month: String,
  year: Number,
  income: Number,
  expenses: Number,
  portfolio: Number,
  goal: Number
});

module.exports = mongoose.model("FinanceEntry", financeEntrySchema);

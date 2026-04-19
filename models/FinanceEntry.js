const mongoose = require("mongoose");

const FinanceEntrySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    month: { type: String, required: true },
    year: { type: Number, required: true },

    monthlyIncome: { type: Number, required: true },
    monthlyExpenses: { type: Number, required: true },
    portfolioValue: { type: Number, required: true },
    savingsGoal: { type: Number, required: true },

    date: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("FinanceEntry", FinanceEntrySchema);

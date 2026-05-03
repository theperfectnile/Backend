const mongoose = require("mongoose");

const MoneyPersonalitySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  answers: { type: Array, required: true },
  personalityType: { type: String, required: true },
  score: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("MoneyPersonality", MoneyPersonalitySchema);
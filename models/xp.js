const mongoose = require("mongoose");

const XpSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  xp: { type: Number, default: 0 }
});

module.exports = mongoose.model("Xp", XpSchema);

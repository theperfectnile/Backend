const mongoose = require("mongoose");

const XPSchema = new mongoose.Schema({
  userId: String,
  xp: Number,
  log: Array
});

module.exports = mongoose.model("XP", XPSchema);

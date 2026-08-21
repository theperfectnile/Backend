const mongoose = require("mongoose");

const SurveySchema = new mongoose.Schema({
  userId: { type: String, required: true },
  answers: { type: Array, default: [] },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Survey", SurveySchema);

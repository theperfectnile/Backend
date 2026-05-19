const mongoose = require("mongoose");

const SurveySchema = new mongoose.Schema({
  userId: String,
  answers: Object,
  lifeScore: Number,
  personality: String,
  timestamp: Number
});

module.exports = mongoose.model("Survey", SurveySchema);
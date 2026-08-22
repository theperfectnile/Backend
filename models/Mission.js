const mongoose = require("mongoose");

const MissionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  missions: { type: Array, default: [] },
  completed: { type: Array, default: [] },
  weekStart: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Mission", MissionSchema);

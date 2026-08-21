const mongoose = require("mongoose");

const MissionSchema = new mongoose.Schema({
  userId: String,
  missions: [
    {
      text: String,
      completed: Boolean
    }
  ],
  timestamp: Number
});

module.exports = mongoose.model("Mission", MissionSchema);

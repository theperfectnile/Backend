const mongoose = require("mongoose");

const XpSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true
    },

    xp: {
      type: Number,
      default: 0,
      min: 0
    },

    log: [
      {
        amount: {
          type: Number,
          required: true
        },

        reason: {
          type: String,
          default: "XP awarded"
        },

        date: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Xp", XpSchema);

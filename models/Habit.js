const mongoose = require("mongoose");

const HabitSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true
    },

    progress: {
      finance: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
      },

      exercise: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
      },

      cleaning: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
      },

      cooking: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
      },

      lifestyle: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
      }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Habit", HabitSchema);

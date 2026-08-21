const express = require("express");
const router = express.Router();

const Habit = require("../models/Habit");
const auth = require("../middleware/authMiddleware");

// ========================================
// GET HABIT PROGRESS
// ========================================
router.get("/", auth, async (req, res) => {
  try {
    let habit = await Habit.findOne({
      userId: req.user.id
    });

    if (!habit) {
      habit = await Habit.create({
        userId: req.user.id
      });
    }

    res.json(habit);
  } catch (err) {
    console.error("GET HABITS ERROR:", err);

    res.status(500).json({
      message: "Server error"
    });
  }
});

// ========================================
// COMPLETE HABIT
// ========================================
router.post("/complete", auth, async (req, res) => {
  try {
    const { category } = req.body;

    const validCategories = [
      "finance",
      "exercise",
      "cleaning",
      "cooking",
      "lifestyle"
    ];

    if (!validCategories.includes(category)) {
      return res.status(400).json({
        message: "Invalid habit category"
      });
    }

    let habit = await Habit.findOne({
      userId: req.user.id
    });

    if (!habit) {
      habit = new Habit({
        userId: req.user.id
      });
    }

    const current =
      habit.progress[category] || 0;

    habit.progress[category] =
      Math.min(100, current + 25);

    await habit.save();

    res.json(habit);
  } catch (err) {
    console.error("COMPLETE HABIT ERROR:", err);

    res.status(500).json({
      message: "Server error"
    });
  }
});

module.exports = router;
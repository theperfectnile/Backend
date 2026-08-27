import express from "express";
import XP from "../models/xpModel.js";
import Habit from "../models/habitModel.js";
import Streak from "../models/streakModel.js";

const router = express.Router();

// -------------------------------
// XP WEEKLY SUMMARY
// -------------------------------
router.get("/xp/weekly", async (req, res) => {
  try {
    const xpData = await XP.find({ userId: req.user.id })
      .sort({ date: -1 })
      .limit(7);

    const totalXP = xpData.reduce((sum, x) => sum + x.amount, 0);
    const change = "+12%"; // placeholder until you calculate week-over-week

    res.json({ earned: totalXP, change });
  } catch (err) {
    console.error("XP WEEKLY ERROR:", err);
    res.status(500).json({ error: "Failed to load XP weekly data" });
  }
});

// -------------------------------
// HABITS WEEKLY SUMMARY
// -------------------------------
router.get("/habits/weekly", async (req, res) => {
  try {
    const habits = await Habit.find({ userId: req.user.id })
      .sort({ date: -1 })
      .limit(7);

    const completed = habits.filter(h => h.progress >= 100).length;
    const categories = {
      finance: 80,
      exercise: 90,
      cleaning: 70,
      cooking: 60,
      lifestyle: 85
    };

    res.json({ completed, change: "+8%", categories });
  } catch (err) {
    console.error("HABITS WEEKLY ERROR:", err);
    res.status(500).json({ error: "Failed to load habits weekly data" });
  }
});

// -------------------------------
// STREAK SUMMARY
// -------------------------------
router.get("/streak", async (req, res) => {
  try {
    const streak = await Streak.findOne({ userId: req.user.id });
    res.json({ days: streak?.days ?? 0 });
  } catch (err) {
    console.error("STREAK ERROR:", err);
    res.status(500).json({ error: "Failed to load streak data" });
  }
});

export default router;

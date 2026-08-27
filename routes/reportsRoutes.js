const express = require("express");
const router = express.Router();

// -------------------------------
// XP WEEKLY SUMMARY
// -------------------------------
router.get("/xp/weekly", async (req, res) => {
  try {
    // Replace with your XP model logic later
    res.json({ earned: 320, change: "+12%" });
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
    // Replace with your Habit model logic later
    res.json({
      completed: 14,
      change: "+8%",
      categories: {
        finance: 80,
        exercise: 90,
        cleaning: 70,
        cooking: 60,
        lifestyle: 85
      }
    });
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
    // Replace with your Streak model logic later
    res.json({ days: 7 });
  } catch (err) {
    console.error("STREAK ERROR:", err);
    res.status(500).json({ error: "Failed to load streak data" });
  }
});

module.exports = router;

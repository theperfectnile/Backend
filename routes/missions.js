const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const Mission = require("../models/Mission");

// ===============================
// GET USER MISSIONS (from DB)
// ===============================
router.get("/", auth, async (req, res) => {
  try {
    const data = await Mission.findOne({ userId: req.user.id });
    res.json(data || { missions: [], completed: [] });
  } catch (err) {
    console.error("MISSIONS GET ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ===============================
// GET DEFAULT MISSIONS (frontend uses this)
// ===============================
router.get("/get", (req, res) => {
  const missions = [
    "Track your expenses for 3 days",
    "Cook 2 meals at home",
    "Review your bank statements",
    "Avoid impulse purchases for 48 hours",
    "Do a 10‑minute walk 3 times",
    "Plan meals for 2 days",
    "Unsubscribe from 3 marketing emails",
    "Move $10 into savings",
    "Check your credit score",
    "Spend zero on takeout for one day"
  ];

  res.json({ missions });
});

// ===============================
// SAVE USER MISSIONS
// ===============================
router.post("/save", auth, async (req, res) => {
  try {
    const { missions, completed } = req.body;

    let record = await Mission.findOne({ userId: req.user.id });

    if (!record) {
      record = new Mission({
        userId: req.user.id,
        missions,
        completed
      });
    } else {
      record.missions = missions;
      record.completed = completed;
    }

    await record.save();
    res.json({ message: "Missions saved" });

  } catch (err) {
    console.error("MISSIONS SAVE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

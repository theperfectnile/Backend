const express = require("express");
const router = express.Router();
const Mission = require("../models/Mission");
const auth = require("../middleware/authMiddleware");

// GET missions
router.get("/", auth, async (req, res) => {
  const data = await Mission.findOne({ userId: req.user.id });
  res.json(data || null);
});

// NEW: GET default missions (fixes 404)
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

module.exports = router;
// SAVE missions
router.post("/", auth, async (req, res) => {
  const { missions, timestamp } = req.body;

  const saved = await Mission.findOneAndUpdate(
    { userId: req.user.id },
    { missions, timestamp },
    { upsert: true, new: true }
  );

  res.json(saved);
});

module.exports = router;

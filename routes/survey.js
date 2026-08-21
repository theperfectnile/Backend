const express = require("express");
const router = express.Router();
const Survey = require("../models/Survey");
const auth = require("../middleware/authMiddleware");

// SAVE survey
router.post("/", auth, async (req, res) => {
  const { answers, lifeScore, personality } = req.body;

  const saved = await Survey.create({
    userId: req.user.id,
    answers,
    lifeScore,
    personality,
    timestamp: Date.now()
  });

  res.json(saved);
});

// GET latest survey
router.get("/latest", auth, async (req, res) => {
  const data = await Survey.findOne({ userId: req.user.id }).sort({ timestamp: -1 });
  res.json(data || null);
});

module.exports = router;

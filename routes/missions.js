const express = require("express");
const router = express.Router();
const Mission = require("../models/Mission");
const auth = require("../middleware/auth");

// GET missions
router.get("/", auth, async (req, res) => {
  const data = await Mission.findOne({ userId: req.user.id });
  res.json(data || null);
});

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

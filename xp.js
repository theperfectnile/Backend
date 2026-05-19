const express = require("express");
const router = express.Router();
const XP = require("../models/XP");
const auth = require("../middleware/auth");

// GET XP
router.get("/", auth, async (req, res) => {
  const data = await XP.findOne({ userId: req.user.id });
  res.json(data || { xp: 0, log: [] });
});

// UPDATE XP
router.post("/", auth, async (req, res) => {
  const { xp, log } = req.body;

  const saved = await XP.findOneAndUpdate(
    { userId: req.user.id },
    { xp, log },
    { upsert: true, new: true }
  );

  res.json(saved);
});

module.exports = router;
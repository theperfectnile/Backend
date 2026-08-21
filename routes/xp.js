const express = require("express");
const router = express.Router();

const XP = require("../models/xp");
const auth = require("../middleware/authMiddleware");

// ========================================
// GET USER XP
// ========================================
router.get("/", auth, async (req, res) => {
  try {
    let data = await XP.findOne({
      userId: req.user.id
    });

    if (!data) {
      data = await XP.create({
        userId: req.user.id,
        xp: 0,
        log: []
      });
    }

    res.json(data);
  } catch (err) {
    console.error("GET XP ERROR:", err);
    res.status(500).json({
      message: "Server error"
    });
  }
});

// ========================================
// AWARD XP
// ========================================
router.post("/award", auth, async (req, res) => {
  try {
    const {
      amount,
      reason = "Habit completed"
    } = req.body;

    const xpAmount = Number(amount);

    // Validate XP
    if (!Number.isFinite(xpAmount) || xpAmount <= 0 || xpAmount > 1000) {
      return res.status(400).json({
        message: "Invalid XP amount"
      });
    }

    let record = await XP.findOne({
      userId: req.user.id
    });

    if (!record) {
      record = new XP({
        userId: req.user.id,
        xp: 0,
        log: []
      });
    }

    record.xp += xpAmount;

    record.log.push({
      amount: xpAmount,
      reason,
      date: new Date()
    });

    await record.save();

    res.json(record);
  } catch (err) {
    console.error("AWARD XP ERROR:", err);

    res.status(500).json({
      message: "Server error"
    });
  }
});

module.exports = router;

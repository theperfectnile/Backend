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

    // Create XP record if user doesn't have one
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
      reason = "XP earned"
    } = req.body;

    const xpAmount = Number(amount);

    // ========================================
    // VALIDATE XP AMOUNT
    // ========================================
    if (
      !Number.isFinite(xpAmount) ||
      xpAmount <= 0 ||
      xpAmount > 1000
    ) {
      return res.status(400).json({
        message: "Invalid XP amount"
      });
    }

    // ========================================
    // FIND USER XP RECORD
    // ========================================
    let record = await XP.findOne({
      userId: req.user.id
    });

    // ========================================
    // CREATE RECORD IF NEEDED
    // ========================================
    if (!record) {
      record = new XP({
        userId: req.user.id,
        xp: 0,
        log: []
      });
    }

    // ========================================
    // ADD XP
    // ========================================
    record.xp += xpAmount;

    // ========================================
    // ADD XP HISTORY
    // ========================================
    record.log.push({
      amount: xpAmount,
      reason: String(reason).slice(0, 200),
      date: new Date()
    });

    // ========================================
    // SAVE TO MONGODB
    // ========================================
    await record.save();

    // ========================================
    // RETURN UPDATED XP
    // ========================================
    res.json(record);

  } catch (err) {
    console.error("AWARD XP ERROR:", err);

    res.status(500).json({
      message: "Server error"
    });
  }
});


// ========================================
// EXPORT ROUTER
// ========================================
module.exports = router;

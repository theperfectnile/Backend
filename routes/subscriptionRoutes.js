const express = require("express");
const router = express.Router();
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

// ⭐ Stripe temporarily disabled until Step 8
// const Stripe = require("stripe");
// const stripe = Stripe(process.env.STRIPE_SECRET);

// Disabled checkout session route
router.post("/create-session", authMiddleware, async (req, res) => {
  return res.status(503).json({
    message: "Stripe subscription system is temporarily disabled until Step 8."
  });
});

module.exports = router;

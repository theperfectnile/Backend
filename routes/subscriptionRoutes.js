const express = require("express");
const router = express.Router();
const Stripe = require("stripe");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const stripe = Stripe(process.env.STRIPE_SECRET);

// Create checkout session
router.post("/create-session", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: user.email,
      line_items: [
        {
          price: req.body.priceId, // monthly or yearly
          quantity: 1
        }
      ],
      success_url: "https://theperfectnile.github.io/APP/success.html",
      cancel_url: "https://theperfectnile.github.io/APP/subscribe.html"
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("SESSION ERROR:", err);
    res.status(500).json({ message: "Stripe error" });
  }
});

module.exports = router;
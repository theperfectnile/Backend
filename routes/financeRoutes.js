// routes/financeRoutes.js
const express = require("express");
const router = express.Router();
const Finance = require("../models/Finance");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

// simple auth middleware (reuse your existing one if you have it)
function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.replace("Bearer ", "");
  if (!token) return res.status(401).json({ message: "No token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

// add a finance entry
router.post("/add", auth, async (req, res) => {
  try {
    const { month, year, income, expenses, portfolio, goal } = req.body;

    const entry = await Finance.create({
      user: req.userId,
      month,
      year,
      income,
      expenses,
      portfolio,
      goal,
    });

    res.json(entry);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error saving entry" });
  }
});

// get all entries for user
router.get("/all", auth, async (req, res) => {
  try {
    const entries = await Finance.find({ user: req.userId }).sort({
      year: 1,
      month: 1,
    });
    res.json(entries);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching entries" });
  }
});

// analyze entries
router.post("/analyze", auth, async (req, res) => {
  try {
    const entries = await Finance.find({ user: req.userId }).sort({
      year: 1,
      month: 1,
    });

    if (!entries.length) {
      return res.json({
        insights: "No data yet. Add your first month to see insights.",
        latest: null,
        trend: null,
      });
    }

    const latest = entries[entries.length - 1];
    const prev = entries.length > 1 ? entries[entries.length - 2] : null;

    const netSavings = latest.income - latest.expenses;
    let spendingChange = null;

    if (prev) {
      const diff = latest.expenses - prev.expenses;
      const pct = prev.expenses ? (diff / prev.expenses) * 100 : 0;
      spendingChange = Math.round(pct);
    }

    const subscriptionPercent = (latest.expenses * 0.06).toFixed(2);
    const monthsToGoal =
      netSavings > 0 ? Math.ceil(latest.goal / netSavings) : null;

    let insights = `Your net savings this month is $${netSavings}. `;
    if (spendingChange !== null) {
      insights += `Your spending changed ${spendingChange}% compared to last month. `;
    }
    insights += `Subscriptions are estimated at ${subscriptionPercent}% of your expenses. `;
    if (monthsToGoal !== null) {
      insights += `You could reach your savings goal in about ${monthsToGoal} months.`;
    }

    res.json({
      latest,
      entries,
      netSavings,
      spendingChange,
      subscriptionPercent,
      monthsToGoal,
      insights,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error analyzing data" });
  }
});

// start 7‑day trial
router.post("/start-trial", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.trialStart = new Date();
    user.trialActive = true;
    await user.save();

    res.json({ message: "Trial started", trialStart: user.trialStart });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error starting trial" });
  }
});

// trial status
router.get("/trial-status", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    let trialActive = false;
    let daysLeft = 0;

    if (user.trialStart) {
      const now = new Date();
      const diffMs = now - user.trialStart;
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      if (diffDays < 7) {
        trialActive = true;
        daysLeft = Math.ceil(7 - diffDays);
      } else {
        trialActive = false;
        user.trialActive = false;
        await user.save();
      }
    }

    res.json({ trialActive, daysLeft });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error checking trial" });
  }
});

module.exports = router;

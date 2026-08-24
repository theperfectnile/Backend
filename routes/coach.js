const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const User = require("../models/User");
const Habit = require("../models/Habit");
const XP = require("../models/xp");

// ======================================================
// GLOBAL STATE (PERSISTS WHILE SERVER IS RUNNING)
// ======================================================
const conversationState = {};  

// ======================================================
// STATEFUL COACH LOGIC (FREE)
// ======================================================
function generateCoachReply(userId, message, level, currentXP, habitProgress) {
  const lower = message.toLowerCase().trim();

  if (!conversationState[userId]) {
    conversationState[userId] = { step: "intro", topic: null };
  }

  const state = conversationState[userId];

  if (state.step === "intro") {
    state.step = "focus";
    return `You’re level ${level} with ${currentXP} XP. What would you like to focus on right now — exercise, finance, or motivation?`;
  }

  if (state.step === "focus") {
    if (lower.includes("exercise")) {
      state.topic = "exercise";
      state.step = "advice";
      return `Great choice! At level ${level}, start small: walk or stretch for 10 minutes today. Log it to earn XP (${currentXP}). As your habit grows (${habitProgress.exercise}%), we’ll add intensity.`;
    }
    if (lower.includes("finance")) {
      state.topic = "finance";
      state.step = "advice";
      return `Smart move. Begin by tracking every expense for three days. Awareness first — then we’ll set a savings goal.`;
    }
    if (lower.includes("motivation")) {
      state.topic = "motivation";
      state.step = "advice";
      return `Let’s boost motivation. Pick one small task and finish it now — that win will raise your XP (${currentXP}) and confidence.`;
    }

    return `I didn’t catch your focus area. Try saying “exercise,” “finance,” or “motivation.”`;
  }

  if (state.step === "advice") {
    switch (state.topic) {
      case "exercise":
        return `You’re building consistency — great work. Try scheduling workouts at the same time each day. Consistency beats intensity early on.`;
      case "finance":
        return `You’re staying focused on finances. Review your spending categories and find one small cut — even $5 saved daily compounds fast.`;
      case "motivation":
        return `Still working on motivation? Reflect on why your goals matter. Write one sentence about what success looks like for you.`;
      default:
        return `Keep going — your progress matters more than perfection.`;
    }
  }

  return `You’re level ${level} with ${currentXP} XP. What would you like to focus on — exercise, finance, or motivation?`;
}

// ======================================================
// AI CHAT COACH ROUTE
// ======================================================
router.post("/chat", auth, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ message: "A message is required." });
    }

    const user = await User.findById(req.user.id).select("email");
    if (!user) return res.status(404).json({ message: "User not found." });

    const habit = await Habit.findOne({ userId: req.user.id });
    const xp = await XP.findOne({ userId: req.user.id });

    const habitProgress = habit?.progress || {
      finance: 0,
      exercise: 0,
      cleaning: 0,
      cooking: 0,
      lifestyle: 0
    };

    const currentXP = xp?.xp || 0;
    const level = Math.floor(currentXP / 100) + 1;

    const reply = generateCoachReply(
      req.user.id,
      message,
      level,
      currentXP,
      habitProgress
    );

    return res.json({ reply });

  } catch (err) {
    console.error("AI COACH ERROR:", err);
    return res.status(500).json({ message: "AI Coach is temporarily unavailable." });
  }
});

module.exports = router;

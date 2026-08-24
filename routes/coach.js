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
// DYNAMIC ADVICE TEMPLATES
// ======================================================
const adviceTemplates = {
  exercise: [
    (level) => `At level ${level}, consistency beats intensity. Try a short walk today.`,
    (xp) => `Earn XP (${xp}) by doing 10 minutes of movement.`,
    (progress) => `Your exercise progress is ${progress}%. Let’s bump it a little today.`,
    () => `What kind of exercise feels doable right now.`
  ],
  finance: [
    () => `Track every expense for three days — awareness is your first win.`,
    () => `Cut one small cost today. Even $5 saved daily compounds fast.`,
    (xp) => `Your XP (${xp}) shows discipline. Let’s set a tiny savings goal.`,
    () => `What’s one financial habit you want to improve.`
  ],
  cooking: [
    (xp) => `Earn XP (${xp}) by cooking one meal at home today.`,
    () => `Try a simple recipe — pasta, stir‑fry, or tacos.`,
    (progress) => `Your cooking progress is ${progress}%. Let’s raise it with one homemade meal.`,
    () => `What ingredients do you already have at home.`
  ],
  cleaning: [
    () => `Start with a 10‑minute tidy. Small wins build momentum.`,
    () => `Pick one area — desk, kitchen, or closet — and reset it.`,
    (progress) => `Your cleaning progress is ${progress}%. Let’s nudge it upward.`,
    () => `What space would make you feel calmer if it were clean.`
  ],
  lifestyle: [
    () => `Focus on balance — hydration, sleep, and movement.`,
    (xp) => `Your XP (${xp}) shows growth. Let’s add one healthy habit today.`,
    () => `Try a 5‑minute mindfulness break.`,
    () => `What’s one lifestyle tweak that would make your day smoother.`
  ]
};

// ======================================================
// RANDOM ADVICE PICKER
// ======================================================
function getDynamicAdvice(topic, level, currentXP, habitProgress) {
  const options = adviceTemplates[topic];
  const pick = options[Math.floor(Math.random() * options.length)];
  return pick(level || currentXP || habitProgress[topic] || null);
}

// ======================================================
// CONVERSATIONAL FOLLOW‑UPS
// ======================================================
function getFollowUp() {
  const followUps = [
    "How does that sound.",
    "Would that fit into your day.",
    "Want to try that now.",
    "What’s your next step."
  ];
  return followUps[Math.floor(Math.random() * followUps.length)];
}

// ======================================================
// STATEFUL COACH LOGIC (FREE + PERSISTENT TOPIC)
// ======================================================
async function generateCoachReply(userId, message, level, currentXP, habitProgress) {
  const lower = message.toLowerCase().trim();

  // Initialize state if missing
  if (!conversationState[userId]) {
    conversationState[userId] = { step: "intro", topic: null };
  }

  const state = conversationState[userId];

  // Load last topic from MongoDB if available
  if (!state.topic) {
    const user = await User.findById(userId).select("lastTopic");
    if (user?.lastTopic) {
      state.topic = user.lastTopic;
      state.step = "advice";
    }
  }

  // Step 1: Intro
  if (state.step === "intro") {
    state.step = "focus";
    return `You’re level ${level} with ${currentXP} XP. What would you like to focus on — exercise, finance, cooking, cleaning, or lifestyle.`;
  }

 // Step 2: Topic selection
if (state.step === "focus") {
  const topics = ["exercise", "finance", "cooking", "cleaning", "lifestyle"];
  const matchedTopic = topics.find(t => lower.includes(t));

  if (matchedTopic) {
    state.topic = matchedTopic;
    state.step = "advice";

    // Save topic to MongoDB
    await User.findByIdAndUpdate(userId, { lastTopic: matchedTopic });

    const advice = getDynamicAdvice(matchedTopic, level, currentXP, habitProgress);
    return `${advice} ${getFollowUp()}`;
  }

  // ✅ Updated fallback message
  return `I didn’t catch your focus area. Try saying one of: ${topics.join(", ")}.`;
}

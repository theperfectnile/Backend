import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcryptjs";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI;

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

/* ============================
   USER MODEL
============================ */
const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // hashed
    plan: { type: String, default: "Free Trial" },
    trialStart: {
      type: String,
      default: () => new Date().toISOString().slice(0, 10),
    },
    budgets: [
      {
        category: String,
        amount: Number,
      },
    ],
    portfolio: [
      {
        name: String,
        value: Number,
        sector: String,
        region: String,
      },
    ],
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

// Helper
const findUser = (email) => User.findOne({ email });

/* ============================
   ROUTES
============================ */

// Health check
app.get("/", (req, res) => {
  res.json({ ok: true, message: "Vaultwise API running" });
});

/* ============================
   REGISTER
============================ */
app.post("/api/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: "Email and password required" });

    const exists = await findUser(email);
    if (exists) return res.status(409).json({ error: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hashed,
      plan: "Free Trial",
      trialStart: new Date().toISOString().slice(0, 10),
      budgets: [],
      portfolio: [],
    });

    res.status(201).json({
      email: user.email,
      plan: user.plan,
      trialStart: user.trialStart,
      budgets: user.budgets,
      portfolio: user.portfolio,
    });
  } catch (err) {
    console.error("REGISTER error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================
   LOGIN
============================ */
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await findUser(email);
    if (!user) return res.status(404).json({ error: "User not found" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    res.json({
      email: user.email,
      plan: user.plan,
      trialStart: user.trialStart,
      budgets: user.budgets,
      portfolio: user.portfolio,
    });
  } catch (err) {
    console.error("LOGIN error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================
   GET USER
============================ */
app.get("/api/user/:email", async (req, res) => {
  try {
    const user = await findUser(req.params.email);
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      email: user.email,
      plan: user.plan,
      trialStart: user.trialStart,
      budgets: user.budgets,
      portfolio: user.portfolio,
    });
  } catch (err) {
    console.error("GET USER error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================
   SAVE BUDGET
============================ */
app.post("/api/budget", async (req, res) => {
  try {
    const { email, budgets } = req.body;

    const user = await findUser(email);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.budgets = budgets;
    await user.save();

    res.json({ success: true, budgets: user.budgets });
  } catch (err) {
    console.error("BUDGET error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================
   SAVE PORTFOLIO
============================ */
app.post("/api/portfolio", async (req, res) => {
  try {
    const { email, portfolio } = req.body;

    const user = await findUser(email);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.portfolio = portfolio;
    await user.save();

    res.json({ success: true, portfolio: user.portfolio });
  } catch (err) {
    console.error("PORTFOLIO error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================
   START SERVER
============================ */
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Vaultwise API running on port ${PORT}`));

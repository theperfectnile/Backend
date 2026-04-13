require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");

const app = express();

// --- middleware ---
app.use(cors());
app.use(express.json());

// --- mongo connection ---
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/vaultwise";

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });

// --- user model ---
const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // hashed
    plan: { type: String, default: "Free Trial" },
    trialStart: { type: String, default: () => new Date().toISOString().slice(0, 10) },
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

// --- helpers ---
async function findUserByEmail(email) {
  return User.findOne({ email });
}

// --- routes ---

// health check
app.get("/", (req, res) => {
  res.json({ ok: true, message: "Vaultwise API is running" });
});

// REGISTER
// body: { email, password }
app.post("/api/register", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: "User already exists" });
    }

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

// LOGIN
// body: { email, password }
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // front‑end just needs user data; no token required for your current flow
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

// GET USER BY EMAIL
// GET /api/user/:email
app.get("/api/user/:email", async (req, res) => {
  try {
    const user = await findUserByEmail(req.params.email);
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

// SAVE BUDGET
// body: { email, budgets: [{ category, amount }] }
app.post("/api/budget", async (req, res) => {
  try {
    const { email, budgets } = req.body || {};
    if (!email || !Array.isArray(budgets)) {
      return res.status(400).json({ error: "Email and budgets array required" });
    }

    const user = await findUserByEmail(email);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.budgets = budgets;
    await user.save();

    res.json({ success: true, budgets: user.budgets });
  } catch (err) {
    console.error("BUDGET error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// SAVE PORTFOLIO
// body: { email, portfolio: [{ name, value, sector, region }] }
app.post("/api/portfolio", async (req, res) => {
  try {
    const { email, portfolio } = req.body || {};
    if (!email || !Array.isArray(portfolio)) {
      return res.status(400).json({ error: "Email and portfolio array required" });
    }

    const user = await findUserByEmail(email);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.portfolio = portfolio;
    await user.save();

    res.json({ success: true, portfolio: user.portfolio });
  } catch (err) {
    console.error("PORTFOLIO error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// --- start server ---
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Vaultwise API listening on port ${PORT}`);
});

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { z } from "zod";
import crypto from "crypto";
import nodemailer from "nodemailer";

dotenv.config();

const app = express();

/* ------------------ SECURITY HEADERS ------------------ */

app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

// Force HTTPS in production (Render)
app.use((req, res, next) => {
  if (
    process.env.NODE_ENV === "production" &&
    req.headers["x-forwarded-proto"] !== "https"
  ) {
    return res.redirect("https://" + req.headers.host + req.url);
  }
  next();
});

/* ------------------ CORS ------------------ */

app.use(
  cors({
    origin: "https://theperfectnile.github.io",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());

/* ------------------ API KEY MIDDLEWARE ------------------ */

const JWT_SECRET = process.env.JWT_SECRET;

function requireApiKey(req, res, next) {
  const key = req.headers["x-api-key"];
  if (!key || key !== process.env.API_KEY) {
    return res.status(403).json({ error: "Forbidden: Invalid API Key" });
  }
  next();
}

/* ------------------ MONGODB CONNECTION ------------------ */

mongoose
  .connect(process.env.MONGO_URI, { dbName: "vaultwise" })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err));

/* ------------------ USER MODEL ------------------ */

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  plan: { type: String, default: "free" },
  trialStart: { type: Date, default: null },
  resetToken: { type: String, default: null },
  resetTokenExpiry: { type: Date, default: null },
});

const User = mongoose.model("User", userSchema);

/* ------------------ HELPERS ------------------ */

function issueToken(user) {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      plan: user.plan,
      trialStart: user.trialStart,
    },
    JWT_SECRET,
    { expiresIn: "2h" }
  );
}

function applyTrialExpiry(user) {
  if (user.plan === "trial" && user.trialStart) {
    const now = new Date();
    const diffDays =
      (now - new Date(user.trialStart)) / (1000 * 60 * 60 * 24);

    if (diffDays > 7) {
      user.plan = "free";
      user.trialStart = null;
    }
  }
}

/* ------------------ RATE LIMITING ------------------ */

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: "Too many login attempts. Try again in 1 minute." },
});

/* ------------------ VALIDATION SCHEMAS ------------------ */

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const budgetSchema = z.object({
  income: z.number().positive(),
  expenses: z.array(
    z.object({
      category: z.string(),
      amount: z.number().nonnegative(),
    })
  ),
});

const portfolioSchema = z.object({
  portfolio: z.array(
    z.object({
      name: z.string(),
      value: z.number().positive(),
      sector: z.string(),
      region: z.string(),
    })
  ),
});

/* ------------------ AUTH MIDDLEWARE ------------------ */

async function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "No token" });

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) return res.status(401).json({ error: "User not found" });

    applyTrialExpiry(user);
    await user.save();

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

/* ------------------ EMAIL TRANSPORT ------------------ */

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/* ------------------ REQUEST PASSWORD RESET ------------------ */

app.post("/api/request-password-reset", requireApiKey, async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ error: "Email required" });

  const user = await User.findOne({ email });
  if (!user)
    return res.json({ message: "If that email exists, a reset link was sent." });

  const token = crypto.randomBytes(32).toString("hex");

  user.resetToken = token;
  user.resetTokenExpiry = Date.now() + 1000 * 60 * 15;
  await user.save();

  const resetLink = `https://theperfectnile.github.io/vaultwise/reset-password?token=${token}`;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Vaultwise Password Reset",
    html: `
      <h2>Password Reset Request</h2>
      <p>Click the link below to reset your password:</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>This link expires in 15 minutes.</p>
    `,
  });

  res.json({ message: "If that email exists, a reset link was sent." });
});

/* ------------------ RESET PASSWORD ------------------ */

app.post("/api/reset-password", requireApiKey, async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword)
    return res.status(400).json({ error: "Missing fields" });

  const user = await User.findOne({
    resetToken: token,
    resetTokenExpiry: { $gt: Date.now() },
  });

  if (!user)
    return res.status(400).json({ error: "Invalid or expired token" });

  const hashed = await bcrypt.hash(newPassword, 10);
  user.password = hashed;

  user.resetToken = null;
  user.resetTokenExpiry = null;

  await user.save();

  res.json({ message: "Password reset successful" });
});

/* ------------------ EMAIL RECOVERY ------------------ */

app.post("/api/recover-email", requireApiKey, async (req, res) => {
  const { partial } = req.body;

  if (!partial)
    return res.status(400).json({ error: "Partial email required" });

  const users = await User.find({
    email: { $regex: partial, $options: "i" },
  });

  if (users.length === 0)
    return res.json({ message: "No matching accounts found" });

  const masked = users.map((u) => {
    const [name, domain] = u.email.split("@");
    return (
      name[0] +
      "***" +
      name[name.length - 1] +
      "@" +
      domain[0] +
      "***"
    );
  });

  res.json({ matches: masked });
});

/* ------------------ REGISTER ------------------ */

app.post("/api/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: "Invalid input" });

  const { email, password } = parsed.data;

  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ error: "Email already exists" });

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    email,
    password: hashedPassword,
    plan: "free",
    trialStart: null,
  });

  const token = issueToken(user);
  res.json({ token });
});

/* ------------------ LOGIN ------------------ */

app.post("/api/login", loginLimiter, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: "Invalid input" });

  const { email, password } = parsed.data;

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

  applyTrialExpiry(user);
  await user.save();

  const token = issueToken(user);
  res.json({ token });
});

/* ------------------ PROFILE ------------------ */

app.get("/api/profile", auth, (req, res) => {
  const user = req.user;
  res.json({
    email: user.email,
    plan: user.plan,
    trialStart: user.trialStart,
  });
});

/* ------------------ START TRIAL ------------------ */

app.post("/api/start-trial", auth, async (req, res) => {
  const user = req.user;

  if (user.plan === "pro")
    return res.status(400).json({ error: "Already Pro" });

  if (user.plan === "trial")
    return res.status(400).json({ error: "Trial already active" });

  user.plan = "trial";
  user.trialStart = new Date();
  await user.save();

  const token = issueToken(user);

  res.json({
    message: "Trial started",
    plan: user.plan,
    trialStart: user.trialStart,
    token,
  });
});

/* ------------------ UPGRADE ------------------ */

app.post("/api/upgrade", auth, async (req, res) => {
  const user = req.user;

  user.plan = "pro";
  user.trialStart = null;
  await user.save();

  const token = issueToken(user);

  res.json({ message: "Upgraded to Pro", plan: user.plan, token });
});

/* ------------------ BUDGET ------------------ */

app.post("/api/budget", auth, (req, res) => {
  const parsed = budgetSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: "Invalid input" });

  const { income, expenses } = parsed.data;

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const savings = income - totalExpenses;
  const savingsRate = ((savings / income) * 100).toFixed(2);

  const categoryMap = {};
  expenses.forEach((e) => {
    categoryMap[e.category] =
      (categoryMap[e.category] || 0) + e.amount;
  });

  const categories = Object.entries(categoryMap).map(([cat, val]) => ({
    category: cat,
    percent: ((val / income) * 100).toFixed(2),
  }));

  const insights = [];
  if (savings < 0) insights.push("You are overspending.");
  if (savingsRate < 10) insights.push("Savings rate is low.");
  if (savingsRate >= 20) insights.push("Strong savings rate.");

  res.json({
    income,
    totalExpenses,
    savings,
    savingsRate,
    categories,
    insights,
  });
});

/* ------------------ PORTFOLIO ------------------ */

app.post("/api/analyze", auth, (req, res) => {
  const parsed = portfolioSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: "Invalid input" });

  const { portfolio } = parsed.data;

  const totalValue = portfolio.reduce((sum, a) => sum + a.value, 0);

  const sectorMap = {};
  const regionMap = {};

  portfolio.forEach((a) => {
    sectorMap[a.sector] = (sectorMap[a.sector] || 0) + a.value;
    regionMap[a.region] = (regionMap[a.region] || 0) + a.value;
  });

  const sectors = Object.entries(sectorMap).map(([s, v]) => ({
    sector: s,
    percent: ((v / totalValue) * 100).toFixed(2),
  }));

  const regions = Object.entries(regionMap).map(([r, v]) => ({
    region: r,
    percent: ((v / totalValue) * 100).toFixed(2),
  }));

  const insights = [];
  const largest = Math.max(...portfolio.map((a) => a.value));
  if ((largest / totalValue) * 100 > 25)
    insights.push("High concentration risk.");

  res.json({
    totalValue,
    sectors,
    regions,
    insights,
  });
});

/* ------------------ ROOT ------------------ */

app.get("/", (req, res) => {
  res.send("Vaultwise backend running with MongoDB + Security Headers");
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`Server running on port ${PORT}`)
);
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ===============================
// REGISTER
// ===============================
exports.register = async (req, res) => {
  try {
    const { email, password } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "Email already exists" });

    const hashed = await bcrypt.hash(password, 10);

   const newUser = await User.create({ email, password: hashed });

const token = jwt.sign(
  { id: newUser._id },
  process.env.JWT_SECRET,
  { expiresIn: "7d" }
);

res.json({
  message: "Registered successfully",
  token
});
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ===============================
// LOGIN
// ===============================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
  { id: user._id },
  process.env.JWT_SECRET,
  { expiresIn: "7d" }
);

    res.json({ token });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ===============================
// FORGOT PASSWORD
// ===============================
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Email not found" });
    }

    res.json({ message: "Password reset link sent (simulation)" });

  } catch (err) {
    console.error("FORGOT PASSWORD ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ===============================
// GET LOGGED-IN USER
// ===============================
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    console.error("GET USER ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ===============================
// EXPORTS
// ===============================
module.exports = {
  register: exports.register,
  login: exports.login,
  forgotPassword: exports.forgotPassword,
  getUser: exports.getUser
};

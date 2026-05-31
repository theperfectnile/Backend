const express = require("express");
const router = express.Router();

const { register, login, forgotPassword, getUser } = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

// Auth routes
router.post("/register", register);
router.post("/login", login);

// Forgot password route
router.post("/forgot-password", forgotPassword);

// Get logged-in user
router.get("/user", authMiddleware, getUser);

module.exports = router;


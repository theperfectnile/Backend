const express = require("express");
const router = express.Router();

const { register, login, forgotPassword } = require("../controllers/authController");

// Auth routes
router.post("/register", register);
router.post("/login", login);

// Forgot password route
router.post("/forgot-password", forgotPassword);

module.exports = router;


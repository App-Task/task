const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { register, login } = require("../controllers/authController");

// Register endpoint
router.post("/register", register);

// Login endpoint
router.post("/login", login);

// Authenticated user info
router.get("/me", async (req, res) => {
  const rawToken = req.header("Authorization");
  if (!rawToken) return res.status(401).json({ msg: "No token provided" });

  // Support both "Bearer <token>" and "<token>"
  const token = rawToken.startsWith("Bearer ") ? rawToken.slice(7) : rawToken;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("name email");
    if (!user) return res.status(404).json({ msg: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(401).json({ msg: "Token invalid" });
  }
});

module.exports = router;

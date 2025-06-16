const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { register, login } = require("../controllers/authController");

// Register endpoint
router.post("/register", register);

// Login endpoint
router.post("/login", login);

// Get authenticated user info
router.get("/me", async (req, res) => {
  const rawToken = req.header("Authorization");
  if (!rawToken) return res.status(401).json({ msg: "No token provided" });

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

// ✅ Change password route
router.put("/change-password", async (req, res) => {
  const rawToken = req.header("Authorization");
  if (!rawToken) return res.status(401).json({ msg: "No token provided" });

  const token = rawToken.startsWith("Bearer ") ? rawToken.slice(7) : rawToken;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    const { oldPassword, newPassword } = req.body;

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Old password is incorrect" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(newPassword, salt);

    user.password = hashed;
    await user.save();

    res.json({ msg: "Password updated successfully" });
  } catch (err) {
    console.error("❌ Error updating password:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;

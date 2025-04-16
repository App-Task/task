const express = require("express");
const router = express.Router();
const { register, login } = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login); // 👈 THIS is the login endpoint!

module.exports = router;

const jwt = require("jsonwebtoken");
const User = require("../models/User");

router.get("/me", async (req, res) => {
  const token = req.header("Authorization");
  if (!token) return res.status(401).json({ msg: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("name email");
    if (!user) return res.status(404).json({ msg: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(401).json({ msg: "Token invalid" });
  }
});

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = require("../models/User");

// ✅ GET /api/users?verificationStatus=pending
router.get("/users", async (req, res) => {
  try {
    const filter = {};
    if (req.query.verificationStatus) {
      filter.verificationStatus = req.query.verificationStatus;
    }
    const users = await User.find(filter);
    res.json(users);
  } catch (err) {
    console.error("❌ Error fetching users:", err.message);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

module.exports = router;

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = require("../models/User");

router.get("/users", async (req, res) => {
  try {
    const filter = {};

    if (req.query.verificationStatus) {
      filter.verificationStatus = req.query.verificationStatus;
    }

    if (req.query.role) {
      filter.role = req.query.role; // ✅ Only include taskers
    }

    const users = await User.find(filter);
    res.json(users);
  } catch (err) {
    console.error("❌ Error fetching users:", err.message);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});




// ✅ GET /api/users/:id — fetch specific user by ID
router.get("/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("❌ Error fetching user:", err.message);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

module.exports = router;

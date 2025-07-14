const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = require("../models/User");
const { verifyTokenMiddleware } = require("../middleware/authMiddleware");


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

// ✅ PUT /api/users/me — update logged-in user's profile
router.put("/me", verifyTokenMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Update basic fields
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.phone = req.body.phone || user.phone;

    // ✅ Add new fields for phone breakdown
    user.callingCode = req.body.callingCode || user.callingCode;
    user.rawPhone = req.body.rawPhone || user.rawPhone;
    user.countryCode = req.body.countryCode || user.countryCode;

    await user.save();

    res.json({
      msg: "Profile updated",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        callingCode: user.callingCode,
        rawPhone: user.rawPhone,
        countryCode: user.countryCode,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("❌ Profile update error:", err.message);
    res.status(500).json({ error: "Failed to update profile" });
  }
});


module.exports = router;

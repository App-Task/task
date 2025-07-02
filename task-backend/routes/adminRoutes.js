const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = require("../models/User");
const Notification = require("../models/Notification"); // if not created, I’ll provide this

// ✅ PATCH /api/admin/verify-tasker/:id
router.patch("/verify-tasker/:id", async (req, res) => {
  const { status } = req.body; // expected: "accepted" or "declined"
  const taskerId = req.params.id;

  if (!["accepted", "declined"].includes(status)) {
    return res.status(400).json({ error: "Invalid verification status." });
  }

  try {
    if (!mongoose.Types.ObjectId.isValid(taskerId)) {
      return res.status(400).json({ error: "Invalid tasker ID." });
    }

    const tasker = await User.findById(taskerId);
    if (!tasker) {
      return res.status(404).json({ error: "Tasker not found." });
    }

    tasker.isVerified = status === "accepted";
    tasker.verificationStatus = status;
    await tasker.save();

    // Create notification
    await Notification.create({
        userId: tasker._id,
        type: "verification",
        title: "Verification Status",
        message:
          status === "accepted"
            ? "Your documents were approved. You're now verified!"
            : "Your documents were declined. Please re-upload to get verified.",
      });
      

    res.json({
      msg: `Tasker verification ${status}`,
      isVerified: tasker.isVerified,
      verificationStatus: tasker.verificationStatus,
    });
  } catch (err) {
    console.error("❌ Verify tasker error:", err.message);
    res.status(500).json({ error: "Failed to update verification status." });
  }
});

module.exports = router;

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = require("../models/User");

// ✅ POST /api/documents/upload
router.post("/upload", async (req, res) => {
  try {
    const { userId, files } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid userId" });
    }

    if (!files || !Array.isArray(files)) {
      return res.status(400).json({ error: "Invalid or missing files" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.documents = [...(user.documents || []), ...files];
    user.verificationStatus = "pending";
    user.isVerified = false;
    await user.save();

    res.json({ msg: "Documents uploaded", documents: user.documents });
  } catch (err) {
    console.error("❌ Upload error:", err.message);
    res.status(500).json({ error: "Upload failed" });
  }
});

module.exports = router;

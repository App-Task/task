const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const mongoose = require("mongoose");
const User = require("../models/User");

// ✅ Setup Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dest = path.join(__dirname, "../uploads");
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const name = `${Date.now()}-${file.originalname}`;
    cb(null, name);
  },
});
const upload = multer({ storage });

// ✅ Actual File Upload
router.post("/upload-file", upload.single("file"), async (req, res) => {
  try {
    console.log("📥 File upload route hit!");

    const { userId } = req.body;
    console.log("🧾 userId:", userId);
    console.log("📁 file:", req.file);

    if (!req.file) return res.status(400).json({ error: "No file received" });
    if (!mongoose.Types.ObjectId.isValid(userId))
      return res.status(400).json({ error: "Invalid userId" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const savedPath = `/uploads/${req.file.filename}`;
    user.documents = [...(user.documents || []), savedPath];
    user.verificationStatus = "pending";
    user.isVerified = false;
    await user.save();

    console.log("✅ File uploaded and user updated.");
    res.status(200).json({ msg: "Upload successful", path: savedPath });
  } catch (err) {
    console.error("❌ Fatal upload error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

module.exports = router;

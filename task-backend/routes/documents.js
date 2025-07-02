const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const mongoose = require("mongoose");
const fs = require("fs");
const User = require("../models/User");

// ✅ Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// ✅ Setup Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const name = `${Date.now()}-${file.originalname}`;
    cb(null, name);
  },
});
const upload = multer({ storage });

// ✅ File Upload Route
router.post("/upload-file", upload.single("file"), async (req, res) => {
  try {
    console.log("📥 Hit: /api/documents/upload-file");

    const { userId } = req.body;
    console.log("➡️  userId:", userId);
    console.log("📎 file:", req.file);

    if (!req.file) {
      console.log("❌ No file received.");
      return res.status(400).json({ error: "No file uploaded" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.log("❌ Invalid userId format.");
      return res.status(400).json({ error: "Invalid userId" });
    }

    const user = await User.findById(userId);
    if (!user) {
      console.log("❌ User not found.");
      return res.status(404).json({ error: "User not found" });
    }

    const filePath = `/uploads/${req.file.filename}`;
    console.log("✅ File saved to:", filePath);

    user.documents = [...(user.documents || []), filePath];
    user.verificationStatus = "pending";
    user.isVerified = false;
    await user.save();

    console.log("✅ User updated with new document.");
    return res.status(200).json({ msg: "File uploaded", path: filePath });
  } catch (err) {
    console.error("❌ Upload error:", err.stack || err.message);
    return res.status(500).json({ error: "Upload failed" });
  }
});

module.exports = router;

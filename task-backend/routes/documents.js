// routes/documents.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const User = require("../models/User");

// ✅ Set up multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // ensure this folder exists
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });




// ✅ Route 1: Upload using JSON file names (used in initial mock)
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


// ✅ Route 2: Upload actual file using multipart/form-data
router.post("/upload-file", upload.single("file"), async (req, res) => {
  try {
    console.log("📥 Incoming file upload request");

    const { userId } = req.body;
    console.log("🧾 Received userId:", userId);
    console.log("🗂 Received file object:", req.file);

    if (!req.file) {
      console.log("❌ No file was uploaded.");
      return res.status(400).json({ error: "No file uploaded." });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.log("❌ Invalid userId");
      return res.status(400).json({ error: "Invalid userId" });
    }

    const user = await User.findById(userId);
    if (!user) {
      console.log("❌ User not found in DB");
      return res.status(404).json({ error: "User not found" });
    }

    const filePath = `/uploads/${req.file.filename}`;
    console.log("✅ Saving file path:", filePath);

    user.documents = [...(user.documents || []), filePath];
    user.verificationStatus = "pending";
    user.isVerified = false;
    await user.save();

    console.log("✅ Upload complete for user:", user.email);
    res.json({ msg: "File uploaded", path: filePath });
  } catch (err) {
    console.error("❌ Upload file error:", err.message);
    res.status(500).json({ error: "File upload failed" });
  }
});

module.exports = router;

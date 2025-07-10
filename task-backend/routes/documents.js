const express = require("express");
const router = express.Router();
const multer = require("multer");
const mongoose = require("mongoose");
const User = require("../models/User");

const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../utils/cloudinary");

// ✅ Cloudinary Multer config only
const cloudStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "tasks",
    allowed_formats: ["jpg", "jpeg", "png", "pdf"],
  },
});
const uploadCloud = multer({ storage: cloudStorage });

// ✅ Upload route
router.post("/upload-file", uploadCloud.single("file"), async (req, res) => {
  try {
    console.log("📥 Cloudinary Upload: /api/documents/upload-file");

    const { userId } = req.body;
    if (!req.file || !req.file.path) return res.status(400).json({ error: "No file uploaded" });
    if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ error: "Invalid userId" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.documents = [...(user.documents || []), req.file.path];
    user.verificationStatus = "pending";
    user.isVerified = false;
    await user.save();

    console.log("✅ File uploaded to Cloudinary and user updated.");
    res.status(200).json({ msg: "Uploaded to Cloudinary", path: req.file.path });
  } catch (err) {
    console.error("❌ Upload error:", err.stack || err.message);
    res.status(500).json({ error: "Upload failed" });
  }
});

// ✅ Delete route
router.delete("/delete/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { fileName } = req.body;

    if (!fileName) return res.status(400).json({ error: "Missing fileName" });
    if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ error: "Invalid userId" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.documents = (user.documents || []).filter(
      (doc) => !doc.includes(fileName)
    );

    await user.save();

    console.log(`🗑️ Document '${fileName}' removed from user ${user.email}`);
    res.json({ msg: "Document deleted successfully" });
  } catch (err) {
    console.error("❌ Delete error:", err.stack || err.message);
    res.status(500).json({ error: "Deletion failed" });
  }
});

// ✅ Update user.documents[] with a Cloudinary URL
router.patch("/update/:id", async (req, res) => {
  try {
    const { documentUrl } = req.body;
    const userId = req.params.id;

    if (!documentUrl) return res.status(400).json({ error: "Missing documentUrl" });
    if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ error: "Invalid user ID" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.documents.push(documentUrl);
    user.verificationStatus = "pending";
    user.isVerified = false;
    await user.save();

    res.json({ msg: "Document saved", documents: user.documents });
  } catch (err) {
    console.error("❌ Update route error:", err.stack || err.message);
    res.status(500).json({ error: "Update failed" });
  }
});


module.exports = router;

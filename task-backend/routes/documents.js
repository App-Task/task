const express = require("express");
const router = express.Router();
const multer = require("multer");
const mongoose = require("mongoose");
const User = require("../models/User");

const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../utils/cloudinary");

const cloudStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const ext = file.originalname.split(".").pop().toLowerCase();
    const isPDF = ext === "pdf";

    return {
      folder: "tasks",
      public_id: `${Date.now()}-${file.originalname.replace(/\.[^/.]+$/, "")}`,
      format: ext,
      resource_type: "auto",
      access_mode: "public",
    };
  },
});




const uploadCloud = multer({ storage: cloudStorage });

router.post("/upload-file", uploadCloud.single("file"), async (req, res) => {
  try {
    console.log("📥 Cloudinary Upload: /api/documents/upload-file");

    const { userId } = req.body;
    console.log("📦 req.file =", req.file);

    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ error: "Invalid userId" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const finalUrl = req.file?.path || req.file?.secure_url;
    if (!finalUrl) {
      console.error("❌ Missing file URL in req.file:", req.file);
      return res.status(500).json({ error: "Missing file URL from Cloudinary" });
    }

    user.documents = [...(user.documents || []), finalUrl];
    user.verificationStatus = "pending";
    user.isVerified = false;
    await user.save();

    console.log("✅ File uploaded to Cloudinary and user updated.");
    res.status(200).json({
      msg: "Uploaded to Cloudinary",
      path: finalUrl,
      resourceType: req.file.resource_type,
    });
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

  console.log("📡 PATCH /api/documents/update hit");
console.log("🧾 ID:", req.params.id);
console.log("🧾 documentUrl:", req.body.documentUrl);

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

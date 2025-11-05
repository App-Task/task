const express = require("express");
const router = express.Router();
const logger = require("../utils/logger");
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
      folder: "documents",
      public_id: `${Date.now()}-${file.originalname.replace(/\.[^/.]+$/, "")}`,
      format: ext,
      resource_type: "auto",
      access_mode: "public",
    };
  },
});




const allowedDocMime = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
]);

const docFileFilter = (req, file, cb) => {
  if (!allowedDocMime.has(file.mimetype)) {
    return cb(new Error("Only PDF/JPG/PNG files are allowed"));
  }
  cb(null, true);
};

const uploadCloud = multer({
  storage: cloudStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: docFileFilter,
});

router.post("/upload-file", uploadCloud.single("file"), async (req, res) => {
  try {
    logger.info("📥 Cloudinary Upload: /api/documents/upload-file");

    const { userId } = req.body;
    logger.info("📦 req.file present");

    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ error: "Invalid userId" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const ext = req.file?.format || "pdf";
    const publicId = req.file?.public_id || req.file?.filename;

    if (!publicId) {
      console.error("❌ Missing public_id:", req.file);
      return res.status(500).json({ error: "Missing public_id from Cloudinary" });
    }

    // ✅ Construct accessible public URL manually
    const isPDF = ext === "pdf";
    const finalUrl = req.file?.secure_url || req.file?.url || req.file?.path;


    if (!user.documents.includes(finalUrl)) {
      user.documents.push(finalUrl);
    }    
    user.verificationStatus = "pending";
    user.isVerified = false;
    await user.save();

    logger.info("✅ File uploaded to Cloudinary and user updated.");
    res.status(200).json({
      msg: "Uploaded to Cloudinary",
      path: finalUrl,
      resourceType: req.file.resource_type,
    });
  } catch (err) {
    logger.error("❌ Upload error:", err.stack || err.message);
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

    logger.info("🗑️ Document removed from user", { userId: user._id });
    res.json({ msg: "Document deleted successfully" });
  } catch (err) {
    logger.error("❌ Delete error:", err.stack || err.message);
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

    if (!user.documents.includes(documentUrl)) {
      user.documents.push(documentUrl);
    }    
    user.verificationStatus = "pending";
    user.isVerified = false;
    await user.save();

    res.json({ msg: "Document saved", documents: user.documents });
  } catch (err) {
    logger.error("❌ Update route error:", err.stack || err.message);
    res.status(500).json({ error: "Update failed" });
  }
});


module.exports = router;

const express = require("express");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../utils/cloudinary");

const router = express.Router();

// Configure Cloudinary storage for Multer
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "tasks", // this folder will be created in your Cloudinary account
    allowed_formats: ["jpg", "jpeg", "png"],
  },
});

const upload = multer({ storage });

// ✅ New storage for profile images
const profileStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "profile_pictures", // ✅ will automatically create this folder in Cloudinary
    allowed_formats: ["jpg", "jpeg", "png"],
  },
});

const uploadProfile = multer({ storage: profileStorage });


// Route: POST /api/upload
router.post("/", upload.single("image"), (req, res) => {
  if (!req.file || !req.file.path) {
    return res.status(400).json({ error: "No image uploaded." });
  }

  res.json({ imageUrl: req.file.path }); // ✅ public image URL
});


// ✅ New route for profile image uploads
router.post("/profile", uploadProfile.single("image"), (req, res) => {
  if (!req.file || !req.file.path) {
    return res.status(400).json({ error: "No profile image uploaded." });
  }

  res.json({ imageUrl: req.file.path }); // ✅ Cloudinary public URL
});

module.exports = router;

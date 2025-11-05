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

const imageFileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/jpg"];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("Only JPG/PNG images are allowed"));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: imageFileFilter,
});

// ✅ New storage for profile images
const profileStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "profile_pictures", // ✅ will automatically create this folder in Cloudinary
    allowed_formats: ["jpg", "jpeg", "png"],
  },
});

const uploadProfile = multer({
  storage: profileStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: imageFileFilter,
});


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

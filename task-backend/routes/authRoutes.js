const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { register, login } = require("../controllers/authController");

// Register endpoint
router.post("/register", register);

// Login endpoint
router.post("/login", login);

// Get authenticated user info
router.get("/me", async (req, res) => {
  const rawToken = req.header("Authorization");
  if (!rawToken) return res.status(401).json({ msg: "No token provided" });

  const token = rawToken.startsWith("Bearer ") ? rawToken.slice(7) : rawToken;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select(
      "name email phone callingCode rawPhone countryCode profileImage gender location experience skills about isVerified verificationStatus documents"
    );
    
    
    
        if (!user) return res.status(404).json({ msg: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(401).json({ msg: "Token invalid" });
  }
});

// ✅ Change password route
router.put("/change-password", async (req, res) => {
  const rawToken = req.header("Authorization");
  if (!rawToken) return res.status(401).json({ msg: "No token provided" });

  const token = rawToken.startsWith("Bearer ") ? rawToken.slice(7) : rawToken;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    const { oldPassword, newPassword } = req.body;

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Old password is incorrect" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(newPassword, salt);

    user.password = hashed;
    await user.save();

    res.json({ msg: "Password updated successfully" });
  } catch (err) {
    console.error("❌ Error updating password:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

// ✅ Update profile route (name, email, and profileImage)
router.put("/me", async (req, res) => {
  const rawToken = req.header("Authorization");
  if (!rawToken) return res.status(401).json({ msg: "No token provided" });

  const token = rawToken.startsWith("Bearer ") ? rawToken.slice(7) : rawToken;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ msg: "User not found" });
    const {
      name,
      email,
      phone,
      profileImage,
      gender,
      location,
      experience,
      skills,
      about,
      callingCode,
      rawPhone,
      countryCode,
    } = req.body;
    
    
    
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) {
      const phoneExists = await User.findOne({ phone });
      if (phoneExists && phoneExists._id.toString() !== user._id.toString()) {
        return res.status(400).json({ msg: "Phone number already in use" });
      }
      user.phone = phone;
    }

    if (callingCode) user.callingCode = callingCode;
if (rawPhone) user.rawPhone = rawPhone;
if (countryCode) user.countryCode = countryCode;

    
    if (profileImage) user.profileImage = profileImage;
    
    // ✅ Optional tasker-only fields (won't affect clients)
    if (gender !== undefined) user.gender = gender;
    if (location !== undefined) user.location = location;
    if (experience !== undefined) user.experience = experience;
    if (skills !== undefined) user.skills = skills;
    if (about !== undefined) user.about = about;
    

    await user.save();
    res.json({
      msg: "Profile updated",
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        callingCode: user.callingCode || "",
        rawPhone: user.rawPhone || "",
        countryCode: user.countryCode || "",
        profileImage: user.profileImage || null,
        gender: user.gender || "",
        location: user.location || "",
        experience: user.experience || "",
        skills: user.skills || "",
        about: user.about || "",
      },
      
    });
    
    
  } catch (err) {
    console.error("❌ Error updating profile:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;

const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { register, login } = require("../controllers/authController");
const crypto = require("crypto");
const { sendResetCodeEmail } = require("../utils/mailer"); // ⬅️ you'll create this file (already sent to you)

function hashCode(email, code) {
  return crypto.createHash("sha256").update(`${email.toLowerCase()}:${code}`).digest("hex");
}


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
      "name email phone callingCode rawPhone countryCode profileImage gender location skills about isVerified verificationStatus documents"
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

    
if ("profileImage" in req.body) user.profileImage = profileImage;
    
    // ✅ Optional tasker-only fields (won't affect clients)
    if (gender !== undefined) user.gender = gender;
    if (location !== undefined) user.location = location;
    if (skills !== undefined) user.skills = skills;
    if (about !== undefined) user.about = about;
    

    await user.save(); //
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
        skills: user.skills || "",
        about: user.about || "",
      },
      
    });
    
    
  } catch (err) {
    console.error("❌ Error updating profile:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});


// ✅ Forgot Password - Send 6-digit code
router.post("/forgot-password", async (req, res) => {
  const { email, role } = req.body;
  const genericMsg = { msg: "If this email exists, we sent a reset code." };

  if (!email) return res.status(200).json(genericMsg);

  // If role is provided, find user by email + role, otherwise find by email only
  const query = role ? { email: email.toLowerCase(), role: role.toLowerCase() } : { email: email.toLowerCase() };
  const user = await User.findOne(query);
  if (!user) return res.status(200).json(genericMsg);

  const now = Date.now();
  if (user.passwordResetLastSentAt && now - user.passwordResetLastSentAt.getTime() < 60 * 1000) {
    return res.status(200).json(genericMsg); // silently throttle
  }

  const code = (crypto.randomInt(100000, 1000000)).toString(); // 6-digit
  const hash = hashCode(email, code);

  user.passwordResetCodeHash = hash;
  user.passwordResetExpires = new Date(now + 15 * 60 * 1000); // 15 mins
  user.passwordResetAttempts = 0;
  user.passwordResetLastSentAt = new Date(now);
  await user.save();

  try {
    await sendResetCodeEmail({ to: email, code });
  } catch (err) {
    console.error("Resend error:", err.message);
  }

  return res.status(200).json(genericMsg);
});

// ✅ Reset Password - Confirm code and set new password
router.post("/reset-password", async (req, res) => {
  const { email, code, newPassword, role } = req.body;
  const genericError = { msg: "Invalid code or it has expired." };

  if (!email || !code || !newPassword) {
    return res.status(400).json({ msg: "Missing fields." });
  }

  // Validate role if provided
  if (role && !['client', 'tasker'].includes(role.toLowerCase())) {
    return res.status(400).json({ msg: "Invalid role specified." });
  }

  const strongPw = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
  if (!strongPw.test(newPassword)) {
    return res.status(400).json({ msg: "Weak password." });
  }

  // If role is provided, validate that the user has the correct role
  const query = role ? { email: email.toLowerCase(), role: role.toLowerCase() } : { email: email.toLowerCase() };
  console.log(`🔍 Reset password query:`, query);
  
  const user = await User.findOne(query);
  console.log(`🔍 User found:`, user ? { id: user._id, email: user.email, role: user.role } : 'Not found');
  
  if (!user) {
    return res.status(400).json({ msg: "User not found with the specified email and role." });
  }
  
  if (!user.passwordResetCodeHash || !user.passwordResetExpires) {
    return res.status(400).json({ msg: "No active password reset request found. Please request a new reset code." });
  }

  if (user.passwordResetExpires.getTime() < Date.now()) {
    return res.status(400).json(genericError);
  }

  if (user.passwordResetAttempts >= 5) {
    return res.status(400).json(genericError);
  }

  const hash = hashCode(email, code);
  if (hash !== user.passwordResetCodeHash) {
    user.passwordResetAttempts += 1;
    await user.save();
    return res.status(400).json(genericError);
  }

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);

  user.passwordResetCodeHash = undefined;
  user.passwordResetExpires = undefined;
  user.passwordResetAttempts = 0;
  user.passwordResetLastSentAt = undefined;
  if (typeof user.markPasswordChanged === "function") {
    user.markPasswordChanged();
  }

  await user.save();

  return res.status(200).json({ msg: "Password updated. You can now log in." });
});


module.exports = router;

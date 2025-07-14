const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, callingCode, rawPhone, countryCode } = req.body;

    const role = req.body.role?.toLowerCase() || "client";

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.trim();

    // Check if email already exists for this role
    const existing = await User.findOne({ email: normalizedEmail, role });
    if (existing) {
      return res.status(400).json({ msg: "Email already in use for this role" });
    }

    // Check if phone already exists for this role
    const phoneExists = await User.findOne({ phone: normalizedPhone, role });
    if (phoneExists) {
      return res.status(400).json({ msg: "Phone number already in use for this role" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      password: hashed,
      role,
      callingCode,
      rawPhone,
      countryCode,
    });
    

    res.status(201).json({
      msg: "User registered",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        callingCode: user.callingCode,
        rawPhone: user.rawPhone,
        countryCode: user.countryCode,
      },
    });
    
  } catch (err) {
    console.error("❌ Registration Error:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const role = req.body.role?.toLowerCase() || "client";
    const normalizedEmail = email.trim().toLowerCase();

    // Match by email + role
    const user = await User.findOne({ email: normalizedEmail, role });

    if (!user) {
      return res.status(400).json({ msg: "Invalid credentials" }); // Scenario 2, 4, 5
    }

    // Blocked user
    if (user.isBlocked) {
      return res.status(403).json({ msg: "Your account has been blocked by the admin." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" }); // Scenario 3, 6
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "dev_secret_key", {
      expiresIn: "7d",
    });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("❌ Login Error:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
};

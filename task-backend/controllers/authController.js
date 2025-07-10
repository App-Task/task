const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, role = "client" } = req.body;
    const normalizedEmail = email.trim().toLowerCase();
const normalizedPhone = phone.trim();




const existing = await User.findOne({ email: normalizedEmail, role });

if (existing)
  return res.status(400).json({ msg: "Email already in use for this role" });

const phoneExists = await User.findOne({ phone: normalizedPhone, role });
if (phoneExists)
  return res.status(400).json({ msg: "Phone number already in use for this role" });



    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const user = await User.create({ 
      name: name.trim(), 
      email: normalizedEmail, 
      phone: normalizedPhone, 
      password: hashed, 
      role 
    });
    



    res.status(201).json({
      msg: "User registered",
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone },
    });
    
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email, role: req.body.role });

    if (!user) return res.status(400).json({ msg: "Invalid credentials" });

    // ✅ Blocked check\
    if (user.isBlocked) {
      return res.status(403).json({ msg: "Your account has been blocked by the admin." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "dev_secret_key", {
      expiresIn: "7d",
    });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role, // ✅ Add this
      },
    });
    
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};


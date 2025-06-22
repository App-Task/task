const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profileImage: { type: String },

    // ✅ Tasker-only optional fields
    gender: { type: String, default: "" },
    location: { type: String, default: "" },
    experience: { type: String, default: "" },
    skills: { type: String, default: "" },
    about: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);

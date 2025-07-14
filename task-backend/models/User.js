const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true }, // keep for full format
    callingCode: { type: String },           // e.g. "+966"
    rawPhone: { type: String },              // e.g. "512345678"
    countryCode: { type: String },           // e.g. "SA"
    password: { type: String, required: true },
    profileImage: { type: String },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    

    // ✅ NEW FIELD: User role
    role: {
      type: String,
      enum: ["client", "tasker"],
      required: true, // enforce role is always set
    },

    // ✅ Tasker-only optional fields
    gender: { type: String, default: "" },
    location: { type: String, default: "" },
    experience: { type: String, default: "" },
    skills: { type: String, default: "" },
    about: { type: String, default: "" },

    // ✅ Verification-related fields
    isVerified: { type: Boolean, default: false },
    documents: [{ type: String }],
    verificationStatus: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending",
    },
  },
  { timestamps: true }

  
);

module.exports = mongoose.model("User", userSchema);

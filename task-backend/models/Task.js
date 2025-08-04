const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema(
  {
    title: String,
    description: String,

    // Human-readable address (optional)
    location: String,

    // Use Number for money
    budget: { type: Number, default: 0 },

    category: String,
    images: [String],

    // NEW: geolocation
    latitude: { type: Number, index: true },
    longitude: { type: Number, index: true },
    // MongoDB GeoJSON point [lng, lat]
    locationGeo: {
      type: {
        type: String,
        enum: ["Point"],
        default: undefined, // only set when coords exist
      },
      coordinates: {
        type: [Number], // [lng, lat]
        default: undefined,
      },
    },

    status: {
      type: String,
      enum: ["Pending", "Started", "Completed", "Cancelled"],
      default: "Pending",
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // client
      required: true,
    },
    taskerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // tasker
    },

    bidCount: { type: Number, default: 0 },

    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    completedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
  },
  { timestamps: true } // adds createdAt & updatedAt automatically
);

// 2dsphere index required for $near queries
TaskSchema.index({ locationGeo: "2dsphere" });

TaskSchema.pre("deleteOne", { document: true, query: false }, async function (next) {
  try {
    const taskId = this._id;
    await require("./Bid").deleteMany({ taskId });
    next();
  } catch (err) {
    console.error("❌ Error deleting related bids for task:", err.message);
    next(err);
  }
});

module.exports = mongoose.model("Task", TaskSchema);

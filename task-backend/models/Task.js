const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema({
  title: String,
  description: String,
  location: String,
  budget: String,
  category: String,
  images: [String],
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
  bidCount: {
    type: Number,
    default: 0,
  },
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId, // 👈 will store the _id of the user who cancelled
    ref: "User",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Task", TaskSchema);

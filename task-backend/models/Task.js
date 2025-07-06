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
    ref: "User",
    required: true, // client
  },
  taskerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // new field for tasker
  },
  bidCount: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Task", TaskSchema);

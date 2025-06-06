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
    default: "open", // other options later: "assigned", "completed"
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Task", TaskSchema);

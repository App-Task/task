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
  completedAt: {
    type: Date,
    default: null,
  },
  cancelledAt: {
    type: Date,
    default: null,
  },  
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

TaskSchema.pre("deleteOne", { document: true, query: false }, async function (next) {
  try {
    const taskId = this._id;
    await require("./Bid").deleteMany({ taskId }); // delete bids related to this task
    next();
  } catch (err) {
    console.error("❌ Error deleting related bids for task:", err.message);
    next(err);
  }
});


module.exports = mongoose.model("Task", TaskSchema);

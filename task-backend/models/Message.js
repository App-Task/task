const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
  text: { type: String, required: false },
  image: { type: String, required: false },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Message", messageSchema);

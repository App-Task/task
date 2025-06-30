const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Bid = require("../models/Bid");
const Task = require("../models/Task");
const Notification = require("../models/Notification"); // ✅ ADD THIS at the top with your imports

// ✅ POST /api/bids — tasker submits a bid
router.post("/", async (req, res) => {
  try {
    const { taskId, taskerId, amount, message } = req.body;

    if (!taskId || !taskerId || !amount) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const bid = new Bid({
      taskId,
      taskerId,
      amount,
      message,
    });

    await bid.save();
    res.status(201).json(bid);
  } catch (err) {
    console.error("❌ Bid creation error:", err.message);
    res.status(500).json({ error: "Failed to create bid" });
  }
});

// ✅ GET /api/bids/task/:taskId — client views all bids for one task
router.get("/task/:taskId", async (req, res) => {
  try {
    const { taskId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ error: "Invalid task ID" });
    }

    const bids = await Bid.find({ taskId }).sort({ createdAt: -1 }).populate("taskerId", "name email");
    res.json(bids);
  } catch (err) {
    console.error("❌ Fetch bids error:", err.message);
    res.status(500).json({ error: "Failed to fetch bids" });
  }
});

// ✅ PUT /api/bids/:bidId/accept — client accepts a bid
router.put("/:bidId/accept", async (req, res) => {
  try {
    const { bidId } = req.params;

    const bid = await Bid.findById(bidId);
    if (!bid) return res.status(404).json({ error: "Bid not found" });

    // Step 1: mark the accepted bid
    bid.status = "Accepted";
    await bid.save();

    // Step 2: reject all other bids for that task
    await Bid.updateMany(
      { taskId: bid.taskId, _id: { $ne: bid._id } },
      { $set: { status: "Rejected" } }
    );

    // Step 3: update task with accepted taskerId and status
    const updatedTask = await Task.findByIdAndUpdate(
      bid.taskId,
      {
        taskerId: bid.taskerId,
        status: "Started",
      },
      { new: true }
    );

    res.json({ bid, task: updatedTask });
  } catch (err) {
    console.error("❌ Accept bid error:", err.message);
    res.status(500).json({ error: "Failed to accept bid" });
  }
});


// ✅ POST /api/bids — tasker submits a bid
router.post("/", async (req, res) => {
  try {
    const { taskId, taskerId, amount, message } = req.body;

    if (!taskId || !taskerId || !amount) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    // Save the bid
    const bid = new Bid({ taskId, taskerId, amount, message });
    await bid.save();

    // 🔔 Fetch the task to get client ID
    const task = await Task.findById(taskId);
    if (task) {
      const notification = new Notification({
        userId: task.userId,
        type: "bid",
        title: "New Bid on Your Task",
        message: `A new bid was placed on your task "${task.title}"`,
        relatedTaskId: taskId,
        relatedBidId: bid._id,
      });
      
      await notification.save();
    }

    res.status(201).json(bid);
  } catch (err) {
    console.error("❌ Bid creation error:", err.message);
    res.status(500).json({ error: "Failed to create bid" });
  }
});

module.exports = router;

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Bid = require("../models/Bid");
const Task = require("../models/Task");
const Notification = require("../models/Notification"); // ✅ for creating notifications

// ✅ POST /api/bids — tasker submits a bid and notifies client
router.post("/", async (req, res) => {
  try {
    const { taskId, taskerId, amount, message } = req.body;

    if (!taskId || !taskerId || !amount) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    // Save the bid
const bid = new Bid({ taskId, taskerId, amount, message });
await bid.save();

// ✅ Increment bidCount on Task
await Task.findByIdAndUpdate(taskId, { $inc: { bidCount: 1 } });


    // 🔔 Fetch the task to get client ID and title
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
      console.log("✅ Notification created for user:", task.userId.toString());
    }

    res.status(201).json(bid);
  } catch (err) {
    console.error("❌ Bid creation error:", err.message);
    res.status(500).json({ error: "Failed to create bid" });
  }
});

// ✅ GET /api/bids/task/:taskId — client views all bids for a task
router.get("/task/:taskId", async (req, res) => {
  try {
    const { taskId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ error: "Invalid task ID" });
    }

    const bids = await Bid.find({ taskId })
      .sort({ createdAt: -1 })
      .populate("taskerId", "name email");

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

    // ✅ Notify tasker that they have been hired
    if (updatedTask && updatedTask.taskerId) {
      const notifyTasker = new Notification({
        userId: updatedTask.taskerId,
        type: "bid",
        title: "You’ve Been Hired",
        message: `You've been hired for the task "${updatedTask.title}"`,
        relatedTaskId: updatedTask._id,
      });
      await notifyTasker.save();
    }

    res.json({ bid, task: updatedTask });
  } catch (err) {
    console.error("❌ Accept bid error:", err.message);
    res.status(500).json({ error: "Failed to accept bid" });
  }
});

// ✅ GET /api/bids/my-bids — for showing tasker's sent bids
router.get("/my-bids", async (req, res) => {
  const decoded = verifyToken(req);
  if (!decoded) return res.status(401).json({ error: "Unauthorized" });

  try {
    const taskerId = decoded.userId || decoded.id;
    const bids = await Bid.find({ taskerId, status: "Pending" })
      .populate("taskId");

    // only return tasks that are still available
    const filtered = bids
      .filter((b) => b.taskId && b.taskId.status === "Pending")
      .map((b) => b.taskId); // extract task object

    res.json(filtered);
  } catch (err) {
    console.error("❌ Error fetching bid sent:", err);
    res.status(500).json({ error: "Failed to load bid sent" });
  }
});


module.exports = router;

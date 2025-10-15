const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Bid = require("../models/Bid");
const Task = require("../models/Task");
const Notification = require("../models/Notification"); // ✅ for creating notifications
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret"; // replace with your actual secret if needed
const { verifyTokenMiddleware } = require("../middleware/authMiddleware");


const verifyToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  const token = authHeader.split(" ")[1];
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
};


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
        title: "notification.newBid",
        message: `notification.newBidMessage|${task.title}`,
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
        title: "notification.hired",
        message: `notification.hiredMessage|${updatedTask.title}`,
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
router.get("/my-bids", verifyTokenMiddleware, async (req, res) => {
  try {
    const taskerId = req.user.userId || req.user.id;

    const bids = await Bid.find({ taskerId, status: "Pending" }).populate("taskId");

    const filtered = bids
      .filter((b) => b.taskId && b.taskId.status === "Pending")
      .map((b) => b.taskId);

    res.json(filtered);
  } catch (err) {
    console.error("❌ Error fetching bid sent:", err);
    res.status(500).json({ error: "Failed to load bid sent" });
  }
});


// ✅ GET /api/bids/tasker/:taskerId — get all bids made by a tasker
router.get("/tasker/:taskerId", async (req, res) => {
  try {
    const { taskerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(taskerId)) {
      return res.status(400).json({ error: "Invalid tasker ID" });
    }

    const bids = await Bid.find({ taskerId })
      .populate("taskId") // ✅ populate for matching task._id
      .select("taskId amount message"); // ✅ include required fields only

    res.json(bids);
  } catch (err) {
    console.error("❌ Error fetching tasker bids:", err.message);
    res.status(500).json({ error: "Failed to fetch tasker bids" });
  }
});

// ✅ PATCH /api/bids/:bidId — update a bid
router.patch("/:bidId", async (req, res) => {
  try {
    const { bidId } = req.params;
    const { amount, message } = req.body;

    const bid = await Bid.findById(bidId);
    if (!bid) return res.status(404).json({ error: "Bid not found" });

    // Block if bid is already accepted
    if (bid.status === "Accepted") return res.status(403).json({ error: "Bid already accepted" });

    bid.amount = amount;
    bid.message = message;
    await bid.save();

    res.json(bid);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Update failed" });
  }
});

// ✅ DELETE /api/bids/:bidId — withdraw a bid
router.delete("/:bidId", verifyTokenMiddleware, async (req, res) => {
  try {
    console.log("🔍 DELETE /api/bids/:bidId called with bidId:", req.params.bidId);
    const { bidId } = req.params;
    const taskerId = req.user.userId || req.user.id;

    console.log("🔍 Looking for bid with ID:", bidId);
    const bid = await Bid.findById(bidId);
    if (!bid) {
      console.log("❌ Bid not found with ID:", bidId);
      return res.status(404).json({ error: "Bid not found" });
    }

    // Check if the bid belongs to the authenticated tasker
    if (bid.taskerId.toString() !== taskerId) {
      return res.status(403).json({ error: "Unauthorized to withdraw this bid" });
    }

    // Block if bid is already accepted
    if (bid.status === "Accepted") {
      return res.status(403).json({ error: "Cannot withdraw accepted bid" });
    }

    // ✅ Decrement bidCount on Task
    await Task.findByIdAndUpdate(bid.taskId, { $inc: { bidCount: -1 } });

    // Delete the bid
    await Bid.findByIdAndDelete(bidId);

    // ✅ Notify client that a bid was withdrawn
    const task = await Task.findById(bid.taskId);
    if (task) {
      const notification = new Notification({
        userId: task.userId,
        type: "bid",
        title: "notification.bidWithdrawn",
        message: `notification.bidWithdrawnMessage|${task.title}`,
        relatedTaskId: bid.taskId,
      });

      await notification.save();
      console.log("✅ Notification created for bid withdrawal:", task.userId.toString());
    }

    res.json({ message: "Bid withdrawn successfully" });
  } catch (err) {
    console.error("❌ Withdraw bid error:", err.message);
    res.status(500).json({ error: "Failed to withdraw bid" });
  }
});




module.exports = router;

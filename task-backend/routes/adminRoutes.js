const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = require("../models/User");
const Notification = require("../models/Notification"); // if not created, I’ll provide this
const Task = require("../models/Task");
const Message = require("../models/Message");
const Bid = require("../models/Bid");
const Review = require("../models/Review");


// ✅ PATCH /api/admin/verify-tasker/:id
router.patch("/verify-tasker/:id", async (req, res) => {
  const { status } = req.body; // expected: "accepted" or "declined"
  const taskerId = req.params.id;

  if (!["accepted", "declined"].includes(status)) {
    return res.status(400).json({ error: "Invalid verification status." });
  }

  try {
    if (!mongoose.Types.ObjectId.isValid(taskerId)) {
      return res.status(400).json({ error: "Invalid tasker ID." });
    }

    const tasker = await User.findById(taskerId);
    if (!tasker) {
      return res.status(404).json({ error: "Tasker not found." });
    }

    tasker.isVerified = status === "accepted";
    tasker.verificationStatus = status;
    await tasker.save();

    // Create notification
    await Notification.create({
        userId: tasker._id,
        type: "verification",
        title: "Verification Status",
        message:
          status === "accepted"
            ? "Your documents were approved. You're now verified!"
            : "Your documents were declined. Please re-upload to get verified.",
      });
      

    res.json({
      msg: `Tasker verification ${status}`,
      isVerified: tasker.isVerified,
      verificationStatus: tasker.verificationStatus,
    });
  } catch (err) {
    console.error("❌ Verify tasker error:", err.message);
    res.status(500).json({ error: "Failed to update verification status." });
  }
});
router.get("/clients", async (req, res) => {
  try {
    const clients = await User.find({ role: "client" }).lean();

    const tasks = await Task.aggregate([
      { $group: { _id: "$userId", total: { $sum: 1 } } }
    ]);

    const taskMap = Object.fromEntries(tasks.map(t => [t._id.toString(), t.total]));

    const data = clients.map(c => {
      try {
        return {
          _id: c._id,
          name: c.name || "N/A",
          email: typeof c.email === "string" ? c.email : "unknown@example.com",
          isBlocked: !!c.isBlocked,
          totalTasks: c._id ? taskMap[c._id.toString()] || 0 : 0,
        };
      } catch (err) {
        console.error("❌ Error mapping client:", c, err.message);
        return null;
      }
    }).filter(Boolean);

    res.json(data);
  } catch (err) {
    console.error("❌ Failed to fetch clients:", err.message);
    res.status(500).json({ error: "Failed to fetch clients" });
  }
});


// PATCH /api/admin/clients/:id/block
router.patch("/clients/:id/block", async (req, res) => {
  await User.findByIdAndUpdate(req.params.id, { isBlocked: true });
  res.json({ message: "User blocked" });
});

// PATCH /api/admin/clients/:id/unblock
router.patch("/clients/:id/unblock", async (req, res) => {
  await User.findByIdAndUpdate(req.params.id, { isBlocked: false });
  res.json({ message: "User unblocked" });
});

// DELETE /api/admin/clients/:id
router.delete("/clients/:id", async (req, res) => {
  const userId = req.params.id;

  try {
    await User.findByIdAndDelete(userId);
    await Task.deleteMany({ userId }); // client tasks
    await Message.deleteMany({ $or: [{ sender: userId }, { receiver: userId }] });
    await Review.deleteMany({ clientId: userId });
    await Notification.deleteMany({ userId });

    res.json({ message: "Client and related data deleted" });
  } catch (err) {
    console.error("❌ Error deleting client:", err.message);
    res.status(500).json({ error: "Failed to delete client" });
  }
});

// GET /api/admin/taskers
router.get("/taskers", async (req, res) => {
  try {
    const taskers = await User.find({ role: "tasker" }).lean();
    const allReviews = await Review.find().lean();

    const result = await Promise.all(taskers.map(async t => {
      const reviews = allReviews.filter(r => r.taskerId.toString() === t._id.toString());
      return {
        _id: t._id,
        name: t.name,
        email: t.email,
        phone: t.phoneNumber || "N/A",
        location: t.location || "N/A",
        documents: t.documents || [],
        verificationStatus: t.verificationStatus || "pending",
        isBlocked: !!t.isBlocked,
        reviews: reviews.map(r => ({ rating: r.rating, comment: r.comment })),
      };
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch taskers" });
  }
});

// PATCH /api/admin/taskers/:id/block
router.patch("/taskers/:id/block", async (req, res) => {
  await User.findByIdAndUpdate(req.params.id, { isBlocked: true });
  res.json({ message: "Tasker blocked" });
});

// PATCH /api/admin/taskers/:id/unblock
router.patch("/taskers/:id/unblock", async (req, res) => {
  await User.findByIdAndUpdate(req.params.id, { isBlocked: false });
  res.json({ message: "Tasker unblocked" });
});

// DELETE /api/admin/taskers/:id
router.delete("/taskers/:id", async (req, res) => {
  const userId = req.params.id;

  try {
    await User.findByIdAndDelete(userId);
    await Bid.deleteMany({ taskerId: userId });
    await Message.deleteMany({ $or: [{ sender: userId }, { receiver: userId }] });
    await Review.deleteMany({ taskerId: userId });
    await Notification.deleteMany({ userId });

    res.json({ message: "Tasker and related data deleted" });
  } catch (err) {
    console.error("❌ Error deleting tasker:", err.message);
    res.status(500).json({ error: "Failed to delete tasker" });
  }
});


// GET /api/admin/tasks
router.get("/tasks", async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 }).populate("userId").populate("taskerId").lean();

    const result = tasks.map(t => ({
      _id: t._id,
      title: t.title,
      status: t.status,
      createdAt: t.createdAt,
      clientName: t.userId?.name || "N/A",
      taskerName: t.taskerId?.name || null,
      cancelledAt: t.status === "Cancelled" ? new Date(t.updatedAt).toLocaleString() : null,
      completedAt: t.status === "Completed" ? new Date(t.updatedAt).toLocaleString() : null,
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});
// GET /api/admin/stats
router.get("/stats", async (req, res) => {
  try {
    const clients = await User.countDocuments({ role: "client" });
    const taskers = await User.countDocuments({ role: "tasker" });
    const verifiedTaskers = await User.countDocuments({ role: "tasker", verificationStatus: "accepted" });
    const tasks = await Task.countDocuments();

    res.json({
      clients,
      taskers,
      verifiedTaskers,
      tasks
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});


module.exports = router;

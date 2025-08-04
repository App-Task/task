const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Task = require("../models/Task");
const Notification = require("../models/Notification"); // ✅ for tasker notifications


// ✅ POST /api/tasks - create new task with optional coordinates
router.post("/", async (req, res) => {
  try {
    const {
      title,
      description,
      location,         // human-readable address (optional if coords exist)
      budget,           // number or string
      category,
      images,
      userId,
      latitude,         // number (optional)
      longitude,        // number (optional)
      locationGeo       // optional GeoJSON from client
    } = req.body;

    // Basic validation: allow either location string OR coords
    if (!title || !description || !budget || !category || !userId) {
      return res.status(400).json({ error: "Missing required fields." });
    }
    if (!location && (typeof latitude !== "number" || typeof longitude !== "number")) {
      return res.status(400).json({ error: "Provide a location string or latitude+longitude." });
    }

    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid userId format." });
    }

    // Ensure numeric budget
    const budgetNumber = typeof budget === "string" ? parseFloat(budget) : budget;
    if (Number.isNaN(budgetNumber)) {
      return res.status(400).json({ error: "Budget must be a number." });
    }

    // Build GeoJSON if not supplied but coords exist
    let geo = locationGeo;
    if (!geo && typeof latitude === "number" && typeof longitude === "number") {
      geo = { type: "Point", coordinates: [longitude, latitude] }; // [lng, lat]
    }

    const newTask = await Task.create({
      title,
      description,
      location: location || null,
      budget: budgetNumber,
      category,
      images: Array.isArray(images) ? images : [],
      userId,
      latitude: typeof latitude === "number" ? latitude : undefined,
      longitude: typeof longitude === "number" ? longitude : undefined,
      locationGeo: geo
    });

    res.status(201).json(newTask);
  } catch (err) {
    console.error("❌ Task creation error:", err);
    res.status(500).json({ error: "Failed to create task" });
  }
});


// ✅ GET /api/tasks - fetch all tasks (admin/debug only)
router.get("/", async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });

const tasksWithBidCount = await Promise.all(
  tasks.map(async (task) => {
    const bidCount = await require("../models/Bid").countDocuments({ taskId: task._id });
    return { ...task.toObject(), bidCount };
  })
);

res.json(tasksWithBidCount);

  } catch (err) {
    console.error("❌ Task fetch error:", err.message);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

// ✅ GET /api/tasks/user/:userId - fetch tasks for a specific user
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid userId format." });
    }

    const tasks = await Task.find({ userId }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    console.error("❌ User task fetch error:", err.message);
    res.status(500).json({ error: "Failed to fetch user tasks" });
  }
});

// ✅ GET /api/tasks/:id - fetch single task by ID
router.get("/:id", async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json(task);
  } catch (err) {
    console.error("❌ Task fetch error:", err.message);
    res.status(500).json({ error: "Failed to fetch task" });
  }
});

// ✅ PUT /api/tasks/:id - update task by ID
router.put("/:id", async (req, res) => {
  try {
    const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updatedTask) return res.status(404).json({ error: "Task not found" });
    res.json(updatedTask);
  } catch (err) {
    console.error("❌ Task update error:", err.message);
    res.status(500).json({ error: "Failed to update task" });
  }
});

// ✅ DELETE /api/tasks/:id - delete task by ID
router.delete("/:id", async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
if (!task) return res.status(404).json({ error: "Task not found" });

await task.deleteOne(); // ✅ triggers the middleware
res.json({ msg: "Task deleted successfully" });

    if (!deletedTask) return res.status(404).json({ error: "Task not found" });
    res.json({ msg: "Task deleted successfully" });
  } catch (err) {
    console.error("❌ Task delete error:", err.message);
    res.status(500).json({ error: "Failed to delete task" });
  }
});

// ✅ GET /api/tasks/tasker/:taskerId?type=active|past
router.get("/tasker/:taskerId", async (req, res) => {
  try {
    const { taskerId } = req.params;
    const { type } = req.query;

    if (!mongoose.Types.ObjectId.isValid(taskerId)) {
      return res.status(400).json({ error: "Invalid taskerId format." });
    }

    let statusFilter = {};

    if (type === "active") {
      statusFilter.status = { $in: ["Pending", "Started"] };
    } else if (type === "past") {
      statusFilter.status = { $in: ["Completed", "Cancelled"] };
    }

    const tasks = await Task.find({
      taskerId,
      ...statusFilter,
    })
    .populate("cancelledBy", "_id name") // ✅ this is the fix
    .sort({ createdAt: -1 });
    

    res.json(tasks);
  } catch (err) {
    console.error("❌ Tasker task fetch error:", err.message);
    res.status(500).json({ error: "Failed to fetch tasker tasks" });
  }
});


// ✅ PUT /api/tasks/:id/cancel
router.put("/:id/cancel", async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ msg: "Task not found" });

    const { cancelledBy } = req.body;
    if (!cancelledBy) return res.status(400).json({ msg: "Missing cancelledBy field" });

    task.status = "Cancelled";
task.cancelledBy = cancelledBy;
task.cancelledAt = new Date();
task.completedAt = null; // clear if it was previously completed

    await task.save();

    const isClient = String(cancelledBy) === String(task.userId);
    const isTasker = String(cancelledBy) === String(task.taskerId);

    // ✅ Notify tasker (if assigned)
    if (task.taskerId) {
      await Notification.create({
        userId: task.taskerId,
        type: "task",
        title: "Task Cancelled",
        message: isClient
          ? `The task “${task.title}” was cancelled by the client.`
          : `The task “${task.title}” was cancelled by you.`,
        relatedTaskId: task._id,
      });
    }

    // ✅ Notify client
    await Notification.create({
      userId: task.userId,
      type: "task",
      title: "Task Cancelled",
      message: isTasker
        ? `The task “${task.title}” was cancelled by the tasker.`
        : `The task “${task.title}” was cancelled by you.`,
      relatedTaskId: task._id,
    });

    res.status(200).json({ msg: "Task cancelled", task });

  } catch (err) {
    console.error("❌ Cancel task error:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});




// ✅ PATCH /api/tasks/:id/complete — mark task as completed
router.patch("/:id/complete", async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });

    task.status = "Completed";
task.completedAt = new Date();
task.cancelledAt = null; // clear if previously cancelled
await task.save();


// ✅ Notify tasker
if (task.taskerId) {
  const notif = new Notification({
    userId: task.taskerId,
    type: "task",
    title: "Task Completed",
    message: `The task “${task.title}” has been marked as completed.`,
    relatedTaskId: task._id,
  });
  await notif.save();
}

res.json({ msg: "Task marked as completed", task });

  } catch (err) {
    console.error("❌ Complete task error:", err.message);
    res.status(500).json({ error: "Failed to mark task as completed" });
  }
});





module.exports = router;

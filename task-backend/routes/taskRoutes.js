const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Task = require("../models/Task");

// ✅ POST /api/tasks - create new task with userId
router.post("/", async (req, res) => {
  try {
    const { title, description, location, budget, category, images, userId } = req.body;

    // Basic validation
    if (!title || !description || !location || !budget || !category || !userId) {
      console.log("❌ Missing fields:", req.body);
      return res.status(400).json({ error: "Missing required fields." });
    }

    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid userId format." });
    }

    const newTask = new Task({
      title,
      description,
      location,
      budget,
      category,
      images,
      userId,
    });

    await newTask.save();
    res.status(201).json(newTask);
  } catch (err) {
    console.error("❌ Task creation error:", err.message);
    res.status(500).json({ error: "Failed to create task", details: err.message });
  }
});

// ✅ GET /api/tasks - fetch all tasks (admin/debug only)
router.get("/", async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.json(tasks);
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

module.exports = router;

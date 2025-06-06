const express = require("express");
const router = express.Router();
const Task = require("../models/Task");

// POST /api/tasks - create new task
router.post("/", async (req, res) => {
  try {
    const newTask = new Task(req.body);
    await newTask.save();
    res.status(201).json(newTask);
  } catch (err) {
    console.error("❌ Task creation error:", err.message);
    res.status(500).json({ error: "Failed to create task" });
  }
});

// (optional: GET /api/tasks later)
module.exports = router;

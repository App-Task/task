const express = require("express");
const router = express.Router();
const Report = require("../models/Report");

// POST /api/reports
router.post("/", async (req, res) => {
  const { reporterId, reportedUserId, reason, taskId } = req.body;

  if (!reporterId || !reportedUserId || !reason) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const report = new Report({ reporterId, reportedUserId, reason, taskId });
    await report.save();
    res.status(201).json({ msg: "Report submitted", report });
  } catch (err) {
    console.error("❌ Report error:", err);
    res.status(500).json({ error: "Failed to submit report" });
  }
});

module.exports = router;

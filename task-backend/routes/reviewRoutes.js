const express = require("express");
const router = express.Router();
const Review = require("../models/Review");

// 🔹 POST /api/reviews — submit review
router.post("/", async (req, res) => {
  try {
    const { taskId, taskerId, clientId, rating, comment } = req.body;

    if (!taskId || !taskerId || !clientId || !rating) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Prevent duplicate review per task
    const existing = await Review.findOne({ taskId, clientId });
    if (existing) return res.status(400).json({ error: "Already reviewed" });

    const review = await Review.create({ taskId, taskerId, clientId, rating, comment });
    res.status(201).json(review);
  } catch (err) {
    console.error("❌ Review submit error:", err.message);
    res.status(500).json({ error: "Failed to submit review" });
  }
});

// 🔹 GET /api/reviews/tasker/:taskerId — average + latest
router.get("/tasker/:taskerId", async (req, res) => {
  try {
    const { taskerId } = req.params;
    const reviews = await Review.find({ taskerId }).sort({ createdAt: -1 });

    if (!reviews.length) return res.json({ average: null, latest: null });

    const average =
      reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    res.json({
      average,
      latest: {
        rating: reviews[0].rating,
        comment: reviews[0].comment,
      },
    });
  } catch (err) {
    console.error("❌ Fetch tasker reviews error:", err.message);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

// 🔹 GET /api/reviews/task/:taskId — check if reviewed
router.get("/task/:taskId", async (req, res) => {
  try {
    const review = await Review.findOne({ taskId: req.params.taskId });
    if (!review) return res.json(null);
    res.json(review);
  } catch (err) {
    console.error("❌ Fetch task review error:", err.message);
    res.status(500).json({ error: "Failed to fetch review" });
  }
});

// 🔹 GET /api/reviews/all/tasker/:taskerId — full list for profile
router.get("/all/tasker/:taskerId", async (req, res) => {
  try {
    const reviews = await Review.find({ taskerId: req.params.taskerId }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    console.error("❌ Fetch all tasker reviews error:", err.message);
    res.status(500).json({ error: "Failed to fetch tasker reviews" });
  }
});


module.exports = router;

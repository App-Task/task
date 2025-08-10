const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const Notification = require("../models/Notification");

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

// Token verification helper
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

// ✅ Secure GET /api/notifications (token-based)
router.get("/", async (req, res) => {
  const decoded = verifyToken(req);
  if (!decoded) return res.status(401).json({ error: "Unauthorized" });

  try {
    const userId = decoded.userId || decoded.id;
    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    console.error("❌ Error fetching notifications:", err.message);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// ✅ PATCH /api/notifications/mark-read
router.patch("/mark-read", async (req, res) => {
  const decoded = verifyToken(req);
  if (!decoded) return res.status(401).json({ error: "Unauthorized" });

  try {
    await Notification.updateMany(
      { userId: decoded.userId || decoded.id, isRead: false },
      { $set: { isRead: true } }
    );
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Error marking notifications as read:", err.message);
    res.status(500).json({ error: "Failed to update notifications" });
  }
});

// ✅ DELETE /api/notifications/clear-all - Clear all notifications for testing
router.delete("/clear-all", async (req, res) => {
  const decoded = verifyToken(req);
  if (!decoded) return res.status(401).json({ error: "Unauthorized" });

  try {
    const userId = decoded.userId || decoded.id;
    await Notification.deleteMany({ userId });
    res.json({ success: true, message: "All notifications cleared" });
  } catch (err) {
    console.error("❌ Error clearing notifications:", err.message);
    res.status(500).json({ error: "Failed to clear notifications" });
  }
});

module.exports = router;

const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const Message = require("../models/Message");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

// Inline JWT auth helper
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

// ✅ GET /api/messages/conversations — recent convos
router.get("/conversations", async (req, res) => {
  const decoded = verifyToken(req);
  if (!decoded) return res.status(401).json({ error: "Unauthorized" });

  try {
    const userId = decoded.userId || decoded.id;

    const latestMessages = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: userId }, { receiver: userId }],
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [{ $eq: ["$sender", userId] }, "$receiver", "$sender"],
          },
          lastMessage: { $first: "$text" },
          createdAt: { $first: "$createdAt" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      { $unwind: "$userInfo" },
      {
        $project: {
          otherUserId: "$_id",
          name: "$userInfo.name",
          lastMessage: 1,
          time: {
            $dateToString: {
              format: "%H:%M",
              date: "$createdAt",
              timezone: "Asia/Riyadh",
            },
          },
        },
      },
    ]);

    res.json(latestMessages);
  } catch (err) {
    console.error("Conversation fetch error:", err);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

// ✅ POST /api/messages — send a message
router.post("/", async (req, res) => {
  const decoded = verifyToken(req);
  if (!decoded) return res.status(401).json({ error: "Unauthorized" });

  const senderId = decoded.userId || decoded.id;
  const { receiver, text, taskId } = req.body;

  if (!receiver || !text) {
    return res.status(400).json({ error: "Receiver and text required" });
  }

  try {
    const receiverExists = await User.findById(receiver);
    if (!receiverExists) return res.status(404).json({ error: "Receiver not found" });

    const message = await Message.create({
      sender: senderId,
      receiver,
      text,
      taskId,
    });

    res.status(201).json(message);
  } catch (err) {
    console.error("Message send error:", err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// ✅ GET /api/messages/:userId — fetch chat with one user
router.get("/:userId", async (req, res) => {
  const decoded = verifyToken(req);
  if (!decoded) return res.status(401).json({ error: "Unauthorized" });

  const myId = decoded.userId || decoded.id;
  const otherId = req.params.userId;

  try {
    const messages = await Message.find({
      $or: [
        { sender: myId, receiver: otherId },
        { sender: otherId, receiver: myId },
      ],
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    console.error("Fetch chat error:", err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// ✅ TEMP: Insert test message
router.get("/test/insert", async (req, res) => {
  try {
    const message = await Message.create({
      sender: "68435959d384004bae5271e5", // June7
      receiver: "68436ab15b79eca542a6508a", // iPad
      text: "Hey iPad! This is a test message from June7 💬",
    });

    res.json({ success: true, message });
  } catch (err) {
    console.error("Insert test message failed:", err);
    res.status(500).json({ error: "Failed to insert test message" });
  }
});

module.exports = router;

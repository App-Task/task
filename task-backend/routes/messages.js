const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const Message = require("../models/Message");
const User = require("../models/User");
const Notification = require("../models/Notification");

const { getJwtSecret } = require("../utils/jwt");
const { validate, sendMessageSchema } = require("../utils/validation");

// ✅ Extract and verify JWT
const verifyToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  const token = authHeader.split(" ")[1];
  try {
    return jwt.verify(token, getJwtSecret());
  } catch {
    return null;
  }
};

const mongoose = require("mongoose");

// ✅ GET /api/messages/conversations — get latest message per conversation
router.get("/conversations", async (req, res) => {
  const decoded = verifyToken(req);
  if (!decoded) return res.status(401).json({ error: "Unauthorized" });

  try {
    const userId = new mongoose.Types.ObjectId(decoded.userId || decoded.id);

    const latestMessages = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: userId }, { receiver: userId }],
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $addFields: {
          otherUserId: {
            $cond: [{ $eq: ["$sender", userId] }, "$receiver", "$sender"],
          },
        },
      },
      {
        $group: {
          _id: "$otherUserId",
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

    // Attach unread count to each conversation
for (const convo of latestMessages) {
  const unreadCount = await Message.countDocuments({
    sender: convo.otherUserId,
    receiver: userId,
    isRead: false,
  });
  convo.unreadCount = unreadCount;
}


    res.json(latestMessages);
  } catch (err) {
    console.error("Conversation fetch error:", err);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

// ✅ POST /api/messages — send a message and notify receiver
router.post("/", validate(sendMessageSchema), async (req, res) => {
  const decoded = verifyToken(req);
  if (!decoded) return res.status(401).json({ error: "Unauthorized" });

  const senderId = decoded.userId || decoded.id;
  const { receiver, text, taskId, image } = req.body;

  if (!receiver || (!text && !image)) {
    return res.status(400).json({ error: "Receiver and text or image required" });
  }

  try {
    const receiverExists = await User.findById(receiver);
    if (!receiverExists) return res.status(404).json({ error: "Receiver not found" });

    const message = await Message.create({
      sender: senderId,
      receiver,
      text: text || "",
      image: image || null,
      taskId,
    });

    // 🔔 Create notification for receiver
    // 🔔 Fetch sender info to personalize notification
const senderUser = await User.findById(senderId);

const notification = new Notification({
  userId: receiver,
  type: "message",
  title: "notification.newMessage",
  message: `notification.newMessageFrom|${senderUser?.name || "someone"}`,
  relatedTaskId: taskId || undefined,
});


    await notification.save();

    res.status(201).json(message);
  } catch (err) {
    console.error("Message send error:", err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// ✅ GET /api/messages/:userId — fetch chat between two users
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
    })
      .sort({ createdAt: 1 })
      .populate("sender", "name profileImage");

    res.json(messages);
  } catch (err) {
    console.error("Fetch chat error:", err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// ✅ GET /api/messages/test/insert — add a test message (dev only)
router.get("/test/insert", async (req, res) => {
  try {
    const message = await Message.create({
      sender: "68435959d384004bae5271e5", // example sender
      receiver: "68436ab15b79eca542a6508a", // example receiver
      text: "Hey iPad! This is a test message from June7 💬",
    });

    res.json({ success: true, message });
  } catch (err) {
    console.error("Insert test message failed:", err);
    res.status(500).json({ error: "Failed to insert test message" });
  }
});

// ✅ PATCH /api/messages/mark-read/:userId — mark messages from user as read
router.patch("/mark-read/:userId", async (req, res) => {
  const decoded = verifyToken(req);
  if (!decoded) return res.status(401).json({ error: "Unauthorized" });

  const myId = decoded.userId || decoded.id;
  const fromUserId = req.params.userId;

  try {
    await Message.updateMany(
      { sender: fromUserId, receiver: myId, isRead: false },
      { $set: { isRead: true } }
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Mark read error:", err);
    res.status(500).json({ error: "Failed to mark messages as read" });
  }
});


module.exports = router;

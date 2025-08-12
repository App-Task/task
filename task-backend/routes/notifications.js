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

// ✅ PATCH /api/notifications/update-language - Update all notifications to new language
router.patch("/update-language", async (req, res) => {
  const decoded = verifyToken(req);
  if (!decoded) return res.status(401).json({ error: "Unauthorized" });

  try {
    const userId = decoded.userId || decoded.id;
    const { language } = req.body;

    if (!language || !["en", "ar"].includes(language)) {
      return res.status(400).json({ error: "Invalid language. Must be 'en' or 'ar'" });
    }

    // Translation mappings
    const translations = {
      en: {
        // Message notifications
        "notification.newMessage": "New Message",
        "notification.newMessageFrom": "New message from ",
        
        // Bid notifications
        "notification.newBid": "New Bid on Your Task",
        "notification.newBidMessage": "A new bid was placed on your task \"",
        "notification.hired": "You've Been Hired!",
        "notification.hiredMessage": "You've been hired for the task \"",
        
        // Review notifications
        "notification.newReview": "New Review",
        "notification.newReviewMessage": "You received a review from the client for task \"",
        
        // Task notifications
        "notification.taskCancelled": "Task Cancelled",
        "notification.taskCancelledByClient": "The task \"",
        "notification.taskCancelledByTasker": "The task \"",
        "notification.taskCancelledByYou": "The task \"",
        "notification.taskCompleted": "Task Completed",
        "notification.taskCompletedMessage": "The task \"",
        
        // Verification notifications
        "notification.verificationStatus": "Verification Status",
        "notification.verificationApproved": "Your documents were approved. You're now verified!",
        "notification.verificationDeclined": "Your documents were declined. Please re-upload to get verified."
      },
      ar: {
        // Message notifications
        "notification.newMessage": "رسالة جديدة",
        "notification.newMessageFrom": "رسالة جديدة من ",
        
        // Bid notifications
        "notification.newBid": "عرض جديد على مهمتك",
        "notification.newBidMessage": "تم تقديم عرض جديد على مهمتك \"",
        "notification.hired": "تم توظيفك!",
        "notification.hiredMessage": "تم توظيفك للمهمة \"",
        
        // Review notifications
        "notification.newReview": "تقييم جديد",
        "notification.newReviewMessage": "تلقيت تقييماً من العميل للمهمة \"",
        
        // Task notifications
        "notification.taskCancelled": "تم إلغاء المهمة",
        "notification.taskCancelledByClient": "تم إلغاء المهمة \"",
        "notification.taskCancelledByTasker": "تم إلغاء المهمة \"",
        "notification.taskCancelledByYou": "تم إلغاء المهمة \"",
        "notification.taskCompleted": "تم إنجاز المهمة",
        "notification.taskCompletedMessage": "تم تحديد المهمة \"",
        
        // Verification notifications
        "notification.verificationStatus": "حالة التحقق",
        "notification.verificationApproved": "تم الموافقة على مستنداتك. أنت الآن معتمد!",
        "notification.verificationDeclined": "تم رفض مستنداتك. يرجى إعادة التحميل للحصول على الاعتماد."
      }
    };

    // Get all notifications for this user
    const notifications = await Notification.find({ userId });

    // Update each notification
    for (const notification of notifications) {
      let newTitle = notification.title;
      let newMessage = notification.message;

      // Translate title if it's a translation key
      if (newTitle.startsWith('notification.')) {
        const key = newTitle;
        if (translations[language][key]) {
          newTitle = translations[language][key];
        }
      }

      // Translate message if it's a translation key
      if (newMessage.includes('notification.') && newMessage.includes('|')) {
        const [key, param] = newMessage.split('|');
        if (translations[language][key]) {
          newMessage = translations[language][key] + param + (key.includes('Message') || key.includes('ByClient') || key.includes('ByTasker') || key.includes('ByYou') ? '"' : '');
        }
      } else if (newMessage.startsWith('notification.')) {
        const key = newMessage;
        if (translations[language][key]) {
          newMessage = translations[language][key];
        }
      }

      // Update the notification
      await Notification.findByIdAndUpdate(notification._id, {
        title: newTitle,
        message: newMessage
      });
    }

    res.json({ 
      success: true, 
      message: `Updated ${notifications.length} notifications to ${language}` 
    });
  } catch (err) {
    console.error("❌ Error updating notification language:", err.message);
    res.status(500).json({ error: "Failed to update notification language" });
  }
});

module.exports = router;

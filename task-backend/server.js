const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

dotenv.config();
const app = express();


console.log("✅ Starting to register routes...");

// ✅ Middlewares
app.set("trust proxy", 1); // behind Render/Cloudflare proxies
const allowedOrigins = (process.env.CORS_ORIGINS || "*")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // mobile apps often have no origin
    if (allowedOrigins.includes("*")) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));

// Security headers via Helmet
app.use(
  helmet({
    contentSecurityPolicy: false, // disable if serving static admin pages with inline scripts
    crossOriginResourcePolicy: { policy: "cross-origin" },
    referrerPolicy: { policy: "no-referrer" },
  })
);

// Global rate limiter (baseline)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // max requests per IP per window across API
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", apiLimiter);

// Stricter limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
});

// ✅ Serve static assets (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, "public"))); // serves public/*
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // serve uploaded files

// ✅ Routes
const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");
const messageRoutes = require("./routes/messages");
const bidRoutes = require("./routes/bidRoutes");
const notificationRoutes = require("./routes/notifications");
const reviewRoutes = require("./routes/reviewRoutes");
const adminRoutes = require("./routes/adminRoutes");
const documentRoutes = require("./routes/documents");
const userRoutes = require("./routes/userRoutes");


app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/bids", bidRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/admin", adminRoutes);
console.log("📦 Registering /api/documents routes...");
app.use("/api/documents", documentRoutes);
app.use("/api", userRoutes);
app.use("/api/reports", require("./routes/reportRoutes"));





// ✅ Test route
app.get("/test", (req, res) => {
  res.send("✅ Backend working");
});

// ✅ MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`🚀 Server running on port ${PORT}`)
);

const uploadRoutes = require("./routes/upload");
app.use("/api/upload", uploadRoutes);

const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");
const messageRoutes = require("./routes/messages");
const bidRoutes = require("./routes/bidRoutes");
const notificationRoutes = require("./routes/notifications"); 
const reviewRoutes = require("./routes/reviewRoutes");
const adminRoutes = require("./routes/adminRoutes");
const path = require("path");
const documentRoutes = require("./routes/documents");


app.use(express.static("public")); // ✅ serve static folder
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/bids", bidRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/documents", documentRoutes);


// Test route
app.get("/test", (req, res) => {
  res.send("✅ Backend working");
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public/admin/verification.html"));
});



// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`🚀 Server running on port ${PORT}`)
);

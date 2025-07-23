// app.js - Main server file
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const http = require("http");
const config = require("./src/config/config");
const { connectDatabase } = require("./src/database/connection");
const createTables = require("./src/database/migrations/createTables");

// Import socket initialization
const { initSocket } = require("./src/utils/initSocket");

const app = express();

// Middleware setup
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Create uploads directory if it doesn't exist
const fs = require("fs");
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve static files
app.use("/uploads", express.static(uploadsDir));

// Import routes
const authRoutes = require("./src/routes/auth");
const userRoutes = require("./src/routes/users");
const activityRoutes = require("./src/routes/activities");
const notifyRoutes = require("./src/routes/notify");

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/notify", notifyRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Error:", err.stack);
  res.status(500).json({
    message: err.message || "Something went wrong!",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

const server = http.createServer(app);

// Initialize Socket.IO using the separate initialization function
const io = initSocket(server);

// Make io available to routes
app.set("io", io);

// Initialize database and start server
async function startServer() {
  try {
    await connectDatabase();
    await createTables();
    
    // Start the server
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`🚀 Server started successfully on port ${PORT}!`);
      console.log(`📡 Socket.IO server is ready for connections`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGTERM", () => {
  console.log("📋 SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("📋 SIGINT received, shutting down gracefully");
  process.exit(0);
});

process.on("uncaughtException", (error) => {
  console.error("💥 Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("💥 Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

startServer();

module.exports = app;
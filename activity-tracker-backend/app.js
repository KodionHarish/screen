// //app.js file
// // Updated server.js socket handling section
// const express = require("express");
// const cors = require("cors");
// const cookieParser = require("cookie-parser");
// const path = require("path");
// const http = require("http");
// const { Server } = require("socket.io");
// const config = require("./src/config/config");
// const { connectDatabase } = require("./src/database/connection");
// const createTables = require("./src/database/migrations/createTables");
// const connectedUsers = require("./src/utils/socketStore");

// // ✅ Import enhanced notification handler
// const { 
//   notifyUser, 
//   deliverQueuedNotifications,
//   getPendingNotificationCount 
// } = require("./src/utils/notifyHandler");

// const app = express();

// // Middleware setup (keeping existing middleware)
// app.use(express.json());
// app.use(cookieParser());
// app.use(express.urlencoded({ extended: true }));
// app.use(
//   cors({
//     origin: process.env.CLIENT_URL || "http://localhost:3000",
//     credentials: true,
//   })
// );

// // Create uploads directory if it doesn't exist
// const fs = require("fs");
// const uploadsDir = path.join(__dirname, "uploads");
// if (!fs.existsSync(uploadsDir)) {
//   fs.mkdirSync(uploadsDir, { recursive: true });
// }

// // Serve static files
// app.use("/uploads", express.static(uploadsDir));

// // Import routes
// const authRoutes = require("./src/routes/auth");
// const userRoutes = require("./src/routes/users");
// const activityRoutes = require("./src/routes/activities");
// const notifyRoutes = require("./src/routes/notify");

// // Routes
// app.use("/api/auth", authRoutes);
// app.use("/api/users", userRoutes);
// app.use("/api/activities", activityRoutes);
// app.use("/api/notify", notifyRoutes);

// // Health check
// app.get("/health", (req, res) => {
//   res.json({
//     status: "OK",
//     timestamp: new Date().toISOString(),
//     environment: process.env.NODE_ENV || "development",
//   });
// });

// // 404 handler
// app.use("*", (req, res) => {
//   res.status(404).json({ message: "Route not found" });
// });

// // Global error handler
// app.use((err, req, res, next) => {
//   console.error("Error:", err.stack);
//   res.status(err.status || 500).json({
//     message: err.message || "Something went wrong!",
//     ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
//   });
// });

// const server = http.createServer(app);

// // ✅ Enhanced Socket.IO setup
// const io = new Server(server, {
//   cors: {
//     origin: ["http://localhost:3000", "http://localhost:3001"], // Add admin panel URL
//     credentials: true,
//     methods: ["GET", "POST"]
//   },
// });

// // ✅ Enhanced socket connection handling
// io.on("connection", (socket) => {
//   console.log(`🔌 Socket connected: ${socket.id}`);
  
//   // Handle user connection with userId from query params
//   const userId = parseInt(socket.handshake.query.userId);

//   if (userId && !isNaN(userId)) {
//     // Join user-specific room
//     socket.join(`user-${userId}`);
//     connectedUsers.set(socket.id, userId);
    
//     console.log(`👤 User ${userId} connected with socket ${socket.id}`);
    
//     // Emit status update to all clients
//     io.emit("status-updated", { userId, isOnline: true });
    
//     // ✅ Deliver any queued notifications immediately
//     setTimeout(() => {
//       const deliveredCount = deliverQueuedNotifications(io, userId);
//       if (deliveredCount > 0) {
//         console.log(`📬 Delivered ${deliveredCount} queued notifications to user ${userId}`);
//       }
//     }, 1000); // Small delay to ensure client is ready
//   }

//   // Handle explicit user online event
//   socket.on("user-online", async ({ userId }) => {
//     const targetUserId = parseInt(userId);
    
//     if (!connectedUsers.has(socket.id) && !isNaN(targetUserId)) {
//       connectedUsers.set(socket.id, targetUserId);
//       socket.join(`user-${targetUserId}`);
      
//       console.log(`🟢 User ${targetUserId} explicitly set online`);
//       io.emit("status-updated", { userId: targetUserId, isOnline: true });
      
//       // Deliver queued notifications
//       setTimeout(() => {
//         const deliveredCount = deliverQueuedNotifications(io, targetUserId);
//         if (deliveredCount > 0) {
//           console.log(`📬 Delivered ${deliveredCount} queued notifications to user ${targetUserId}`);
//         }
//       }, 1000);
//     }
//   });

//   // Handle activity logging
//   socket.on("activity-logged", async ({ userId, activityData }) => {
//     console.log(`📊 Activity logged for user ${userId}:`, activityData);
//     // Add your activity logging logic here
//   });

  
//   // ✅ Enhanced notification handling
//   socket.on("notify-user", (payload, callback) => {
//     try {
//       console.log(`📤 Admin notification request:`, payload);
      
//       const result = notifyUser(io, payload);
      
//       console.log(`📋 Notification result:`, result);
      
//       if (callback && typeof callback === 'function') {
//         callback(result);
//       }
//     } catch (error) {
//       console.error('❌ Error in notify-user:', error);
//       if (callback && typeof callback === 'function') {
//         callback({ 
//           success: false, 
//           message: 'Failed to send notification',
//           error: error.message 
//         });
//       }
//     }
//   });

//   // Handle user logout
//   socket.on("user-logout", async ({ userId }) => {
//     const targetUserId = parseInt(userId);
    
//     if (!isNaN(targetUserId)) {
//       // Remove all sockets for this user
//       for (const [sockId, uid] of connectedUsers.entries()) {
//         if (uid === targetUserId) {
//           connectedUsers.delete(sockId);
//         }
//       }
      
//       console.log(`👋 User ${targetUserId} logged out`);
//       io.emit("status-updated", { userId: targetUserId, isOnline: false });
//     }
//   });

//   // ✅ Enhanced disconnect handling
//   socket.on("disconnect", async () => {
//     const userId = connectedUsers.get(socket.id);
//     console.log(`🔌 Socket disconnected: ${socket.id}, User: ${userId}`);

//     if (userId) {
//       // Check if user has other active connections
//       const userStillConnected = [...connectedUsers.values()].includes(userId);
      
//       if (!userStillConnected) {
//         console.log(`🔴 User ${userId} is now completely offline`);
//         io.emit("status-updated", { userId, isOnline: false });
//       }
      
//       // Remove this specific socket
//       connectedUsers.delete(socket.id);
//     }
//   });

//   // ✅ Handle ping/pong for connection health
//   socket.on('ping', () => {
//     socket.emit('pong');
//   });
// });

// // Make io available to routes
// app.set("io", io);

// // Initialize database and start server
// async function startServer() {
//   try {
//     await connectDatabase();
//     await createTables();
    
//     // Start the server
//     const PORT = process.env.PORT || 5000;
//     server.listen(PORT, () => {
//       console.log(`🚀 Server started successfully on port ${PORT}!`);
//       console.log(`📡 Socket.IO server is ready for connections`);
//     });
//   } catch (error) {
//     console.error("❌ Failed to start server:", error.message);
//     console.error(error.stack);
//     process.exit(1);
//   }
// }

// // Handle graceful shutdown
// process.on("SIGTERM", () => {
//   console.log("📋 SIGTERM received, shutting down gracefully");
//   server.close(() => {
//     console.log("Server closed");
//     process.exit(0);
//   });
// });

// process.on("SIGINT", () => {
//   console.log("📋 SIGINT received, shutting down gracefully");
//   process.exit(0);
// });

// process.on("uncaughtException", (error) => {
//   console.error("💥 Uncaught Exception:", error);
//   process.exit(1);
// });

// process.on("unhandledRejection", (reason, promise) => {
//   console.error("💥 Unhandled Rejection at:", promise, "reason:", reason);
//   process.exit(1);
// });

// startServer();

// module.exports = app;


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
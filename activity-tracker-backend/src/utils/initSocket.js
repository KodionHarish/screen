// initSocket.js - Socket.IO initialization and event handling
const { Server } = require("socket.io");
const connectedUsers = require("./socketStore");
const {
  notifyUser,
  deliverQueuedNotifications,
  sendOfflineEmail,
  sharedStore               
} = require("./notifyHandler");

let io;

// Store admin toggle status for offline users
const adminToggleStore = new Map(); // userId -> { toggled: boolean, timestamp: Date }

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: ["https://admin-panel-screen-tracker.vercel.app", "http://localhost:3001"], 
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);
    
    // Handle user connection with userId from query params
    const userId = parseInt(socket.handshake.query.userId);
    console.log(`👤 User attempting to connect: ${userId}`);

    if (userId && !isNaN(userId)) {
      // Join user-specific room
      socket.join(`user-${userId}`);
      connectedUsers.set(socket.id, userId);
      
      console.log(`👤 User ${userId} connected with socket ${socket.id}`);
      
      // Emit status update to all clients
      io.emit("status-updated", { userId, isOnline: true });
      
      // **NEW: Automatically send current admin toggle status**
      setTimeout(() => {
        const adminToggleStatus = getAdminToggleStatus(userId);
        socket.emit("admin-toggle-status", { 
          toggled: adminToggleStatus,
          userId: userId 
        });
        console.log(`🎛️ Auto-sent admin toggle status to user ${userId}: ${adminToggleStatus}`);
      }, 500);
      
      // Deliver any queued notifications immediately
      setTimeout(() => {
        console.log(`🧭 Checking queued messages for user ${userId}...`);
        const delivered = deliverQueuedNotifications(io, userId);
        if (delivered > 0) {
          console.log(`📬 Delivered ${delivered} queued notifications to user ${userId}`);
        } else {
          console.log(`🕳 No queued notifications found for user ${userId}`);
        }
      }, 1000); // Slight delay to allow room registration
    }

    // Handle explicit user online event
    socket.on("user-online", async ({ userId }) => {
      const targetUserId = parseInt(userId);
      
      if (!connectedUsers.has(socket.id) && !isNaN(targetUserId)) {
        connectedUsers.set(socket.id, targetUserId);
        socket.join(`user-${targetUserId}`);
          
        console.log(`🟢 User ${targetUserId} explicitly set online`);
        io.emit("status-updated", { userId: targetUserId, isOnline: true });
        
        // **NEW: Send admin toggle status on explicit online event**
        setTimeout(() => {
          const adminToggleStatus = getAdminToggleStatus(targetUserId);
          socket.emit("admin-toggle-status", { 
            toggled: adminToggleStatus,
            userId: targetUserId 
          });
          console.log(`🎛️ Sent admin toggle status to user ${targetUserId}: ${adminToggleStatus}`);
        }, 500);
        
        // Deliver queued notifications
        setTimeout(() => {
          const deliveredCount = deliverQueuedNotifications(io, targetUserId);
          if (deliveredCount > 0) {
            console.log(`📬 Delivered ${deliveredCount} queued notifications to user ${targetUserId}`);
          }
        }, 1000);
      }
    });

    // **NEW: Handle request for admin toggle status**
    socket.on("request-admin-toggle-status", ({ userId }, callback) => {
      console.log(`🎛️ Admin toggle status requested for user ${userId}`);
      
      try {
        const targetUserId = parseInt(userId);
        const adminToggleStatus = getAdminToggleStatus(targetUserId);
        
        if (callback && typeof callback === 'function') {
          callback({ 
            success: true, 
            toggled: adminToggleStatus,
            userId: targetUserId 
          });
        }
        
        // Also emit the status directly
        socket.emit("admin-toggle-status", { 
          toggled: adminToggleStatus,
          userId: targetUserId 
        });
        
        console.log(`✅ Admin toggle status sent to user ${targetUserId}: ${adminToggleStatus}`);
        
      } catch (error) {
        console.error('❌ Error getting admin toggle status:', error);
        if (callback && typeof callback === 'function') {
          callback({ 
            success: false, 
            message: 'Failed to get admin toggle status',
            error: error.message 
          });
        }
      }
    });

    // Handle activity logging
    socket.on("activity-logged", async ({ userId, activityData }) => {
      console.log(`📊 Activity logged for user ${userId}:`, activityData);
      // Add your activity logging logic here
    });

    // Handle notification from admin
    socket.on("notify-user", (payload, callback) => {
      try {
        console.log(`📤 Admin notification request:`, payload);
        
        const result = notifyUser(io, payload);
        
        console.log(`📋 Notification result:`, result);
        
        if (callback && typeof callback === 'function') {
          callback(result);
        }
      } catch (error) {
        console.error('❌ Error in notify-user:', error);
        if (callback && typeof callback === 'function') {
          callback({ 
            success: false, 
            message: 'Failed to send notification',
            error: error.message 
          });
        }
      }
    });

    // Handle force email sending
    socket.on("force-send-email", async ({ userId }, callback) => {
      try {
        const { offlineNotifications } = sharedStore;
        const messages = offlineNotifications.get(parseInt(userId));
        if (!messages || messages.length === 0) {
          return callback({ success: false, message: "No messages to send." });
        }

        await sendOfflineEmail(userId, messages);
        callback({ success: true });
      } catch (err) {
        callback({ success: false, message: err.message });
      }
    });

    // **UPDATED: Handle admin toggle user event with persistent storage**
    socket.on("admin-toggle-user", ({ userId, toggled }, callback) => {
      console.log(`🎛️ Admin toggle request - User ${userId}: ${toggled}`);
      try {
        const targetUserId = parseInt(userId);
        
        // **NEW: Store the admin toggle status**
        setAdminToggleStatus(targetUserId, toggled);
        
        // Find all socket IDs for the specific user
        const targetUserSocketIds = [...connectedUsers.entries()]
          .filter(([, uid]) => uid === targetUserId)
          .map(([socketId]) => socketId);
        
        console.log(`👤 Found ${targetUserSocketIds.length} active connections for user ${targetUserId}`);
        
        if (targetUserSocketIds.length > 0) {
          // User is online - send directly to their socket(s)
          targetUserSocketIds.forEach(socketId => {
            io.to(socketId).emit("toggle-updated", { userId: targetUserId, toggled });
          });
          console.log(`✅ Toggle update sent directly to user ${targetUserId}'s active connections`);
        } else {
          // User is offline - the status is already stored for when they come online
          console.log(`📤 Toggle status stored for offline user ${targetUserId}`);
        }
        
        // Acknowledge the event back to admin
        if (callback && typeof callback === 'function') {
          callback({ 
            success: true, 
            status: targetUserSocketIds.length > 0 ? "delivered" : "stored", 
            message: `Toggle ${targetUserSocketIds.length > 0 ? 'sent to' : 'stored for'} user ${targetUserId}`,
            activeConnections: targetUserSocketIds.length
          });
        }
      } catch (error) { 
        console.error('❌ Error in admin-toggle-user:', error);
        if (callback && typeof callback === 'function') {
          callback({  
            success: false, 
            message: 'Failed to send toggle update',
            error: error.message 
          });
        }
      }
    });

    // Handle user tracking status updates
    socket.on("user-tracking-status", (data) => {
      console.log(`📊 User tracking status update:`, data);
      
      const { userId, userName, isTracking, adminTrackingEnabled, isOnline } = data;
      
      // Store the status
      connectedUsers.set(parseInt(userId), {
        userId: parseInt(userId),
        userName,
        isTracking, 
        adminTrackingEnabled,
        isOnline,
        lastUpdate: new Date().toISOString()
      });
      
      // Emit to admin dashboard
      io.emit("user-status-update", {
        userId: parseInt(userId),
        userName,
        isTracking,
        adminTrackingEnabled,
        isOnline,
        timestamp: new Date().toISOString()
      });
    });

    // Handle user inactive alerts
    socket.on("user-inactive-alert", (data) => {
      console.log(`🚨 User inactive alert:`, data);
      
      const { userId, userName, message, adminTrackingEnabled, isOnline, isTracking } = data;
      
      // Only send alert if admin tracking is enabled and user is not tracking
      if (adminTrackingEnabled && !isTracking && isOnline) {
        // Emit to admin dashboard
        io.emit("admin-alert", {
          type: "user-inactive",
          userId: parseInt(userId),
          userName,
          message,
          severity: "warning",
          timestamp: new Date().toISOString(),
          data: {
            isOnline,
            isTracking,
            adminTrackingEnabled
          }
        });
        
        console.log(`🚨 Admin alert sent for user ${userId}: ${message}`);
      }
    });

    // Handle admin request for user status
    socket.on("get-user-status", (callback) => {
      const statusArray = Array.from(connectedUsers.values());
      if (callback && typeof callback === 'function') {
        callback(statusArray);
      }
    });

    // Handle admin request for specific user alerts
    socket.on("get-user-alerts", ({ userId }, callback) => {
      const userStatus = connectedUsers.get(parseInt(userId));
      
      if (userStatus && userStatus.adminTrackingEnabled && !userStatus.isTracking && userStatus.isOnline) {
        if (callback && typeof callback === 'function') {
          callback({
            hasAlert: true,
            alert: {
              type: "user-inactive",
              userId: userStatus.userId,
              userName: userStatus.userName,
              message: "User is online but tracking is inactive",
              severity: "warning",
              timestamp: userStatus.lastUpdate
            }
          });
        }
      } else {
        if (callback && typeof callback === 'function') {
          callback({ hasAlert: false });
        }
      }
    });

    // **NEW: Handle admin request for all admin toggle statuses**
    socket.on("get-all-admin-toggle-status", (callback) => {
      try {
        const allStatuses = Array.from(adminToggleStore.entries()).map(([userId, data]) => ({
          userId: parseInt(userId),
          toggled: data.toggled,
          timestamp: data.timestamp
        }));
        
        if (callback && typeof callback === 'function') {
          callback({
            success: true,
            statuses: allStatuses
          });
        }
      } catch (error) {
        console.error('❌ Error getting all admin toggle statuses:', error);
        if (callback && typeof callback === 'function') {
          callback({
            success: false,
            message: 'Failed to get admin toggle statuses',
            error: error.message
          });
        }
      }
    });

    // Clean up user status on disconnect
    socket.on("user-logout", async ({ userId }) => {
      const targetUserId = parseInt(userId);
      
      if (!isNaN(targetUserId)) {
        // Update status to offline
        const userStatus = connectedUsers.get(targetUserId);
        if (userStatus) {
          userStatus.isOnline = false;
          userStatus.lastUpdate = new Date().toISOString();
          connectedUsers.set(targetUserId, userStatus);
        }
        
        // Remove all sockets for this user
        for (const [sockId, uid] of connectedUsers.entries()) {
          if (uid === targetUserId) {
            connectedUsers.delete(sockId);
          }
        }
        
        console.log(`👋 User ${targetUserId} logged out`);
        
        // Emit status update to admin
        io.emit("user-status-update", {
          userId: targetUserId,
          userName: userStatus?.userName || "Unknown",
          isTracking: false,
          adminTrackingEnabled: userStatus?.adminTrackingEnabled || false,
          isOnline: false,
          timestamp: new Date().toISOString()
        });
        
        io.emit("status-updated", { userId: targetUserId, isOnline: false });
      }
    });

    // Handle ping/pong for connection health
    socket.on('ping', () => {
      socket.emit('pong');
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      const userId = connectedUsers.get(socket.id);
      console.log(`🔌 Socket disconnected: ${socket.id}, User: ${userId}`);

      if (userId) {
        // Check if user has other active connections
        const userStillConnected = [...connectedUsers.values()].includes(userId);
        
        if (!userStillConnected) {
          console.log(`🔴 User ${userId} is now completely offline`);
          io.emit("status-updated", { userId, isOnline: false });
        }
        
        // Remove this specific socket
        connectedUsers.delete(socket.id);
      }
    });
  });

  return io;
}

// **NEW: Helper functions to store/retrieve admin toggle status**
function setAdminToggleStatus(userId, toggled) {
  const userIdInt = parseInt(userId);
  adminToggleStore.set(userIdInt, {
    toggled: toggled,
    timestamp: new Date().toISOString()
  });
  
  console.log(`💾 Stored admin toggle status for user ${userIdInt}: ${toggled}`);
  
  // TODO: Persist to database or file for production use
  // Example: await db.query('UPDATE users SET admin_tracking_enabled = ? WHERE id = ?', [toggled, userIdInt]);
}

function getAdminToggleStatus(userId) {
  const userIdInt = parseInt(userId);
  const storedData = adminToggleStore.get(userIdInt);
  
  if (storedData) {
    console.log(`📋 Retrieved admin toggle status for user ${userIdInt}: ${storedData.toggled}`);
    return storedData.toggled;
  }
  
  // Default to false if not set
  console.log(`📋 No admin toggle status found for user ${userIdInt}, defaulting to false`);
  return false;
}

function getAllAdminToggleStatuses() {
  const allStatuses = {};
  for (const [userId, data] of adminToggleStore.entries()) {
    allStatuses[userId] = data.toggled;
  }
  return allStatuses;
}

// Export function to get current user status (for API endpoints)
function getUserTrackingStatus(userId) {
  return connectedUsers.get(parseInt(userId));
}

function getAllUserTrackingStatus() {
  return Array.from(connectedUsers.values());
}

function getIO() {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
}

module.exports = { 
  initSocket, 
  getIO,
  getUserTrackingStatus,
  getAllUserTrackingStatus,
  setAdminToggleStatus,
  getAdminToggleStatus,
  getAllAdminToggleStatuses
};
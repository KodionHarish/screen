// dashboard.js - Fixed version with proper admin toggle functionality
let socket = null;
let currentUserId = null;
const userInfo = document.getElementById("userInfo");
const logoutBtn = document.getElementById("logoutBtn");

// ✅ Tracking control elements
let trackingToggleBtn = null;
let trackingStatusDiv = null;
let trackingTimeDiv = null;
let isTrackingActive = false;

// ✅ Admin tracking control
let adminTrackingEnabled = false; 
let adminToggleBtn = null;
let adminToggleStatus = null;

// ✅ Notification system elements
let notificationIcon = null;
let notificationPanel = null;
let notificationBadge = null;
let notifications = [];
let unreadCount = 0;

// ✅ Time formatting utility
function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

// ✅ Update tracking display
function updateTrackingDisplay(data) {
  if (trackingStatusDiv) {
    trackingStatusDiv.innerHTML = `
      <div class="status-dot ${isTrackingActive ? "active" : "inactive"}"></div>
      <span>${
        isTrackingActive ? "Currently Active" : "Currently Inactive"
      }</span>
    `;
  }

  if (trackingTimeDiv && data.totalTime !== undefined) {
    trackingTimeDiv.innerHTML = `
      <div class="time-value">${formatTime(data.totalTime)}</div>
      <div class="time-label">Total Time</div>
      ${
        data.currentSessionTime > 0
          ? `<div class="session-time">Session: ${formatTime(
              data.currentSessionTime
            )}</div>`
          : ""
      }
    `;
  }

  if (trackingToggleBtn) {
    trackingToggleBtn.textContent = isTrackingActive
      ? "⏹️ Stop Tracking"
      : "🚀 Start Tracking";
    trackingToggleBtn.className = `tracking-button ${
      isTrackingActive ? "stop" : "start"
    }`;
  }
}

// ✅ Update the admin toggle button appearance
function updateAdminToggleButton() {
  const toggleBtn = document.getElementById("adminToggleBtn");
  const toggleStatus = document.getElementById("adminToggleStatus");

  if (toggleBtn && toggleStatus) {
    if (adminTrackingEnabled) {
      toggleBtn.classList.add("enabled");
      toggleBtn.classList.remove("disabled");
      toggleStatus.textContent = "Tracking Enabled";
      toggleStatus.className = "toggle-status enabled";
    } else {
      toggleBtn.classList.add("disabled");
      toggleBtn.classList.remove("enabled");
      toggleStatus.textContent = "Tracking Disabled";
      toggleStatus.className = "toggle-status disabled";
    }
  }
}

// ✅ Handle tracking toggle
async function toggleTracking() {
  // Check if admin has disabled tracking
  if (!adminTrackingEnabled && !isTrackingActive) {
    addNotification(
      "Tracking Disabled",
      "Admin has disabled tracking. Please contact admin to enable it.",
      "warning"
    );
    return;
  }

  try {
    trackingToggleBtn.disabled = true;
    trackingToggleBtn.textContent = "Processing...";

    const result = await window.electronAPI.toggleTracking();

    if (result.success) {
      isTrackingActive = result.isActive;
      
      updateTrackingDisplay({ totalTime: result.totalTime });
      console.log(`✅ Tracking ${isTrackingActive ? "started" : "stopped"}`);
      
      // After tracking status is fetched
      if (!isTrackingActive && adminTrackingEnabled && socket && currentUserId) {
        socket.emit("user-inactive-alert", {
          userId: currentUserId,
          message: "User is online but tracking is inactive.",
        });
      }

      // Emit tracking status to server
      if (socket && currentUserId) {
        socket.emit("user-tracking-status", {
          userId: currentUserId,
          isTracking: isTrackingActive,
        });
      }
    } else {
      console.error("❌ Failed to toggle tracking:", result.error);
      addNotification(
        "Error",
        "Failed to toggle tracking. Please try again.",
        "error"
      );
    }
  } catch (error) {
    console.error("❌ Error toggling tracking:", error);
    addNotification("Error", "An error occurred. Please try again.", "error");
  } finally {
    trackingToggleBtn.disabled = false;
  }
}

// ✅ Handle memo input changes
async function handleMemoChange(event) {
  const memoText = event.target.value.trim();
  try {
    await window.electronAPI.setMemo(memoText);
    console.log("✅ Memo updated:", memoText);
  } catch (error) {
    console.error("❌ Error updating memo:", error);
  }
}

// ✅ Add notification function
function addNotification(title, message, type = "info") {
  const notification = {
    id: Date.now(),
    title,
    message,
    type,
    timestamp: new Date(),
    read: false,
  };

  notifications.unshift(notification);
  if (!notification.read) {
    unreadCount++;
  }
  updateNotificationUI();
  updateNotificationBadge();
}

// ✅ Update notification UI
function updateNotificationUI() {
  const notificationsList = document.querySelector(".notifications-list");
  if (!notificationsList) return;

  if (notifications.length === 0) {
    notificationsList.innerHTML = `
      <div class="no-notifications">
        <div class="no-notifications-icon">🔔</div>
        <p>No notifications yet</p>
      </div>
    `;
    return;
  }

  notificationsList.innerHTML = notifications
    .map(
      (notif) => `
      <div class="notification-item ${notif.type} ${
        notif.read ? "read" : "unread"
      }" data-id="${notif.id}">
        <div class="notification-content">
          <div class="notification-header">
            <span class="notification-title">${notif.title}</span>
            <span class="notification-time">${formatTimestamp(
              notif.timestamp
            )}</span>
          </div>
          <div class="notification-message">${notif.message}</div>
        </div>
        <div class="notification-actions">
          ${
            !notif.read
              ? `<button class="mark-read-btn" onclick="markAsRead(${notif.id})">✓</button>`
              : ""
          }
          <button class="delete-notification-btn" onclick="deleteNotification(${
            notif.id
          })">🗑️</button>
        </div>
      </div>
    `
    )
    .join("");
}

// ✅ Update notification badge
function updateNotificationBadge() {
  const badge = document.getElementById("notificationBadge");
  if (badge) {
    if (unreadCount > 0) {
      badge.textContent = unreadCount;
      badge.style.display = "flex";
    } else {
      badge.style.display = "none";
    }
  }
}

// ✅ Format notification timestamp
function formatTimestamp(date) {
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

// ✅ Toggle notification panel
function toggleNotificationPanel() {
  const panel = document.getElementById("notificationPanel");
  if (panel) {
    panel.style.display = panel.style.display === "none" ? "block" : "none";
  }
}

// ✅ Mark notification as read
function markAsRead(notificationId) {
  const notification = notifications.find((n) => n.id === notificationId);
  if (notification && !notification.read) {
    notification.read = true;
    unreadCount = Math.max(0, unreadCount - 1);
    updateNotificationBadge();
    updateNotificationUI();
  }
}

// ✅ Mark all notifications as read
function markAllAsRead() {
  notifications.forEach((notification) => {
    if (!notification.read) {
      notification.read = true;
    }
  });
  unreadCount = 0;
  updateNotificationBadge();
  updateNotificationUI();
}

// ✅ Delete notification
function deleteNotification(notificationId) {
  const index = notifications.findIndex((n) => n.id === notificationId);
  if (index !== -1) {
    const notification = notifications[index];
    if (!notification.read) {
      unreadCount = Math.max(0, unreadCount - 1);
    }
    notifications.splice(index, 1);
    updateNotificationBadge();
    updateNotificationUI();
  }
}

// ✅ Clear all notifications
function clearAllNotifications() {
  notifications = [];
  unreadCount = 0;
  updateNotificationUI();
  updateNotificationBadge();
}

// ✅ Show admin tracking banner
function showAdminTrackingBanner(message) {
  const banner = document.getElementById("adminToggleBanner");
  if (banner && message.trim()) {
    banner.innerHTML = message;
    banner.style.display = "block";
    banner.style.opacity = "1";

    setTimeout(() => {
      banner.style.opacity = "0";
      setTimeout(() => {
        banner.style.display = "none";
      }, 500);
    }, 5000);
  }
}
// dashboard.js - Updated connection handling

function initializeSocket(userId) {
  currentUserId = userId;

  socket = io("http://localhost:5000", {
    query: { userId: userId },
    withCredentials: true,
  });

  // Handle connection events
  socket.on("connect", () => {
    console.log("✅ Connected to server");
    
    // Emit user online status
    socket.emit("user-online", { userId: currentUserId });

    // **UPDATED: Request current admin toggle status with callback**
    socket.emit("request-admin-toggle-status", { userId: currentUserId }, (response) => {
      if (response && response.success) {
        console.log("📊 Received admin toggle status from callback:", response.toggled);
        adminTrackingEnabled = response.toggled;
        localStorage.setItem(`adminTracking_${currentUserId}`, adminTrackingEnabled.toString());
        updateAdminToggleButton();
        
        // Check if we need to emit an alert immediately
        if (adminTrackingEnabled && !isTrackingActive) {
          socket.emit("user-inactive-alert", {
            userId: currentUserId,
            message: "User is online but tracking is inactive",
            adminTrackingEnabled: true,
            isOnline: true,
            isTracking: false,
            timestamp: new Date().toISOString()
          });
        }
      } else {
        console.warn("⚠️ Failed to get admin toggle status from callback");
        // Fallback to localStorage
        const savedStatus = localStorage.getItem(`adminTracking_${currentUserId}`);
        adminTrackingEnabled = savedStatus ? savedStatus === 'true' : false;
        updateAdminToggleButton();
      }
    });
  });

  socket.on("disconnect", () => {
    console.log("❌ Disconnected from server");
  });

  // **UPDATED: Handle admin toggle status (with fallback)**
  socket.on("admin-toggle-status", ({ toggled, userId }) => {
    console.log("📊 Admin toggle status received:", toggled, "for user:", userId);
    
    if (userId === currentUserId || !userId) {
      adminTrackingEnabled = toggled;
      localStorage.setItem(`adminTracking_${currentUserId}`, adminTrackingEnabled.toString());
      updateAdminToggleButton();
      
      // Show a banner notification to user
      if (toggled) {
        showAdminTrackingBanner("📊 Admin tracking has been enabled for your account");
      } else {
        showAdminTrackingBanner("📊 Admin tracking has been disabled for your account");
      }
      
      // Emit current tracking status
      if (socket) {
        socket.emit("user-tracking-status", {
          userId: currentUserId,
          isTracking: isTrackingActive,
          adminTrackingEnabled: adminTrackingEnabled,
          isOnline: true,
          timestamp: new Date().toISOString()
        });
        
        // If admin tracking is enabled but user is not tracking, send alert
        if (adminTrackingEnabled && !isTrackingActive) {
          socket.emit("user-inactive-alert", {
            userId: currentUserId,
            message: "User is online but tracking is inactive",
            adminTrackingEnabled: true,
            isOnline: true,
            isTracking: false,
            timestamp: new Date().toISOString()
          });
        }
      }
    }
  });

  // Handle admin notifications
  socket.on("notify-message", (notification) => {
    console.log("📥 Received notification:", notification);
    addNotification(
      notification.title || "Admin Message",
      notification.message,
      "admin"
    );
  });

  // Handle status updates
  socket.on("status-updated", (data) => {
    console.log("📊 Status updated:", data);
  });

  // **UPDATED: Listen for admin toggle updates**
  socket.on("toggle-updated", (data) => {
    console.log("🎛️ Admin toggle update received:", data);
    
    if (data.userId === currentUserId) {
      const previousStatus = adminTrackingEnabled;
      adminTrackingEnabled = data.toggled;
      
      // Store in localStorage
      localStorage.setItem(`adminTracking_${currentUserId}`, adminTrackingEnabled.toString());
      
      // Update UI
      updateAdminToggleButton();
      
      // Show notification about the change
      if (previousStatus !== adminTrackingEnabled) {
        if (adminTrackingEnabled) {
          showAdminTrackingBanner("📊 Admin tracking has been enabled for your account");
        } else {
          showAdminTrackingBanner("📊 Admin tracking has been disabled for your account");
        }
      }
      
      // Emit status update
      if (socket) {
        socket.emit("user-tracking-status", {
          userId: currentUserId,
          isTracking: isTrackingActive,
          adminTrackingEnabled: adminTrackingEnabled,
          isOnline: true,
          timestamp: new Date().toISOString()
        });

        // If admin tracking is now enabled but user is not tracking, send alert
        if (adminTrackingEnabled && !isTrackingActive) {
          socket.emit("user-inactive-alert", {
            userId: currentUserId,
            message: "User is online but tracking is inactive",
            adminTrackingEnabled: true,
            isOnline: true,
            isTracking: false,
            timestamp: new Date().toISOString()
          });
        }
      }
    }
  });

  // Enhanced tracking status monitoring
  function checkAndEmitTrackingStatus() {
    if (adminTrackingEnabled && !isTrackingActive && socket && currentUserId) {
      socket.emit("user-inactive-alert", {
        userId: currentUserId,
        message: "User is online but tracking is inactive",
        adminTrackingEnabled: true,
        isOnline: true,
        isTracking: false,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Check status periodically when admin tracking is enabled
  setInterval(() => {
    if (adminTrackingEnabled && socket && currentUserId) {
      checkAndEmitTrackingStatus();
    }
  }, 1000000); 

  // Handle tracking status changes
  window.electronAPI.onTrackingStatusChanged((data) => {
    console.log("📊 Tracking status changed:", data);
    isTrackingActive = data.isActive;
    updateTrackingDisplay(data);  

    // Emit the enhanced status
    if (socket && currentUserId) {
      socket.emit("user-tracking-status", { 
        userId: currentUserId,
        userName: data.name,
        isTracking: isTrackingActive,
        adminTrackingEnabled: adminTrackingEnabled,
        isOnline: true,
        timestamp: new Date().toISOString()
      });

      // Emit alert if tracking is inactive but admin tracking is enabled
      if (!isTrackingActive && adminTrackingEnabled) {
        socket.emit("user-inactive-alert", {
          userId: currentUserId,
          userName: data.name,
          message: "User is online but tracking is inactive",
          adminTrackingEnabled: true,
          isOnline: true,
          isTracking: false,  
          timestamp: new Date().toISOString()
        });
      }
    }
  });

  // Handle connection errors
  socket.on("connect_error", (error) => {
    console.error("❌ Socket connection error:", error);
  });
}

// ✅ Create notification styles
function createNotificationStyles() {
  const style = document.createElement("style");
  style.textContent = `
    /* Notification Icon Styles */
    .notification-icon-container {
      position: relative;
      cursor: pointer;
      padding: 8px;
      border-radius: 8px;
      transition: background-color 0.2s ease;
      margin-right: 12px;
    }
    
    .notification-icon-container:hover {
      background-color: rgba(0, 123, 255, 0.1);
    }
    
    .notification-icon {
      font-size: 20px;
      color: #007bff;
    }
    
    .notification-badge {
      position: absolute;
      top: -2px;
      right: -2px;
      background: #dc3545;
      color: white;
      font-size: 10px;
      font-weight: bold;
      padding: 2px 6px;
      border-radius: 10px;
      min-width: 16px;
      height: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }
    
    /* Notification Panel Styles */
    .notification-panel {
      position: absolute;
      top: 50px;
      right: 20px;
      width: 380px;
      max-height: 500px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
      border: 1px solid #e0e0e0;
      z-index: 1000;
      display: none;
      overflow: hidden;
    }
    
    .notification-panel-header {
      padding: 16px 20px;
      border-bottom: 1px solid #f0f0f0;
      background: #f8f9fa;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .notification-panel-title {
      font-size: 16px;
      font-weight: 600;
      color: #333;
    }
    
    .notification-panel-actions {
      display: flex;
      gap: 8px;
    }
    
    .clear-all-btn {
      background: #6c757d;
      color: white;
      border: none;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }
    
    .clear-all-btn:hover {
      background: #545b62;
    }
    
    .notifications-list {
      max-height: 400px;
      overflow-y: auto;
    }
    
    .notification-item {
      padding: 16px 20px;
      border-bottom: 1px solid #f0f0f0;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      transition: background-color 0.2s ease;
    }
    
    .notification-item:hover {
      background-color: #f8f9fa;
    }
    
    .notification-item.unread {
      background-color: #e7f3ff;
      border-left: 3px solid #007bff;
    }
    
    .notification-content {
      flex: 1;
      margin-right: 12px;
    }
    
    .notification-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }
    
    .notification-title {
      font-weight: 600;
      color: #333;
      font-size: 14px;
    }
    
    .notification-time {
      font-size: 12px;
      color: #666;
    }
    
    .notification-message {
      color: #555;
      font-size: 13px;
      line-height: 1.4;
    }
    
    .notification-actions {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    
    .mark-read-btn, .delete-notification-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      font-size: 12px;
      transition: background-color 0.2s ease;
    }
    
    .mark-read-btn {
      color: #28a745;
    }
    
    .mark-read-btn:hover {
      background-color: rgba(40, 167, 69, 0.1);
    }
    
    .delete-notification-btn {
      color: #dc3545;
    }
    
    .delete-notification-btn:hover {
      background-color: rgba(220, 53, 69, 0.1);
    }
    
    .no-notifications {
      text-align: center;
      padding: 40px 20px;
      color: #666;
    }
    
    .no-notifications-icon {
      font-size: 32px;
      margin-bottom: 12px;
      opacity: 0.5;
    }
    
    .no-notifications p {
      margin: 0;
      font-size: 14px;
    }
    
    /* Admin Toggle Styles */
    .admin-toggle-section {
      margin-top: 20px;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
      border: 1px solid #e9ecef;
    }
    
    .admin-toggle-header {
      display: flex;
      align-items: center;
      margin-bottom: 10px;
    }
    
    .admin-toggle-icon {
      font-size: 20px;
      margin-right: 10px;
    }
    
    .admin-toggle-title {
      margin: 0;
      color: #333;
      font-size: 16px;
    }
    
    .admin-toggle-description {
      margin: 0 0 15px 0;
      color: #666;
      font-size: 14px;
    }
    
    .admin-toggle-control {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .toggle-status {
      font-weight: 600;
      font-size: 14px;
      margin-bottom: 4px;
    }
    
    .toggle-status.enabled {
      color: #28a745;
    }
    
    .toggle-status.disabled {
      color: #dc3545;
    }
    
    .toggle-info {
      font-size: 12px;
      color: #666;
    }
    
    .admin-toggle-btn {
      width: 60px;
      height: 30px;
      border: none;
      border-radius: 15px;
      position: relative;
      cursor: not-allowed;
      transition: background-color 0.3s ease;
    }
    
    .admin-toggle-btn.enabled {
      background-color: #28a745;
    }
    
    .admin-toggle-btn.disabled {
      background-color: #dc3545;
    }
    
    .admin-toggle-btn::after {
      content: '';
      position: absolute;
      top: 2px;
      right: 30px;
      width: 26px;
      height: 26px;
      background: white;
      border-radius: 50%;
      transition: transform 0.3s ease;
    }
    
    .admin-toggle-btn.enabled::after {
      transform: translateX(30px);
    }
    
    .admin-toggle-btn.disabled::after {
      transform: translateX(2px);
    }
    
    /* Header section styling */
    .header-sec {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .header-sec .header h1 {
      margin: 0 0 0.5rem 0;
      color: #333;
      font-size: 2rem;
    }
    
    .header-sec .header p {
      margin: 0;
      color: #666;
      font-size: 1rem;
    }
    
    .logout-section {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .logout-button {
      background: #dc3545;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: background-color 0.2s ease;
    }
    
    .logout-button:hover {
      background: #c82333;
    }
    
    .admin-banner {
      margin: 0 auto 1rem auto;
      padding: 12px 16px;
      background-color: #d1ecf1;
      color: #0c5460;
      border-left: 4px solid #17a2b8;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      transition: opacity 0.5s ease;
      max-width: 90%;
      width: fit-content;
      display: none;
      overflow: hidden;
    }
  `;

  document.head.appendChild(style);
}

// ✅ Main initialization function
(async () => {
  try {
    console.log("🚀 Starting dashboard initialization...");

    const token = await window.electronAPI.getToken();
    if (!token) {
      console.log("❌ No token found, redirecting to login");
      window.location.href = "login.html";
      return;
    }

    // Load user profile
    const res = await fetch("http://localhost:5000/api/users/profile", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error("Failed to load user profile");
    }

    const jsonData = await res.json();
    const data = jsonData.data;
    console.log(data,"data in console")
    // Get current user ID
    const userId = await window.electronAPI.getUserId();
    console.log("👤 Current user ID:", userId);

    // Initialize admin tracking state from localStorage
    const storedAdminTracking = localStorage.getItem(`adminTracking_${userId}`);
    adminTrackingEnabled = storedAdminTracking === "false";
    console.log("🔧 Admin tracking enabled:", adminTrackingEnabled);

    // Initialize socket connection
    initializeSocket(userId);

    // Get current tracking status
    const trackingStatus = await window.electronAPI.getTrackingStatus();
    console.log("📊 Current tracking status:", trackingStatus);
    isTrackingActive = trackingStatus.isActive;

    // Create notification styles
    createNotificationStyles();

    // Render dashboard UI with notification system
    userInfo.innerHTML = `
      <div class="dashboard-container">
        <div class="header-sec">
          <div class="header">
            <h3>✨ Welcome Back, ${data.name}!</h3>
            <p>Track your productivity with style</p>
          </div>
          <div class="logout-section">
            <div class="notification-icon-container" id="notificationIcon">
              <span class="notification-icon">🔔</span>
              <span class="notification-badge" id="notificationBadge" style="display: none;">0</span>
            </div>
            <button class="logout-button" id="logoutBtn">
              🚪 Logout
            </button>
          </div>
        </div>
        
        <!-- Notification Panel -->
        <div class="notification-panel" id="notificationPanel">
          <div class="notification-panel-header">
            <span class="notification-panel-title">Notifications</span>
            <div class="notification-panel-actions">
              <button class="clear-all-btn" onclick="clearAllNotifications()">Clear All</button>
            </div>
          </div>
          <div class="notifications-list">
            <div class="no-notifications">
              <div class="no-notifications-icon">🔔</div>
              <p>No notifications yet</p>
            </div>
          </div>
        </div>
        
        <div id="adminToggleBanner" class="admin-banner"></div>
          
        <div class="content">
          <div class="user-card">
            <h3><span class="icon">👤</span> Profile</h3>
            <div class="user-info">
              <div class="info-item">
                <span class="info-label">Name:</span>
                <span class="info-value">${data.name}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Email:</span>
                <span class="info-value">${data.email}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Role:</span>
                <span class="info-value">${data.designation}</span>
              </div>
            </div>
            
            <!-- Admin Toggle Section -->
            <div class="admin-toggle-section">
              <div class="admin-toggle-control">
                <div>
                  <div id="adminToggleStatus" class="toggle-status disabled">Tracking Disabled</div>
                  <div class="toggle-info">Current admin preference</div>
                </div>
                <button id="adminToggleBtn" class="admin-toggle-btn disabled" disabled>
                </button>
              </div>
            </div>
          </div>

          <div class="tracking-card">
            <div class="time-display" id="trackingTimeDisplay">
              <div class="time-value">${formatTime(
                trackingStatus.totalTime || 0
              )}</div>
              <div class="time-label">Total Time</div>
            </div>
            
            <button class="tracking-button ${
              isTrackingActive ? "stop" : "start"
            }" id="trackingToggleBtn">
              ${isTrackingActive ? "⏹️ Stop Tracking" : "🚀 Start Tracking"}
            </button>
            
            <div class="status-indicator ${
              isTrackingActive ? "active" : "inactive"
            }" id="trackingStatusDisplay">
              <div class="status-dot ${
                isTrackingActive ? "active" : "inactive"
              }"></div>
              <span>${
                isTrackingActive ? "Currently Active" : "Currently Inactive"
              }</span>
            </div>
          </div>

          <div class="memo-card">
            <h3><span class="icon">📝</span> What are you working on?</h3>
            <textarea 
              id="memoInput"
              class="memo-input" 
              placeholder="Describe your current task or project..."
              rows="3"
            ></textarea>
          </div>
        </div>
      </div>
    `;

    // Update admin toggle button initial state
    updateAdminToggleButton();

    // Get references to elements
    trackingToggleBtn = document.getElementById("trackingToggleBtn");
    trackingStatusDiv = document.getElementById("trackingStatusDisplay");
    trackingTimeDiv = document.getElementById("trackingTimeDisplay");
    notificationIcon = document.getElementById("notificationIcon");
    notificationPanel = document.getElementById("notificationPanel");
    notificationBadge = document.getElementById("notificationBadge");
    adminToggleBtn = document.getElementById("adminToggleBtn");
    adminToggleStatus = document.getElementById("adminToggleStatus");
    const memoInput = document.getElementById("memoInput");
    const newLogoutBtn = document.getElementById("logoutBtn");

    // Set up notification icon click handler
    if (notificationIcon) {
      notificationIcon.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleNotificationPanel();
      });
    }

    // Close notification panel when clicking outside
    document.addEventListener("click", (e) => {
      if (
        notificationPanel &&
        notificationPanel.style.display === "block" &&
        !notificationPanel.contains(e.target) &&
        !notificationIcon.contains(e.target)
      ) {
        notificationPanel.style.display = "none";
      }
    });

    // Set up memo input handler
    if (memoInput) {
      memoInput.addEventListener("input", handleMemoChange);

      // Load existing memo if any
      try {
        const existingMemo = await window.electronAPI.getMemo();
        if (existingMemo) {
          memoInput.value = existingMemo;
        }
      } catch (error) {
        console.error("❌ Error loading existing memo:", error);
      }
    }

    // Add event listener to toggle button
    if (trackingToggleBtn) {
      trackingToggleBtn.addEventListener("click", toggleTracking);
    }

    // Set up logout handler
    if (newLogoutBtn) {
      newLogoutBtn.addEventListener("click", async () => {
        try {
          console.log("🚪 Logging out user...");

          // Emit logout event to socket
          if (socket && currentUserId) {
            socket.emit("user-logout", { userId: currentUserId });
          }

          // Clear token and disconnect socket
          await window.electronAPI.clearToken();
          if (socket) {
            socket.disconnect();
          }

          // Remove event listeners
          window.electronAPI.removeAllListeners();

          // Redirect to login
          window.location.href = "login.html";
        } catch (error) {
          console.error("❌ Error during logout:", error);
          window.location.href = "login.html";
        }
      });
    }

    // ✅ Listen for tracking status changes from electron
    window.electronAPI.onTrackingStatusChanged((data) => {
      console.log("📊 Tracking status changed:", data);
      isTrackingActive = data.isActive;
      updateTrackingDisplay(data);

      if (!isTrackingActive && adminTrackingEnabled && socket && currentUserId) {
        socket.emit("user-inactive-alert", {
          userId: currentUserId,
          message: "User is online but tracking is inactive.",
        });
      }

      // Emit status to server
      if (socket && currentUserId) {
        socket.emit("user-tracking-status", {
          userId: currentUserId,
          isTracking: isTrackingActive,
        });
      }
    });

    // ✅ Listen for real-time time updates
    window.electronAPI.onTrackingTimeUpdate((data) => {
      updateTrackingDisplay(data);
    });

    console.log("✅ Dashboard loaded successfully");

    // Add a welcome notification for testing
    setTimeout(() => {
      addNotification(
        "Welcome!",
        `Hello ${data.name}! Your dashboard is ready.`,
        "info"
      );
    }, 1000);
  } catch (err) {
    console.error("❌ Error loading dashboard:", err);
    addNotification(
      "Error",
      "Failed to load dashboard. Redirecting to login...",
      "error"
    );
    setTimeout(() => {
      window.location.href = "login.html";
    }, 2000);
  }
})();

// ✅ Clean up event listeners and socket when page unloads
window.addEventListener("beforeunload", () => {
  if (socket) {
    socket.disconnect();
  }
  if (window.electronAPI && window.electronAPI.removeAllListeners) {
    window.electronAPI.removeAllListeners();
  }
});

// ✅ Handle page visibility changes (when user minimizes/maximizes window)
document.addEventListener("visibilitychange", () => {
  if (socket && currentUserId) {
    if (document.hidden) {
      console.log("🔄 Page hidden, maintaining socket connection");
    } else {
      console.log("🔄 Page visible, ensuring socket connection");
      if (!socket.connected) {
        socket.connect();
      }
    }
  }
});

// Make functions available globally for onclick handlers
window.markAsRead = markAsRead;
window.deleteNotification = deleteNotification;
window.clearAllNotifications = clearAllNotifications;
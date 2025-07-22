const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // Authentication
  setToken: (token) => ipcRenderer.send("set-token", token),
  setUserId: (userId) => ipcRenderer.send("set-user-id", userId),
  clearToken: () => ipcRenderer.send("clear-token"),
  getToken: () => ipcRenderer.invoke("get-token"),
  getUserId: () => ipcRenderer.invoke("get-user-id"),
  
 onToggleUpdated: (callback) => {
  ipcRenderer.on("toggle-updated", (event, data) => callback(data));
},

  // Tracking control
  getTrackingStatus: () => ipcRenderer.invoke("get-tracking-status"),
  toggleTracking: () => ipcRenderer.invoke("toggle-tracking"),
   showNotification: (title, message) => {
    return ipcRenderer.invoke('show-notification', { title, message });
  },
  // Memo functions
  setMemo: (memoText) => ipcRenderer.invoke("set-memo", memoText),
  getMemo: () => ipcRenderer.invoke("get-memo"),
  
  // ✅ Enhanced: Detailed tracking stats
  getDetailedTrackingStats: () => ipcRenderer.invoke("get-detailed-tracking-stats"),
  
  // Event listeners
  onTrackingStatusChanged: (callback) => {
    ipcRenderer.on("tracking-status-changed", (event, data) => callback(data));
  },
  
  onTrackingTimeUpdate: (callback) => {
    ipcRenderer.on("tracking-time-update", (event, data) => callback(data));
  },
  
  // ✅ Enhanced: Real-time detailed tracking event listeners
  onKeyPressUpdate: (callback) => {
    ipcRenderer.on("key-press-update", (event, data) => callback(data));
  },
  
  onMouseClickUpdate: (callback) => {
    ipcRenderer.on("mouse-click-update", (event, data) => callback(data));
  },
  
  // ✅ NEW: Additional event listeners for detailed tracking
  onDetailedStatsUpdate: (callback) => {
    ipcRenderer.on("detailed-stats-update", (event, data) => callback(data));
  },
  
  // ✅ NEW: Request current detailed stats
  requestDetailedStats: () => ipcRenderer.invoke("get-detailed-tracking-stats"),
  
  // Cleanup
  removeAllListeners: () => {
    ipcRenderer.removeAllListeners("tracking-status-changed");
    ipcRenderer.removeAllListeners("tracking-time-update");
    ipcRenderer.removeAllListeners("key-press-update");
    ipcRenderer.removeAllListeners("mouse-click-update");
    ipcRenderer.removeAllListeners("detailed-stats-update");
  },
//   // ✅ NEW: Utility functions for the renderer
  formatTime: (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  },
  
  // ✅ NEW: Get most pressed keys
  getTopKeys: (keyPressDetails, limit = 10) => {
    return Object.entries(keyPressDetails)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([key, count]) => ({ key, count }));
  }
});



// const { contextBridge, ipcRenderer } = require("electron");

// // Import all modules at the top level
// let utils, notifications, tracking, admin, socket, styles;

// (async () => {
//   try {
//     // Load all modules
//     utils = await import("./renderer/js/dashboard/utils.mjs");
//     notifications = await import("./renderer/js/dashboard/notifications.mjs");
//     tracking = await import("./renderer/js/dashboard/tracking.mjs");
//     admin = await import("./renderer/js/dashboard/admin.mjs");
//     socket = await import("./renderer/js/dashboard/socket.mjs");
//     styles = await import("./renderer/js/dashboard/styles.mjs");
    
//     console.log("All modules loaded successfully");
    
//     // Set up formatter for notifications
//     notifications.setFormatter((date) => utils.formatTimestamp(date));

//     // Now expose the API after all modules are loaded
//     contextBridge.exposeInMainWorld("electronAPI", {
//       // ✅ Auth
//       setToken: (token) => ipcRenderer.send("set-token", token),
//       setUserId: (userId) => ipcRenderer.send("set-user-id", userId),
//       clearToken: () => ipcRenderer.send("clear-token"),
//       getToken: () => ipcRenderer.invoke("get-token"),
//       getUserId: () => ipcRenderer.invoke("get-user-id"),

//       // ✅ Admin Toggle Events
//       onToggleUpdated: (callback) => ipcRenderer.on("toggle-updated", (_, data) => callback(data)),

//       // ✅ Tracking Controls
//       getTrackingStatus: () => ipcRenderer.invoke("get-tracking-status"),
//       toggleTracking: () => ipcRenderer.invoke("toggle-tracking"),

//       // ✅ Notifications (from notifications.mjs)
//       addNotification: (...args) => notifications.addNotification(...args),
//       updateNotificationUI: () => notifications.updateNotificationUI(),
//       updateNotificationBadge: () => notifications.updateNotificationBadge(),
//       toggleNotificationPanel: () => notifications.toggleNotificationPanel(),
//       markAsRead: (id) => notifications.markAsRead(id),
//       deleteNotification: (id) => notifications.deleteNotification(id),
//       clearAllNotifications: () => notifications.clearAllNotifications(),
//       createNotificationStyles: () => styles.createNotificationStyles(),

//       // ✅ Memo API
//       setMemo: (memoText) => ipcRenderer.invoke("set-memo", memoText),
//       getMemo: () => ipcRenderer.invoke("get-memo"),

//       // ✅ Real-time Events
//       onTrackingStatusChanged: (cb) => ipcRenderer.on("tracking-status-changed", (_, data) => cb(data)),
//       onTrackingTimeUpdate: (cb) => ipcRenderer.on("tracking-time-update", (_, data) => cb(data)),
//       onKeyPressUpdate: (cb) => ipcRenderer.on("key-press-update", (_, data) => cb(data)),
//       onMouseClickUpdate: (cb) => ipcRenderer.on("mouse-click-update", (_, data) => cb(data)),
//       onDetailedStatsUpdate: (cb) => ipcRenderer.on("detailed-stats-update", (_, data) => cb(data)),

//       // ✅ Tracking module
//       initializeTrackingElements: () => tracking.initializeTrackingElements(),
//       updateTrackingDisplay: (data) => tracking.updateTrackingDisplay(data),
//       setTrackingState: (state) => tracking.setTrackingState(state),
//       getTrackingState: () => tracking.getTrackingState(),
//       setAdminTrackingEnabledTracker: (val) => tracking.setAdminTrackingEnabled(val),

//       // ✅ Admin module
//       updateAdminToggleButton: () => admin.updateAdminToggleButton(),
//       showAdminTrackingBanner: (msg) => admin.showAdminTrackingBanner(msg),
//       setAdminTrackingEnabledAdmin: (val) => admin.setAdminTrackingEnabled(val),
//       getAdminTrackingEnabled: () => admin.getAdminTrackingEnabled(),

//       // ✅ Stats
//       getDetailedTrackingStats: () => ipcRenderer.invoke("get-detailed-tracking-stats"),
//       requestDetailedStats: () => ipcRenderer.invoke("get-detailed-tracking-stats"),
//       getTopKeys: (keyPressDetails, limit = 10) => {
//         return Object.entries(keyPressDetails)
//           .sort(([, a], [, b]) => b - a)
//           .slice(0, limit)
//           .map(([key, count]) => ({ key, count }));
//       },

//       // ✅ Utils
//       formatTime: (seconds) => utils.formatTime(seconds),
//       formatTimestamp: (date) => utils.formatTimestamp(date),

//       // ✅ Socket module
//       initializeSocket: (userId) => socket.initializeSocket(userId),

//       // ✅ Cleanup
//       removeAllListeners: () => {
//         ipcRenderer.removeAllListeners("tracking-status-changed");
//         ipcRenderer.removeAllListeners("tracking-time-update");
//         ipcRenderer.removeAllListeners("key-press-update");
//         ipcRenderer.removeAllListeners("mouse-click-update");
//         ipcRenderer.removeAllListeners("detailed-stats-update");
//       }
//     });

//     // Signal to the renderer that the API is ready
//     window.postMessage({ type: 'ELECTRON_API_READY' }, '*');

//   } catch (error) {
//     console.error("Error loading modules:", error);
//   }
// })();

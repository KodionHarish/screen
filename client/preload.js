const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {


  // Authentication
  setToken: (token) => ipcRenderer.send("set-token", token),
  setUserId: (userId) => ipcRenderer.send("set-user-id", userId),
  clearToken: () => ipcRenderer.invoke("clear-token"),
  getToken: () => ipcRenderer.invoke("get-token"),
  getUserId: () => ipcRenderer.invoke("get-user-id"),


  // Environment variables
  getEnv: (key) => process.env[key],
  getApiBaseUrl: () => process.env.Api_Base_URL,
  
  onToggleUpdated: (callback) => {
    ipcRenderer.on("toggle-updated", (event, data) => callback(data));
  },
  // Tracking control
  getTrackingStatus: () => ipcRenderer.invoke("get-tracking-status"),
  toggleTracking: () => ipcRenderer.invoke("toggle-tracking"),
  showNotification: (title, message) => {
    return ipcRenderer.invoke("show-notification", { title, message });
  },
  // Memo functions
  setMemo: (memoText) => ipcRenderer.invoke("set-memo", memoText),
  getMemo: () => ipcRenderer.invoke("get-memo"),

  // ✅ Enhanced: Detailed tracking stats
  getDetailedTrackingStats: () =>
    ipcRenderer.invoke("get-detailed-tracking-stats"),

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
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  },

  // ✅ NEW: Get most pressed keys
  getTopKeys: (keyPressDetails, limit = 10) => {
    return Object.entries(keyPressDetails)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([key, count]) => ({ key, count }));
  },

});

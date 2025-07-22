const { app, BrowserWindow, ipcMain , Notification } = require("electron");
const path = require("path");
const fs = require("fs");
const screenshot = require("screenshot-desktop");
const ElectronStore = require("electron-store").default;
const axios = require("axios");
// require('dotenv').config();
const FormData = require("form-data");
const { GlobalKeyboardListener } = require("node-global-key-listener");
const { activeWindow } = require("get-windows");
const { start } = require("repl");
const { createTray } = require("./trayMenu");
const { io } = require("socket.io-client");
const store = new ElectronStore();
let currentApp = null;
let currentAppTitle = null;
let startTime = null;
let keyboardCount = 0;
let mouseCount = 0;
let screenshotInterval = null;
let windowTrackingInterval = null;
let globalKeyListener = null;
let mainWindow = null;
// let socket = null; 

// ✅ Enhanced tracking variables for detailed keyboard and mouse tracking
let keyPressDetails = {}; // Object to store individual key press counts
let mouseClickDetails = {
  leftClick: 0,
  rightClick: 0,
  middleClick: 0,
  scroll: 0
};
let lastKeyPressTime = {};
let mouseTrackingInterval = null;

// ✅ Tracking state management
let isTrackingActive = false;
let trackingStartTime = null;
let totalTrackingTime = 0; // in seconds
let trackingTimeInterval = null;

// ✅ Screenshot cycle management
let currentCycle = 0;
let cycleStartTime = null;
let screenshotTakenInCurrentCycle = false;
let lastMousePosition = { x: 0, y: 0 };


function createWindow() {
  const token = store.get("token");
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    // show: false,
    // skipTaskbar: true, 
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
    },
  }); 

  const startPage = token ? "dashboard.html" : "login.html";
  mainWindow.loadFile(path.join(__dirname, "renderer", startPage));

  // ✅ MODIFIED: Don't auto-start tracking, let user control it
  if (token) {
    const userId = store.get("userId");
    if (userId) {  
      console.log("🔄 User already logged in");
      // Load saved tracking state and total time
      isTrackingActive = store.get("isTrackingActive", false);
      totalTrackingTime = store.get("totalTrackingTime", 0);

      if (isTrackingActive) {
        console.log("🔄 Resuming tracking...");
        startAllTracking(userId);
      }
    }
  }
}

function connectToBackendSocket(userId) {
  // Connect with userId as query param
  socket = io("http://localhost:5000", {
    query: { userId },
    transports: ["websocket"],
  });

  socket.on("connect", () => {
    console.log("✅ Connected to backend socket");
  });

  // 👇 Listen for toggle updates from backend
  socket.on("toggle-updated", ({ toggled }) => {
    console.log("🔁 Toggle updated:", toggled);

    // ✅ Send real-time toggle status to renderer
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("toggle-updated", { toggled });
    }
  });

  socket.on("disconnect", () => {
    console.log("🔌 Disconnected from backend socket");
  });
}
// Handle notification from renderer process
ipcMain.handle('show-notification', (event, { title, message }) => {
  if (Notification.isSupported()) {
    const notification = new Notification({
      title: title,
      body: message,
      // icon: path.join(__dirname, '')
    });

    notification.show();

    notification.on('click', () => {
      mainWindow.focus();
    });

    return { success: true };
  }
  return { success: false, error: 'Notifications not supported' };
});

// ✅ IPC handlers for tracking control
ipcMain.handle("get-tracking-status", () => {
  return {
    isActive: isTrackingActive,
    totalTime: totalTrackingTime,
    currentSessionStart: trackingStartTime,
  };
});

ipcMain.handle("toggle-tracking", (event) => {
  const userId = store.get("userId");
  if (!userId) return { success: false, error: "No user logged in" };

  if (isTrackingActive) {
    stopAllTracking();
    return { success: true, isActive: false, totalTime: totalTrackingTime };
  } else {
    startAllTracking(userId);
    return { success: true, isActive: true, totalTime: totalTrackingTime };
  }
});

// ✅ NEW: Get detailed tracking stats
ipcMain.handle("get-detailed-tracking-stats", () => {
  return {
    keyPressDetails: keyPressDetails,
    mouseClickDetails: mouseClickDetails,
    totalKeyPresses: keyboardCount,
    totalMouseActions: mouseCount
  };
});

ipcMain.on("set-token", async (event, token) => {
  store.set("token", token);
  const decoded = JSON.parse(
    Buffer.from(token.split(".")[1], "base64").toString()
  );
  const userId = decoded.id;
  store.set("userId", userId);

   connectToBackendSocket(userId);
  // Reset tracking state on new login
  totalTrackingTime = 0;
  store.set("totalTrackingTime", 0);
  store.set("isTrackingActive", false);
});

ipcMain.on("clear-token", () => {
  store.delete("token");
  store.delete("userId");
  store.delete("isTrackingActive");
  store.delete("totalTrackingTime");

  // ✅ Stop all tracking when user logs out
  stopAllTracking();
  totalTrackingTime = 0;
});

ipcMain.handle("get-user-id", () => {
  return store.get("userId");
});

ipcMain.handle("get-token", () => {
  return store.get("token");
});
ipcMain.handle("get-memo", () => {
  console.log("🧾 get-memo:");
});
let currentMemo = ""; 

ipcMain.handle('set-memo', (event, memoText) => {
  currentMemo = memoText || "";
  return true;
});

// ✅ Function to reset tracking counters
function resetTrackingCounters() {
  keyboardCount = 0;
  mouseCount = 0;
  keyPressDetails = {};
  mouseClickDetails = {
    leftClick: 0,
    rightClick: 0,
    middleClick: 0,
    scroll: 0
  };
  lastKeyPressTime = {};
}

// ✅ Centralized function to start all tracking
function startAllTracking(userId) {
  console.log("🚀 Starting all tracking systems...");

  // Stop any existing tracking first
  stopAllTracking();

  // Set tracking state
  isTrackingActive = true;
  startTime = trackingStartTime = new Date();

  store.set("isTrackingActive", true);

  // Reset all counters
  resetTrackingCounters();

  // Initialize screenshot cycle management
  currentCycle = 0;
  cycleStartTime = new Date();
  screenshotTakenInCurrentCycle = false;

  // Start tracking time counter
  startTrackingTimeCounter();

  // Start screenshot loop with new logic
  startRandomScreenshotLoop(userId);

  // Start enhanced input tracking
  startEnhancedInputTracking();
  
  // Notify renderer process
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("tracking-status-changed", {
      isActive: true,
      totalTime: totalTrackingTime,
    });
  }
}

// ✅ Centralized function to stop all tracking with proper cleanup
function stopAllTracking() {
  // Prevent multiple calls
  if (!isTrackingActive && !screenshotInterval && !windowTrackingInterval && !mouseTrackingInterval) {
    return;
  }

  console.log("🛑 Stopping all tracking systems...");

  try {
    // Update total tracking time if was active
    if (isTrackingActive && trackingStartTime) {
      const sessionTime = Math.floor((new Date() - trackingStartTime) / 1000);
      totalTrackingTime += sessionTime;

      // Only save to store if it's still available
      try {
        store.set("totalTrackingTime", totalTrackingTime);
        store.set("isTrackingActive", false);
      } catch (storeError) {
        console.log("⚠️ Store unavailable during cleanup (app closing)");
      }

      console.log(
        `📊 Session time: ${sessionTime}s, Total time: ${totalTrackingTime}s`
      );
    }

    // Set tracking state
    isTrackingActive = false;
    trackingStartTime = null;

    // Reset screenshot cycle management
    currentCycle = 0;
    cycleStartTime = null;
    screenshotTakenInCurrentCycle = false;

    // Clear intervals safely
    if (screenshotInterval) {
      clearTimeout(screenshotInterval);
      screenshotInterval = null;
    }

    if (windowTrackingInterval) {
      clearInterval(windowTrackingInterval);
      windowTrackingInterval = null;
    }

    if (trackingTimeInterval) {
      clearInterval(trackingTimeInterval);
      trackingTimeInterval = null;
    }

    if (mouseTrackingInterval) {
      clearInterval(mouseTrackingInterval);
      mouseTrackingInterval = null;
    }

    // Clean up global key listener safely
    if (globalKeyListener) {
      try {
        globalKeyListener.kill();
      } catch (keyListenerError) {
        console.log("⚠️ Key listener already destroyed");
      }
      globalKeyListener = null;
    }

    // Notify renderer process safely
    if (mainWindow && !mainWindow.isDestroyed()) {
      try {
        mainWindow.webContents.send("tracking-status-changed", {
          isActive: false,
          totalTime: totalTrackingTime,
        });
      } catch (rendererError) {
        console.log("⚠️ Renderer process unavailable during cleanup");
      }
    }

    console.log("✅ All tracking systems stopped successfully");
  } catch (error) {
    console.error("❌ Error during cleanup:", error.message);
  }
}

// ✅ Function to track elapsed time and update UI
function startTrackingTimeCounter() {
  trackingTimeInterval = setInterval(() => {
    if (isTrackingActive && trackingStartTime && mainWindow && !mainWindow.isDestroyed()) {
      const currentSessionTime = Math.floor(
        (new Date() - trackingStartTime) / 1000
      );
      const displayTime = totalTrackingTime + currentSessionTime;
      
      try {
        mainWindow.webContents.send("tracking-time-update", {
          totalTime: displayTime,
          currentSessionTime: currentSessionTime,
        });
      } catch (error) {
        console.log("⚠️ Error sending time update:", error.message);
      }
    }
  }, 1000); // Update every second
}

// ✅ FIXED: Enhanced input tracking with correct variable names
function startEnhancedInputTracking() {
  try {
    // Clean up existing listener if any
    if (globalKeyListener) {
      globalKeyListener.kill();
      globalKeyListener = null;
    }

    globalKeyListener = new GlobalKeyboardListener();

    globalKeyListener.addListener((e) => {
      if (!isTrackingActive || e.state !== "DOWN") return;

      const rawName = e.name.toUpperCase();

      // Normalize special key names
      const keyMap = {
        "LEFT CTRL": "CTRL",
        "RIGHT CTRL": "CTRL",
        "LEFT SHIFT": "SHIFT",
        "RIGHT SHIFT": "SHIFT",
        "LEFT ALT": "ALT",
        "RIGHT ALT": "ALT",
        "LEFT META": "META",
        "RIGHT META": "META",
        "RETURN": "ENTER",
        "ESCAPE": "ESC",
        "SPACE": "SPACE",
        "BACKSPACE": "BACKSPACE",
        "TAB": "TAB"
      };

      const keyName = keyMap[rawName] || rawName;

      // Check for mouse buttons
      if (keyName.startsWith("MOUSE")) {
        const button = keyName.replace("MOUSE ", "").toLowerCase() + "Click"; // leftClick, rightClick, middleClick
        mouseCount++;
        
        // Map to correct property names
        if (button === "leftClick" || button === "rightClick" || button === "middleClick") {
          mouseClickDetails[button] = (mouseClickDetails[button] || 0) + 1;
        } else {
          // For other mouse events, add to scroll or create new property
          mouseClickDetails.scroll = (mouseClickDetails.scroll || 0) + 1;
        }

        console.log(`🖱️ Mouse ${button} (Count: ${mouseClickDetails[button] || mouseClickDetails.scroll})`);

        if (mainWindow && !mainWindow.isDestroyed()) {
          try {
            mainWindow.webContents.send("mouse-click-update", {
              clickType: button,
              count: mouseClickDetails[button] || mouseClickDetails.scroll,
              totalMouse: mouseCount,
              mouseDetails: mouseClickDetails
            });
          } catch (error) {
            console.log("⚠️ Error sending mouse update:", error.message);
          }
        }
      } else {
        // Regular keyboard key
        keyboardCount++;
        keyPressDetails[keyName] = (keyPressDetails[keyName] || 0) + 1;
        lastKeyPressTime[keyName] = new Date();

        console.log(`⌨️ Key pressed: ${keyName} (Count: ${keyPressDetails[keyName]})`);

        if (mainWindow && !mainWindow.isDestroyed()) {
          try {
            mainWindow.webContents.send("key-press-update", {
              key: keyName,
              count: keyPressDetails[keyName],
              totalKeys: keyboardCount,
              keyDetails: keyPressDetails
            });
          } catch (error) {
            console.log("⚠️ Error sending key update:", error.message);
          }
        }
      }
    });

    console.log("✅ Global keyboard & mouse click tracking started");
  } catch (error) {
    console.error("❌ Failed to initialize input tracking:", error);
  }
}

// ✅ New screenshot logic for 6 screenshots per hour in specific windows
function startRandomScreenshotLoop(userId) {
  const captureAndUpload = async () => {
    // Check if tracking is still active
    if (!isTrackingActive) {
      console.log("📸 Tracking stopped, canceling screenshot");
      return;
    }

    try {
      const img = await screenshot({ format: "jpg" });
      const win = await activeWindow();
      
      if (!win) {
        console.log("⚠️ No active window found");
        scheduleNextScreenshot(userId);
        return;
      }

      const memoText = currentMemo || "";

      currentApp = win.owner?.name || "Unknown App";
      currentAppTitle = win.title || "No Title";

      const duration = startTime
        ? Math.floor((new Date() - startTime) / 1000)
        : 0;

      const data = {
        userId: userId,
        appName: currentApp || "",
        windowTitle: currentAppTitle || "",
        screenshot: img,
        duration: duration,
        keyboardCount: keyboardCount,
        mouseCount: mouseCount,
        keyPressDetails: keyPressDetails, // ✅ Using correct variable name
        mouseClickDetails: mouseClickDetails, // ✅ Using correct variable name
      };

      await logActivity(data, memoText);
      
      // Mark screenshot as taken for this cycle
      screenshotTakenInCurrentCycle = true;

      // Reset counters after logging but preserve detailed tracking structure
      const tempKeyDetails = { ...keyPressDetails };
      const tempMouseDetails = { ...mouseClickDetails };
      
      keyboardCount = 0;
      mouseCount = 0;
      keyPressDetails = {};
      mouseClickDetails = {
        leftClick: 0,
        rightClick: 0,
        middleClick: 0,
        scroll: 0
      };
      
      startTime = new Date();
      
      console.log("📊 Logged activity with detailed tracking:", {
        keyDetails: tempKeyDetails,
        mouseDetails: tempMouseDetails
      });
    } catch (err) {
      console.error("❌ Screenshot/activity upload error:", err);
    }
    
    // Schedule next screenshot cycle
    scheduleNextScreenshot(userId);
  };

  const calculateTimeUntilNextWindow = (cycleNumber) => {
    const now = new Date();
    const trackingStart = trackingStartTime;

    if (!trackingStart) {
      return 0;
    }

    // Calculate how much time has passed since tracking started
    const elapsedMs = now - trackingStart;
    const elapsedMinutes = elapsedMs / (1000 * 60);
    
    // Define the time windows for each cycle (in minutes from start)
    const windowStarts = [0, 10, 20, 30, 40, 50]; // Start of each 10-minute window
    const windowEnds = [10, 20, 30, 40, 50, 60]; // End of each 10-minute window

    const windowStart = windowStarts[cycleNumber];
    const windowEnd = windowEnds[cycleNumber];

    // If we're already past this window, move to next hour cycle
    if (elapsedMinutes >= windowEnd) {
      // Calculate time until the same window in next hour
      const nextHourWindowStart = windowStart + 60;
      const timeUntilWindow = nextHourWindowStart - elapsedMinutes;
      return Math.max(0, timeUntilWindow);
    }

    // If we're before this window, calculate time until window starts
    if (elapsedMinutes < windowStart) {
      const timeUntilWindow = windowStart - elapsedMinutes;
      return Math.max(0, timeUntilWindow);
    }

    // We're currently in the window, return 0 (take screenshot now)
    return 0;
  };

  const scheduleNextScreenshot = (userId) => {
    if (!isTrackingActive) return;

    // Move to next cycle
    currentCycle = (currentCycle + 1) % 6;

    // Calculate time until the next window starts
    const minutesUntilWindow = calculateTimeUntilNextWindow(currentCycle);

    // Add random time within the 10-minute window
    const randomWithinWindow = Math.random() * 10; // 0-10 minutes random within window
    const totalMinutes = minutesUntilWindow + randomWithinWindow;

    const nextInterval = Math.max(1000, Math.floor(totalMinutes * 60 * 1000)); // Minimum 1 second

    console.log(`⏰ Next screenshot (cycle ${currentCycle + 1}/6) scheduled in ${totalMinutes.toFixed(1)} minutes`);

    screenshotInterval = setTimeout(() => {
      captureAndUpload();
    }, nextInterval);
  };

  // ✅ MODIFIED: Schedule first screenshot in first window (0-10 minutes)
  console.log("📸 Starting screenshot scheduler...");

  // First screenshot: random time within first 10 minutes (0-10 minutes window)
  const firstRandomMinutes = Math.random() * 10;
  const firstInterval = Math.max(1000, Math.floor(firstRandomMinutes * 60 * 1000)); // Minimum 1 second

  console.log(
    `⏰ First screenshot scheduled in ${firstRandomMinutes.toFixed(1)} minutes`
  );

  screenshotInterval = setTimeout(() => {
    captureAndUpload();
  }, firstInterval);
}

// ✅ Enhanced activity logging with proper error handling
async function logActivity(data, memoText = "") {
  try {
    const form = new FormData();
    const randomId = `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;

    // Append data to the form
    form.append("id", randomId);
    form.append("userId", data.userId || "");
    form.append("appName", data.appName || "");
    form.append("windowTitle", data.windowTitle || "");
    form.append("duration", data.duration || 0);
    form.append("keyboardCount", data.keyboardCount || 0);
    form.append("mouseCount", data.mouseCount || 0);
    form.append("memo", memoText || "");
    
    // ✅ Send detailed tracking data as JSON strings with fallbacks
    form.append("keyPressDetails", JSON.stringify(data.keyPressDetails || {}));
    form.append("mouseClickDetails", JSON.stringify(data.mouseClickDetails || {}));

    const fileName = `screenshot_${Date.now()}.jpg`;
    form.append("screenshot", data.screenshot, {
      filename: fileName,
      contentType: "image/jpeg",
    });

    const response = await axios.post("http://localhost:5000/api/activities/log", form, {
      headers: form.getHeaders(),
      timeout: 30000, // 30 second timeout
    });

    console.log("✅ Activity logged successfully with detailed tracking");
    return response.data;
  } catch (err) {
    console.error(
      "❌ Error logging activity:",
      err.response?.data || err.message
    );
    
    // Don't throw error to prevent tracking from stopping
    return null;
  }
}

// ✅ Enhanced app lifecycle management
app.whenReady().then(() => {
  createWindow();
  createTray(mainWindow, () => {
    app.isQuiting = true; // Set flag to allow actual quit
    app.quit();
  });
  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
    else {
      // On macOS, show the window when clicking dock icon
      mainWindow.show();
    }
  });
});

app.on("window-all-closed", function () {
  console.log("🔄 All windows closed");
  try {
    stopAllTracking();
  } catch (error) {
    console.log("⚠️ Error during window-all-closed cleanup:", error.message);
  }

  if (process.platform !== "darwin") {
    // app.quit();
  }
});

// ✅ Enhanced cleanup on app quit
app.on("before-quit", (event) => {
  console.log("🔄 App is quitting...");
  try {
    stopAllTracking();
  } catch (error) {
    console.log("⚠️ Error during before-quit cleanup:", error.message);
  }
});

// ✅ Additional cleanup for app termination
app.on("will-quit", (event) => {
  console.log("🔄 App will quit...");
  try {
    // Final cleanup
    if (globalKeyListener) {
      globalKeyListener.kill();
      globalKeyListener = null;
    }
    // Clear any remaining intervals
    if (screenshotInterval) clearTimeout(screenshotInterval);
    if (windowTrackingInterval) clearInterval(windowTrackingInterval);
    if (trackingTimeInterval) clearInterval(trackingTimeInterval);
    if (mouseTrackingInterval) clearInterval(mouseTrackingInterval);
  } catch (error) {
    console.log("⚠️ Error during will-quit cleanup:", error.message);
  }
});

// ✅ Handle uncaught exceptions to prevent crashes
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  // Don't exit the process, just log the error
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process, just log the error
});
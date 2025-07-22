// ===== 3. tracking.js =====
// Tracking functionality

let isTrackingActive = false;
let adminTrackingEnabled = false; // This state is now managed globally and shared
let trackingToggleBtn = null;
let trackingStatusDiv = null;
let trackingTimeDiv = null;

export function initializeTrackingElements() {
    trackingToggleBtn = document.getElementById("trackingToggleBtn");
    trackingStatusDiv = document.getElementById("trackingStatusDisplay");
    trackingTimeDiv = document.getElementById("trackingTimeDisplay");
}

export function updateTrackingDisplay(data) {
    if (trackingStatusDiv) {
        trackingStatusDiv.innerHTML = `
            <div class="status-dot ${isTrackingActive ? 'active' : 'inactive'}"></div>
            <span>${isTrackingActive ? 'Currently Active' : 'Currently Inactive'}</span>
        `;
    }

    if (trackingTimeDiv && data.totalTime !== undefined) {
        trackingTimeDiv.innerHTML = `
            <div class="time-value">${window.electronAPI.formatTime(data.totalTime)}</div>
            <div class="time-label">Total Time</div>
            ${data.currentSessionTime > 0 ?
                `<div class="session-time">Session: ${window.electronAPI.formatTime(data.currentSessionTime)}</div>` :
                ''
            }
        `;
    }

    if (trackingToggleBtn) {
        trackingToggleBtn.textContent = isTrackingActive ? "⏹️ Stop Tracking" : "🚀 Start Tracking";
        trackingToggleBtn.className = `tracking-button ${isTrackingActive ? 'stop' : 'start'}`;
    }
}

export async function toggleTracking(socket, currentUserId) {
    // Get the latest adminTrackingEnabled state from the admin module
    const currentAdminTrackingState = window.electronAPI.getAdminTrackingEnabled();

    if (!currentAdminTrackingState && !isTrackingActive) {
        window.electronAPI.addNotification("Tracking Disabled", "Admin has disabled tracking. Please contact admin to enable it.", "warning");
        return;
    }

    try {
        if (trackingToggleBtn) {
            trackingToggleBtn.disabled = true;
            trackingToggleBtn.textContent = "Processing...";
        }

        const result = await window.electronAPI.toggleTracking();

        if (result.success) {
            isTrackingActive = result.isActive;
            updateTrackingDisplay({ totalTime: result.totalTime });

            if (socket && currentUserId) {
                socket.emit("user-tracking-status", {
                    userId: currentUserId,
                    isTracking: isTrackingActive
                });
            }
        } else {
            window.electronAPI.addNotification("Error", "Failed to toggle tracking. Please try again.", "error");
        }
    } catch (error) {
        console.error("Error toggling tracking:", error);
        window.electronAPI.addNotification("Error", "An error occurred. Please try again.", "error");
    } finally {
        if (trackingToggleBtn) {
            trackingToggleBtn.disabled = false;
        }
    }
}

export function setTrackingState(active) {
    isTrackingActive = active;
}

export function setAdminTrackingEnabled(enabled) {
    adminTrackingEnabled = enabled; // This is the local state for the tracking module
}

export function getTrackingState() {
    return { isTrackingActive, adminTrackingEnabled };
}
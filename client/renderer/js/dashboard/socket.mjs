// ===== 5. socket.js =====
// Socket connection and handlers

export function initializeSocket(userId) {
    // Make sure 'io' (Socket.IO client library) is loaded globally in dashboard.html
    const socket = io("http://localhost:5000", {
        query: { userId: userId },
        withCredentials: true
    });

    socket.on('connect', () => {
        console.log('✅ Connected to server');
        socket.emit("user-online", { userId });
        socket.emit("request-admin-toggle-status", { userId });
    });

    socket.on('disconnect', () => {
        console.log('❌ Disconnected from server');
    });

    socket.on("toggle-updated", ({ toggled }) => {
        console.log("🚦 Real-time toggle changed:", toggled);
        window.electronAPI.setAdminTrackingEnabledAdmin(toggled); // Use the exposed admin function
        localStorage.setItem(`adminTracking_${userId}`, toggled.toString());
        window.electronAPI.updateAdminToggleButton(); // Use the exposed admin function

        const msg = toggled
            ? "🔓 Admin has <b>enabled</b> your tracking."
            : "🔒 Admin has <b>disabled</b> your tracking.";

        window.electronAPI.addNotification("Tracking Status Changed", msg, "info"); // Use the exposed notification function
        window.electronAPI.showAdminTrackingBanner(msg); // Use the exposed admin function
    });

    socket.on("admin-toggle-status", ({ toggled }) => {
        console.log("📊 Initial admin toggle status:", toggled);
        window.electronAPI.setAdminTrackingEnabledAdmin(toggled); // Use the exposed admin function
        localStorage.setItem(`adminTracking_${userId}`, toggled.toString());
        window.electronAPI.updateAdminToggleButton(); // Use the exposed admin function
    });

    socket.on("notify-message", (notification) => {
        console.log("📥 Received notification:", notification);
        window.electronAPI.addNotification( // Use the exposed notification function
            notification.title || "Admin Message",
            notification.message,
            "admin"
        );
    });

    socket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error);
    });

    return socket;
}
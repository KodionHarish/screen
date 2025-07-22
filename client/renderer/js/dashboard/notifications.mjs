// ===== 2. notifications.mjs =====

let notifications = [];
let unreadCount = 0;

let formatter = (date) => date; // fallback formatter

export function setFormatter(fn) {
    formatter = fn;
}

export function addNotification(title, message, type = "info") {
    const notification = {
        id: Date.now(),
        title,
        message,
        type,
        timestamp: new Date(),
        read: false
    };

    notifications.unshift(notification);
    if (!notification.read) {
        unreadCount++;
    }
    updateNotificationUI();
    updateNotificationBadge();
}

export function updateNotificationUI() {
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
        .map(notif => `
            <div class="notification-item ${notif.type} ${notif.read ? 'read' : 'unread'}" data-id="${notif.id}">
                <div class="notification-content">
                    <div class="notification-header">
                        <span class="notification-title">${notif.title}</span>
                        <span class="notification-time">${formatter(notif.timestamp)}</span>
                    </div>
                    <div class="notification-message">${notif.message}</div>
                </div>
                <div class="notification-actions">
                    ${!notif.read ? `<button class="mark-read-btn" onclick="window.electronAPI.markAsRead(${notif.id})">✓</button>` : ''}
                    <button class="delete-notification-btn" onclick="window.electronAPI.deleteNotification(${notif.id})">🗑️</button>
                </div>
            </div>
        `)
        .join("");
}

export function updateNotificationBadge() {
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

export function toggleNotificationPanel() {
    const panel = document.getElementById("notificationPanel");
    if (panel) {
        panel.style.display = panel.style.display === "none" ? "block" : "none";
    }
}

export function markAsRead(notificationId) {
    const notification = notifications.find(n => n.id === notificationId);
    if (notification && !notification.read) {
        notification.read = true;
        unreadCount = Math.max(0, unreadCount - 1);
        updateNotificationBadge();
        updateNotificationUI();
    }
}

export function deleteNotification(notificationId) {
    const index = notifications.findIndex(n => n.id === notificationId);
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

export function clearAllNotifications() {
    notifications = [];
    unreadCount = 0;
    updateNotificationUI();
    updateNotificationBadge();
}

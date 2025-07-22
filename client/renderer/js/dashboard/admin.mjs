// ===== 4. admin.js =====
// Admin toggle functionality

let adminTrackingEnabled = false;

export function updateAdminToggleButton() {
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

export function showAdminTrackingBanner(message) {
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

export function setAdminTrackingEnabled(enabled) {
    adminTrackingEnabled = enabled;
}

export function getAdminTrackingEnabled() {
    return adminTrackingEnabled;
}
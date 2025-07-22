// ===== 6. styles.js =====
// Create and inject styles
export function createNotificationStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* Your existing CSS styles here - keeping it shorter for brevity */
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


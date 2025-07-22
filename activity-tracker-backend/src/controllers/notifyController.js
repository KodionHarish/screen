// src/controllers/notifyController.js
const { sendOfflineEmail, sharedStore } = require("../utils/notifyHandler");
const { successResponse, errorResponse } = require("../utils/response");

class NotifyController {
    static async forceEmailSend(req, res) {
        try {
            const userId = parseInt(req.body.userId);
            const customMessage = req.body.message?.trim();
            const queuedMessages = sharedStore.offlineNotifications.get(userId);

            let messagesToSend = [];

            // Use queued messages if any
            if (Array.isArray(queuedMessages) && queuedMessages.length > 0) {
                messagesToSend = queuedMessages;
            } 
            // Use admin's manual input if provided
            else if (customMessage) {
                messagesToSend = [{
                    message: customMessage,
                    timestamp: new Date().toISOString(),
                    id: Date.now(),
                }];
            } 
            // Fallback message
            else {
            messagesToSend = [{
                message: "Admin has a message for you. Please check your dashboard.",
                timestamp: new Date().toISOString(),
                id: Date.now(),
            }];
            }

            await sendOfflineEmail(userId, messagesToSend);
            successResponse(res, "Email sent successfully.");
        } catch (error) {
            console.error("❌ forceEmailSend error:", error);
            errorResponse(res, "Failed to send email.");
        }
    }

}

module.exports = NotifyController;
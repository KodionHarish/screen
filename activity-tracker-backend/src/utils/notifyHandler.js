// correct version
const connectedUsers = require("./socketStore");
const db = require("../database/connection");
const nodemailer = require("nodemailer");
const sharedStore = {offlineNotifications: new Map(),emailSent: new Map(),};
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.ADMIN_EMAIL,
    pass: process.env.ADMIN_EMAIL_PASS,
  },
});
async function sendOfflineEmail(userId, messages) {
  try {
    const conn = db.getConnection();
    const [rows] = await conn.execute("SELECT email, name FROM users WHERE id = ?", [userId]);
    const user = rows[0];
    if (!user?.email) return;
    const content = messages.map((n, i) => `${i + 1}. ${n.message}`).join("\n");
    const mailOptions = {
      from: '"Admin" <lovepreets1681@gmail.com>',
      to: user.email,
      subject: "Missed Admin Messages",
      text: `Hello ${user.name},\n\nYou have ${messages.length} unread admin messages:\n\n${content}\n\nPlease log in to your dashboard.\n\nBest,\nAdmin`,
    };
    await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent to ${user.email}`);
  } catch (err) {
    console.error("❌ Error sending email:", err.message);
  }
}
function notifyUser(io, { userId, name, message }) {
  const { offlineNotifications, emailSent } = sharedStore;
  const targetUserId = parseInt(userId);
  const userSocketIds = [...connectedUsers.entries()]
    .filter(([, uid]) => uid === targetUserId)
    .map(([sid]) => sid);
  const isOnline = userSocketIds.length > 0;
  console.log("🟡 [Queue Before Push]", targetUserId, offlineNotifications.get(targetUserId));
  const notification = {
    title: "Message from Admin",
    message: message || `Hello ${name}, Please turn ON the tracker.`,
    timestamp: new Date().toISOString(),
    id: Date.now() + Math.random(),
  };
  if (isOnline) {
    userSocketIds.forEach(sid => io.to(sid).emit("notify-message", notification));
    io.to(`user-${targetUserId}`).emit("notify-message", notification);
    return { success: true, status: "delivered" };
  }
  const queue = offlineNotifications.get(targetUserId) || [];
  queue.push(notification);
  offlineNotifications.set(targetUserId, queue);
  io.to(`user-${targetUserId}`).emit("notify-message", notification);
  // if (queue.length >= 3 && !emailSent.get(targetUserId)) {
  //   emailSent.set(targetUserId, true);
  //   setTimeout(() => {
  //     const stillOffline = ![...connectedUsers.values()].includes(targetUserId);
  //     const latestQueue = offlineNotifications.get(targetUserId) || [];
  //     if (stillOffline && latestQueue.length >= 3) {
  //       sendOfflineEmail(targetUserId, latestQueue);
  //       // offlineNotifications.set(targetUserId, []);
  //     }
  //   }, 2 * 60 * 1000); // 2 minutes
  // }
  return { success: true, status: "queued" };
}
function deliverQueuedNotifications(io, userId) {
  const { offlineNotifications, emailSent } = sharedStore;
  const targetUserId = parseInt(userId);
  const queue = offlineNotifications.get(targetUserId);
  if (!queue?.length) return 0;
  console.log("🟢 [Queue On Reconnect]", targetUserId, queue);
  queue.forEach(n => {
    io.to(`user-${targetUserId}`).emit("notify-message", n);
  });
  offlineNotifications.delete(targetUserId);
  emailSent.delete(targetUserId);
  return queue.length;
}
function getPendingNotificationCount(userId) { 
  return (sharedStore.offlineNotifications.get(parseInt(userId)) || []).length;
}
function clearNotifications(userId) {
  const { offlineNotifications, emailSent } = sharedStore;
  offlineNotifications.delete(parseInt(userId));
  emailSent.delete(parseInt(userId));
}
module.exports = {
  notifyUser,
  deliverQueuedNotifications,
  getPendingNotificationCount,
  clearNotifications,
  sendOfflineEmail,
  sharedStore,
};
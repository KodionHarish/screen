// src/services/activityService.js
const Activity = require("../models/Activity");
const { getConnection } = require("../database/connection");

class ActivityService {
  static async logActivity(userId, activityData) {
    const existingActivity = await Activity.findByUserId(userId);

    if (!existingActivity) {
      await Activity.createActivityLog(userId, [activityData]);
    } else {
      const currentActivities = JSON.parse(existingActivity.activity_data);
      currentActivities.push(activityData);
      await Activity.updateActivityLog(userId, currentActivities);
    }
  }

  static async deleteScreenshot(userId, id) {
    const activityRecord = await Activity.findByUserId(userId);

    if (!activityRecord) {
      throw new Error("Activity record not found");
    }

    let activities = [];

    try {
      activities = JSON.parse(activityRecord.activity_data || "[]");
    } catch (error) {
      console.error("Invalid JSON in activity_data");
      return false;
    }

    const filteredActivities = activities.filter((log) => log.id !== id);

    const db = getConnection();
    const [result] = await db.execute(
      "UPDATE activity_logs SET activity_data = ? WHERE user_id = ?",
      [JSON.stringify(filteredActivities), userId]
    );

    return result.affectedRows > 0;
  }

  static async getUserActivities(userId, filterDate = null) {
    const activityRecord = await Activity.findByUserId(userId);

    if (!activityRecord) {
      return { logs: [], total: 0 };
    }

    let activities = JSON.parse(activityRecord.activity_data || "[]");

    if (filterDate) {
      activities = activities.filter((log) => {
        if (!log.timestamp) return false;
        const logDate = new Date(log.timestamp).toISOString().slice(0, 10);
        return logDate === filterDate;
      });
    }

    const screenshotLogs = activities.filter((log) => log.screenshotName);

    // Each screenshot represents 10 minutes => convert to hours
    const totalActiveMinutes = screenshotLogs.length * 10;

    let formattedActiveTime = "";
    if (totalActiveMinutes < 60) {
      formattedActiveTime = `${totalActiveMinutes} min`;
    } else {
      const hours = Math.floor(totalActiveMinutes / 60);
      const minutes = totalActiveMinutes % 60;
      formattedActiveTime =
        minutes > 0 ? `${hours} hr ${minutes} min` : `${hours}:00 hr`;
    }

    // Get time of the last screenshot
    let lastScreenshotTime = null;
    if (screenshotLogs.length > 0) {
      const latestLog = screenshotLogs.reduce((latest, current) => {
        return new Date(current.timestamp) > new Date(latest.timestamp)
          ? current
          : latest;
      });
      lastScreenshotTime = new Date(latestLog.timestamp).toISOString();
    }
    console.log(formattedActiveTime, "formattedActiveTime");
    return {
      logs: activities,
      total: activities.length,
      lastScreenshotTime: lastScreenshotTime,
      totalActiveHours: formattedActiveTime,
    };
  }

  static async getAllActivities() {
    const activities = await Activity.getAllActivities();
    const allLogs = [];

    activities.forEach((row) => {
      const activityArray = JSON.parse(row.activity_data || "[]");

      activityArray.forEach((activity) => {
        allLogs.push({
          userId: row.userId,
          userName: row.name,
          ...activity
        });
      });
    });
    return allLogs;
  }
}

module.exports = ActivityService;




// // src/services/activityService.js
// const Activity = require("../models/Activity");
// const { getConnection } = require("../database/connection");

// class ActivityService {
//   static async logActivity(userId, activityData) {
//     const existingActivity = await Activity.findByUserId(userId);

//     if (!existingActivity) {
//       await Activity.createActivityLog(userId, [activityData]);
//     } else {
//       const currentActivities = JSON.parse(existingActivity.activity_data);
//       currentActivities.push(activityData);
//       await Activity.updateActivityLog(userId, currentActivities);
//     }
    
//   // ✅ NEW: Update user tracking status in separate table/field if needed

//   // You might want to store the latest tracking status separately for quick access

//     await Activity.updateUserTrackingStatus(userId, {

//       isTrackingActive: activityData.isTrackingActive,

//       totalTrackingTime: activityData.totalTrackingTime,

//       lastActivityTime: activityData.timestamp

//     });
//   }




//   static async deleteScreenshot(userId, id) {
//     const activityRecord = await Activity.findByUserId(userId);

//     if (!activityRecord) {
//       throw new Error("Activity record not found");
//     }

//     let activities = [];

//     try {
//       activities = JSON.parse(activityRecord.activity_data || "[]");
//     } catch (error) {
//       console.error("Invalid JSON in activity_data");
//       return false;
//     }

//     const filteredActivities = activities.filter((log) => log.id !== id);

//     const db = getConnection();
//     const [result] = await db.execute(
//       "UPDATE activity_logs SET activity_data = ? WHERE user_id = ?",
//       [JSON.stringify(filteredActivities), userId]
//     );

//     return result.affectedRows > 0;
//   }

//   static async getUserActivities(userId, filterDate = null) {
//     const activityRecord = await Activity.findByUserId(userId);

//     if (!activityRecord) {
//       return { logs: [], total: 0 };
//     }

//     let activities = JSON.parse(activityRecord.activity_data || "[]");

//     if (filterDate) {
//       activities = activities.filter((log) => {
//         if (!log.timestamp) return false;
//         const logDate = new Date(log.timestamp).toISOString().slice(0, 10);
//         return logDate === filterDate;
//       });
//     }

//     const screenshotLogs = activities.filter((log) => log.screenshotName);

//     // Each screenshot represents 10 minutes => convert to hours
//     const totalActiveMinutes = screenshotLogs.length * 10;

//     let formattedActiveTime = "";
//     if (totalActiveMinutes < 60) {
//       formattedActiveTime = `${totalActiveMinutes} min`;
//     } else {
//       const hours = Math.floor(totalActiveMinutes / 60);
//       const minutes = totalActiveMinutes % 60;
//       formattedActiveTime =
//         minutes > 0 ? `${hours} hr ${minutes} min` : `${hours}:00 hr`;
//     }

//     // Get time of the last screenshot
//     let lastScreenshotTime = null;
//     if (screenshotLogs.length > 0) {
//       const latestLog = screenshotLogs.reduce((latest, current) => {
//         return new Date(current.timestamp) > new Date(latest.timestamp)
//           ? current
//           : latest;
//       });
//       lastScreenshotTime = new Date(latestLog.timestamp).toISOString();
//     }
//     console.log(formattedActiveTime, "formattedActiveTime");
//     return {
//       logs: activities,
//       total: activities.length,
//       lastScreenshotTime: lastScreenshotTime,
//       totalActiveHours: formattedActiveTime,
//     };
//   }

//   static async getAllActivities() {
//     const activities = await Activity.getAllActivities();
//     const allLogs = [];

//     activities.forEach((row) => {
//       const activityArray = JSON.parse(row.activity_data || "[]");

//       activityArray.forEach((activity) => {
//         allLogs.push({
//           userId: row.userId,
//           userName: row.name,
//           ...activity
//         });
//       });
//     });
//     return allLogs;
//   }

//    // ✅ NEW: Get all users with tracking status for admin panel

//   static async getAllUsersWithStatus() {

//     return await Activity.getAllUsersWithTrackingStatus();

//   }



//   // ✅ NEW: Get user tracking status

//   static async getUserTrackingStatus(userId) {

//     return await Activity.getUserTrackingStatus(userId);

//   }
  
// }

// module.exports = ActivityService;

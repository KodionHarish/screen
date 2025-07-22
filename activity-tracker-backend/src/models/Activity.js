// src/models/Activity.js
const { getConnection } = require('../database/connection');

class Activity {
  static async findByUserId(userId) {
    const db = getConnection(); 
    const [rows] = await db.execute(
      'SELECT activity_data FROM activity_logs WHERE user_id = ?',
      [userId]
    );
    return rows[0] || null;
  }

  static async createActivityLog(userId, activityData) {
    const db = getConnection();
    const [result] = await db.execute(
      'INSERT INTO activity_logs (user_id, activity_data) VALUES (?, ?)',
      [userId, JSON.stringify(activityData)]
    );
    return result.insertId;
  }

  static async updateActivityLog(userId, activityData) {
    const db = getConnection();
    const [result] = await db.execute(
      'UPDATE activity_logs SET activity_data = ? WHERE user_id = ?',
      [JSON.stringify(activityData), userId]
    );
    return result.affectedRows > 0;
  }

  static async getAllActivities() {
    const db = getConnection();
    const [rows] = await db.execute(`
      SELECT users.id as userId, users.name, activity_logs.activity_data
      FROM activity_logs
      JOIN users ON users.id = activity_logs.user_id
    `);
    return rows;
  }
}

module.exports = Activity;



// // src/models/Activity.js
// const { getConnection } = require('../database/connection');

// class Activity {
//   static async findByUserId(userId) {
//     const db = getConnection(); 
//     const [rows] = await db.execute(
//       'SELECT activity_data FROM activity_logs WHERE user_id = ?',
//       [userId]
//     );
//     return rows[0] || null;
//   }

//   static async createActivityLog(userId, activityData) {
//     const db = getConnection();
//     const [result] = await db.execute(
//       'INSERT INTO activity_logs (user_id, activity_data) VALUES (?, ?)',
//       [userId, JSON.stringify(activityData)]
//     );
//     return result.insertId;
//   }

//   static async updateActivityLog(userId, activityData) {
//     const db = getConnection();
//     const [result] = await db.execute(
//       'UPDATE activity_logs SET activity_data = ? WHERE user_id = ?',
//       [JSON.stringify(activityData), userId]
//     );
//     return result.affectedRows > 0;
//   }

//   static async getAllActivities() {
//     const db = getConnection();
//     const [rows] = await db.execute(`
//       SELECT users.id as userId, users.name, activity_logs.activity_data
//       FROM activity_logs
//       JOIN users ON users.id = activity_logs.user_id
//     `);
//     return rows;
//   }

  

//   static async updateUserTrackingStatus(userId, statusData) {

//     const db = getConnection();

//     const [result] = await db.execute(`

//       UPDATE users 

//       SET is_tracking_active = ?, 

//           total_tracking_time = ?, 

//           last_activity_time = ?,

//           tracking_updated_at = NOW()

//       WHERE id = ?

//     `, [

//       statusData.isTrackingActive,

//       statusData.totalTrackingTime,

//       statusData.lastActivityTime,

//       userId

//     ]);

//     return result.affectedRows > 0;

//   }



//   static async getUserTrackingStatus(userId) {

//     const db = getConnection();

//     const [rows] = await db.execute(`

//       SELECT is_tracking_active, total_tracking_time, last_activity_time, tracking_updated_at

//       FROM users

//       WHERE id = ?

//     `, [userId]);

    

//     if (rows[0]) {

//       return {

//         isActive: rows[0].is_tracking_active,

//         totalTime: rows[0].total_tracking_time || 0,

//         lastActivity: rows[0].last_activity_time,

//         updatedAt: rows[0].tracking_updated_at

//       };

//     }

//     return null;

//   }



//   static async getLatestActivity(userId) {

//     const query = `

//       SELECT activity_data

//       FROM activity_logs

//       WHERE user_id = ?

//       ORDER BY created_at DESC

//       LIMIT 1

//     `;

//     const db = getConnection();

//     const [rows] = await db.execute(query, [userId]);

//     if (rows[0]) {

//       const activities = JSON.parse(rows[0].activity_data);

//       return activities[activities.length - 1]; // Get the latest activity

//     }

//     return null;

//   }



//   // ✅ Get all users with their tracking status

//   static async getAllUsersWithTrackingStatus() {
//     const db = getConnection();

//     const [rows] = await db.execute(`

//       SELECT 

//         id,

//         name,

//         email,

//         activeStatus,

//         is_tracking_active,

//         total_tracking_time,

//         last_activity_time,

//         tracking_updated_at

//       FROM users

//       ORDER BY name

//     `);

//     return rows;

//   }
// }

// module.exports = Activity;
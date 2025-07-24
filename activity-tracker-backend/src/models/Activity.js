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
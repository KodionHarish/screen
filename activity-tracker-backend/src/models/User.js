const { getConnection } = require("../database/connection");
const connectedUsers = require("../utils/socketStore");
class User {
  static async findByEmail(email) {
    const db = getConnection();
    const [rows] = await db.execute("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    return rows[0] || null;
  }

  static async findById(id) {
    const db = getConnection();
    const [rows] = await db.execute("SELECT * FROM users WHERE id = ?", [id]);
    return rows[0] || null;
  }

  static async create(userData) {
    const db = getConnection();
    const { name, email, designation, company, password } =
      userData;

    const [result] = await db.execute(
      "INSERT INTO users (name, email, designation, company, password) VALUES (?, ?, ?, ?, ?)",
      [name, email, designation, company, password]
    );

    return { id: result.insertId, ...userData };
  }

  static async getAllUsers() {
    const db = getConnection();
    const [rows] = await db.execute(
      "SELECT id, name FROM users WHERE role != 'admin'"
    );
    return rows;
  }

  static async getAllUsersCount() {
    const db = getConnection();
    const [rows] = await db.execute(
      "SELECT COUNT(*) AS total FROM users WHERE role != 'admin'"
    );
    return rows[0].total;
  }

  static async selectedUser(date) {
    const db = getConnection();
    //const [rows] = await db.execute("SELECT id, name FROM users WHERE role != 'admin'");
    const [rows] = await db.execute(`
      SELECT 
        u.id,
        u.name,
        al.activity_data
      FROM users u
      LEFT JOIN activity_logs al ON u.id = al.user_id
      WHERE u.role != 'admin'
      GROUP BY u.id, u.name
  `);

    const usersWithStats = rows.map((user) => {
      let totalActiveHours = 0;
      let lastScreenshotTime = null;
      let screenshotLogs = [];
      let formattedActiveTime = "";
      try {
        const activities = JSON.parse(user.activity_data || "[]");

        const filteredLogs = date
          ? activities.filter((log) => {
              if (!log.timestamp) return false;
              const logDate = new Date(log.timestamp)
                .toISOString()
                .slice(0, 10);
              return logDate === date;
            })
          : activities;

        //  console.log(activities,'aaaaaaaaactiviurss')
        screenshotLogs = filteredLogs.filter((log) => log.screenshotName);
        // Each screenshot represents 10 minutes => convert to hours
        const totalActiveMinutes = screenshotLogs.length * 10;

        if (totalActiveMinutes < 60) {
          formattedActiveTime = `${totalActiveMinutes} min`;
        } else {
          const hours = Math.floor(totalActiveMinutes / 60);
          const minutes = totalActiveMinutes % 60;
          formattedActiveTime =
            minutes > 0 ? `${hours} hr ${minutes} min` : `${hours} hr`;
        }

        if (screenshotLogs.length > 0) {
          const latestLog = screenshotLogs.reduce((a, b) =>
            new Date(a.timestamp) > new Date(b.timestamp) ? a : b
          );
          const date = new Date(latestLog.timestamp);
          let hours = date.getHours();
          const minutes = String(date.getMinutes()).padStart(2, "0");
          const ampm = hours >= 12 ? "PM" : "AM";
          hours = hours % 12;
          hours = hours ? hours : 12; // Convert 0 to 12
          const hourStr = String(hours).padStart(2, "0");
          lastScreenshotTime = `${hourStr}:${minutes} ${ampm}`;
        }
      } catch (err) {
        console.error(`Failed to parse activity_data for user ${user.id}`, err);
      }
      return {
        id: user.id,
        name: user.name,
        totalActiveHours: formattedActiveTime,
        lastScreenshotTime,
        totalLength: screenshotLogs.length,
      };
    });

    return usersWithStats;
  }

  static async usersWithLogs(date) {
    const db = getConnection();
    //const [rows] = await db.execute("SELECT id, name FROM users WHERE role != 'admin'");
    const [rows] = await db.execute(`
      SELECT 
        u.id,
        u.name,
        al.activity_data
      FROM users u
      LEFT JOIN activity_logs al ON u.id = al.user_id
      WHERE u.role != 'admin'
      GROUP BY u.id, u.name
  `);

    const usersWithStats = rows.map((user) => {
      let totalActiveHours = 0;
      let lastScreenshotTime = null;
      let screenshotLogs = [];
      let formattedActiveTime = "";
      let activities = [];
      let filteredLogs = [];
      let statusColor;
      try {
        activities = JSON.parse(user.activity_data || "[]");

        filteredLogs = date
          ? activities.filter((log) => {
              if (!log.timestamp) return false;
              const logDate = new Date(log.timestamp)
                .toISOString()
                .slice(0, 10);
              return logDate === date;
            })
          : [];

        screenshotLogs = filteredLogs.filter((log) => log.screenshotName);
        if (screenshotLogs.length < 24) {
          statusColor = "red";
        } else if (screenshotLogs.length >= 24 && screenshotLogs.length <= 36) {
          statusColor = "yellow";
        } else {
          statusColor = "green";
        }

        const totalActiveMinutes = screenshotLogs.length * 10;

        if (totalActiveMinutes < 60) {
          formattedActiveTime = `${totalActiveMinutes} min`;
        } else {
          const hours = Math.floor(totalActiveMinutes / 60);
          const minutes = totalActiveMinutes % 60;
          formattedActiveTime =
            minutes > 0 ? `${hours} hr ${minutes} min` : `${hours}:00 hr`;
        }

        if (screenshotLogs.length > 0) {
          const latestLog = screenshotLogs.reduce((a, b) =>
            new Date(a.timestamp) > new Date(b.timestamp) ? a : b
          );
          const date = new Date(latestLog.timestamp);
          let hours = date.getHours();
          const minutes = String(date.getMinutes()).padStart(2, "0");
          const ampm = hours >= 12 ? "PM" : "AM";
          hours = hours % 12;
          hours = hours ? hours : 12; // Convert 0 to 12
          const hourStr = String(hours).padStart(2, "0");
          lastScreenshotTime = `${hourStr}:${minutes} ${ampm}`;
        }
      } catch (err) {
        console.error(`Failed to parse activity_data for user ${user.id}`, err);
      }
      return {
        id: user.id,
        name: user.name,
        totalActiveHours: formattedActiveTime,
        lastScreenshotTime,
        totalLength: screenshotLogs.length,
        activity_data: filteredLogs,
        statusColor,
        activeStatus: [...connectedUsers.values()].includes(user.id),
      };
    });

    // return usersWithStats;
    return usersWithStats.filter((user) => user.totalLength > 0);
  }

  static async usersLogs() {
    const db = getConnection();

    const [rows] = await db.execute(`
      SELECT 
        u.id,
        u.name,
        al.activity_data
      FROM users u
      LEFT JOIN activity_logs al ON u.id = al.user_id
      WHERE u.role != 'admin'
      GROUP BY u.id, u.name
    `);
    const today = new Date().toISOString().slice(0, 10);
    const usersWithStats = rows.map((user) => {
      // let totalActiveHours = 0;
      let totalActiveMinutes = 0;
      let formattedActiveTime = "";
      let activities = [];
      // let screenshotLogs = [];

      try {
        activities = JSON.parse(user.activity_data || "[]");

        // // Only count logs with screenshots
        // screenshotLogs = activities.filter((log) => log.screenshotName);

        // ✅ Filter only today's screenshot logs

        const screenshotLogsToday = activities.filter((log) => {
          if (!log.timestamp || !log.screenshotName) return false;

          const logDate = new Date(log.timestamp).toISOString().slice(0, 10);

          return logDate === today;
        });

        // const totalActiveMinutes = screenshotLogs.length * 10;
        totalActiveMinutes = screenshotLogsToday.length * 10;

        if (totalActiveMinutes < 60) {
          formattedActiveTime = `${totalActiveMinutes} min`;
        } else {
          const hours = Math.floor(totalActiveMinutes / 60);
          const minutes = totalActiveMinutes % 60;
          formattedActiveTime =
            minutes > 0 ? `${hours} hr ${minutes} min` : `${hours}:00 hr`;
        }
      } catch (err) {
        console.error(`Failed to parse activity_data for user ${user.id}`, err);
      }

      return {
        id: user.id,
        name: user.name,
        activeStatus: [...connectedUsers.values()].includes(user.id),
        totalActiveHours: formattedActiveTime,
      };
    });
    usersWithStats.sort((a, b) => {
      if (a.activeStatus === b.activeStatus) return 0;
      return a.activeStatus ? -1 : 1; 
    });
    return usersWithStats;
    // Only return users with screenshots
    // return usersWithStats.filter((user) => user.totalActiveHours !== "0 min");
  }

  static async getUserProfile(id) {
    const db = getConnection();
    const [rows] = await db.execute(
      "SELECT name, email, designation, company FROM users WHERE id = ?",
      [id]
    );
    return rows[0] || null;
  }
}

module.exports = User;
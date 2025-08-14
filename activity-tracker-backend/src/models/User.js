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
        GROUP_CONCAT(al.activity_data) AS activity_data
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
        const activities = user.activity_data || "[]";
        // const activities = JSON.parse(user.activity_data || "[]");
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
        screenshotLogs = filteredLogs.filter((log) => log.screenshotName || log.screenshotUrl);
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

  // static async usersWithLogs(date) {
  //   const db = getConnection();
  //   //const [rows] = await db.execute("SELECT id, name FROM users WHERE role != 'admin'");
  //   const [rows] = await db.execute(`
  //     SELECT 
  //       u.id,
  //       u.name,
  //       GROUP_CONCAT(al.activity_data) AS activity_data
  //     FROM users u
  //     LEFT JOIN activity_logs al ON u.id = al.user_id
  //     WHERE u.role != 'admin'
  //     GROUP BY u.id, u.name
  // `);

  //   const usersWithStats = rows.map((user) => {
  //     let totalActiveHours = 0;
  //     let lastScreenshotTime = null;
  //     let screenshotLogs = [];
  //     let formattedActiveTime = "";
  //     let activities = [];
  //     let filteredLogs = [];
  //     let statusColor;
  //     try {
  //       // activities = JSON.parse(user.activity_data || "[]");
  //       activities = user.activity_data || "[]";
  //       filteredLogs = date
  //         ? activities.filter((log) => {
  //             if (!log.timestamp) return false;
  //             const logDate = new Date(log.timestamp)
  //               .toISOString()
  //               .slice(0, 10);
  //             return logDate === date;
  //           })
  //         : [];

  //       screenshotLogs = filteredLogs.filter((log) => log.screenshotName);
  //       if (screenshotLogs.length < 24) {
  //         statusColor = "red";
  //       } else if (screenshotLogs.length >= 24 && screenshotLogs.length <= 36) {
  //         statusColor = "yellow";
  //       } else {
  //         statusColor = "green";
  //       }

  //       const totalActiveMinutes = screenshotLogs.length * 10;

  //       if (totalActiveMinutes < 60) {
  //         formattedActiveTime = `${totalActiveMinutes} min`;
  //       } else {
  //         const hours = Math.floor(totalActiveMinutes / 60);
  //         const minutes = totalActiveMinutes % 60;
  //         formattedActiveTime =
  //           minutes > 0 ? `${hours} hr ${minutes} min` : `${hours}:00 hr`;
  //       }

  //       if (screenshotLogs.length > 0) {
  //         const latestLog = screenshotLogs.reduce((a, b) =>
  //           new Date(a.timestamp) > new Date(b.timestamp) ? a : b
  //         );
  //         const date = new Date(latestLog.timestamp);
  //         let hours = date.getHours();
  //         const minutes = String(date.getMinutes()).padStart(2, "0");
  //         const ampm = hours >= 12 ? "PM" : "AM";
  //         hours = hours % 12;
  //         hours = hours ? hours : 12; // Convert 0 to 12
  //         const hourStr = String(hours).padStart(2, "0");
  //         lastScreenshotTime = `${hourStr}:${minutes} ${ampm}`;
  //       }
  //     } catch (err) {
  //       console.error(`Failed to parse activity_data for user ${user.id}`, err);
  //     }
  //     return {
  //       id: user.id,
  //       name: user.name,
  //       totalActiveHours: formattedActiveTime,
  //       lastScreenshotTime,
  //       totalLength: screenshotLogs.length,
  //       activity_data: filteredLogs,
  //       statusColor,
  //       activeStatus: [...connectedUsers.values()].includes(user.id),
  //     };
  //   });

  //   // return usersWithStats;
  //   return usersWithStats.filter((user) => user.totalLength > 0);
  // }
  // Uncomment if you need to implement usersLogs method for Dev mode
  
static async usersWithLogs(date) {
  const db = getConnection();

  const [rows] = await db.execute(`
    SELECT u.id AS userId, u.name, al.activity_data
    FROM users u
    LEFT JOIN activity_logs al 
      ON u.id = al.user_id
    WHERE u.role != 'admin'
  `);

  const usersMap = {};

  rows.forEach(row => {
    if (!usersMap[row.userId]) {
      usersMap[row.userId] = {
        id: row.userId,
        name: row.name,
        activity_data: []
      };
    }

    if (row.activity_data) {
      try {
        // Handle both string and already-parsed JSON
        const parsed =
          typeof row.activity_data === "string"
            ? JSON.parse(row.activity_data)
            : row.activity_data;

        if (Array.isArray(parsed)) {
          usersMap[row.userId].activity_data.push(...parsed);
        }
      } catch (err) {
        console.error(`Invalid JSON for user ${row.userId}`, err.message);
      }
    }
  });

  // Now apply your filtering and stats logic
  return Object.values(usersMap)
    .map(user => {
      const filteredLogs = date
        ? user.activity_data.filter(log => {
            if (!log.timestamp) return false;
            const logDate = new Date(log.timestamp)
              .toISOString()
              .slice(0, 10);
            return logDate === date;
          })
        : [];

      const screenshotLogs = filteredLogs.filter(
        log => log.screenshotName || log.screenshotUrl
      );
      const totalActiveMinutes = screenshotLogs.length * 10;

      let formattedActiveTime;
      if (totalActiveMinutes < 60) {
        formattedActiveTime = `${totalActiveMinutes} min`;
      } else {
        const hours = Math.floor(totalActiveMinutes / 60);
        const minutes = totalActiveMinutes % 60;
        formattedActiveTime =
          minutes > 0 ? `${hours} hr ${minutes} min` : `${hours}:00 hr`;
      }

      let lastScreenshotTime = null;
      if (screenshotLogs.length > 0) {
        const latestLog = screenshotLogs.reduce((a, b) =>
          new Date(a.timestamp) > new Date(b.timestamp) ? a : b
        );
        const dateObj = new Date(latestLog.timestamp);
        let hours = dateObj.getHours();
        const minutes = String(dateObj.getMinutes()).padStart(2, "0");
        const ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12 || 12;
        lastScreenshotTime = `${String(hours).padStart(2, "0")}:${minutes} ${ampm}`;
      }

      let statusColor;
      if (screenshotLogs.length < 24) {
        statusColor = "red";
      } else if (screenshotLogs.length <= 36) {
        statusColor = "yellow";
      } else {
        statusColor = "green";
      }

      return {
        ...user,
        totalActiveHours: formattedActiveTime,
        lastScreenshotTime,
        totalLength: screenshotLogs.length,
        activity_data: filteredLogs,
        statusColor,
        activeStatus: [...connectedUsers.values()].includes(user.id)
      };
    })
    .filter(user => user.totalLength > 0);
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
  `);

  const today = new Date().toISOString().slice(0, 10);

  // Group activities by user
  const userMap = new Map();

  for (const row of rows) {
    if (!userMap.has(row.id)) {
      userMap.set(row.id, {
        id: row.id,
        name: row.name,
        activities: []
      });
    }

    if (row.activity_data) {
      try {
        // Parse JSON string into an array
        // const parsed = JSON.parse(row.activity_data);
        const parsed = row.activity_data;
        if (Array.isArray(parsed)) {
          userMap.get(row.id).activities.push(...parsed);
        }
      } catch (err) {
        console.error(`Invalid JSON for user ${row.id}`, err);
      }
    }
  }

  // Build final stats list
  const usersWithStats = Array.from(userMap.values()).map((user) => {
    let totalActiveMinutes = 0;
    let formattedActiveTime = "";

    // Filter only today's screenshot logs
    const screenshotLogsToday = user.activities.filter((log) => {
      if (!log.timestamp || !log.screenshotUrl) return false;
      const logDate = new Date(log.timestamp).toISOString().slice(0, 10);
      return logDate === today;
    });

    totalActiveMinutes = screenshotLogsToday.length * 10;

    if (totalActiveMinutes < 60) {
      formattedActiveTime = `${totalActiveMinutes} min`;
    } else {
      const hours = Math.floor(totalActiveMinutes / 60);
      const minutes = totalActiveMinutes % 60;
      formattedActiveTime =
        minutes > 0 ? `${hours} hr ${minutes} min` : `${hours}:00 hr`;
    }

    return {
      id: user.id,
      name: user.name,
      activeStatus: [...connectedUsers.values()].includes(user.id),
      totalActiveHours: formattedActiveTime,
    };
  });

  // Sort active users first
  usersWithStats.sort((a, b) => {
    if (a.activeStatus === b.activeStatus) return 0;
    return a.activeStatus ? -1 : 1;
  });

  return usersWithStats;
}



  // static async usersLogs() {
  //   const db = getConnection();

  //   const [rows] = await db.execute(`
  //     SELECT 
  //       u.id,
  //       u.name,
  //       GROUP_CONCAT(al.activity_data) AS activity_data
  //     FROM users u
  //     LEFT JOIN activity_logs al ON u.id = al.user_id
  //     WHERE u.role != 'admin'
  //     GROUP BY u.id, u.name
  //   `);
  //   const today = new Date().toISOString().slice(0, 10);
  //   const usersWithStats = rows.map((user) => {
  //     // let totalActiveHours = 0;
  //     let totalActiveMinutes = 0;
  //     let formattedActiveTime = "";
  //     let activities = [];
  //     // let screenshotLogs = [];

  //     try {
  //       activities = user.activity_data || "[]";
  //       // activities = JSON.parse(user.activity_data || "[]");
  //       // // Only count logs with screenshots
  //       // screenshotLogs = activities.filter((log) => log.screenshotName);

  //       // ✅ Filter only today's screenshot logs

  //       const screenshotLogsToday = activities.filter((log) => {
  //         if (!log.timestamp || !log.screenshotName) return false;

  //         const logDate = new Date(log.timestamp).toISOString().slice(0, 10);

  //         return logDate === today;
  //       });

  //       // const totalActiveMinutes = screenshotLogs.length * 10;
  //       totalActiveMinutes = screenshotLogsToday.length * 10;

  //       if (totalActiveMinutes < 60) {
  //         formattedActiveTime = `${totalActiveMinutes} min`;
  //       } else {
  //         const hours = Math.floor(totalActiveMinutes / 60);
  //         const minutes = totalActiveMinutes % 60;
  //         formattedActiveTime =
  //           minutes > 0 ? `${hours} hr ${minutes} min` : `${hours}:00 hr`;
  //       }
  //     } catch (err) {
  //       console.error(`Failed to parse activity_data for user ${user.id}`, err);
  //     }

  //     return {
  //       id: user.id,
  //       name: user.name,
  //       activeStatus: [...connectedUsers.values()].includes(user.id),
  //       totalActiveHours: formattedActiveTime,
  //     };
  //   });
  //   usersWithStats.sort((a, b) => {
  //     if (a.activeStatus === b.activeStatus) return 0;
  //     return a.activeStatus ? -1 : 1; 
  //   });
  //   return usersWithStats;
  //   // Only return users with screenshots
  //   // return usersWithStats.filter((user) => user.totalActiveHours !== "0 min");
  // }

  // static async usersLogs() {
  //   const db = getConnection();

  //   const [rows] = await db.execute(`
  //     SELECT 
  //       u.id,
  //       u.name,
  //       JSON_ARRAYAGG(al.activity_data) AS activity_data
  //     FROM users u
  //     LEFT JOIN activity_logs al ON u.id = al.user_id
  //     WHERE u.role != 'admin'
  //     GROUP BY u.id, u.name
  //   `);

  //   const today = new Date().toISOString().slice(0, 10);

  //   const usersWithStats = rows.map((user) => {
  //     let totalActiveMinutes = 0;
  //     let formattedActiveTime = "";
  //     let activities = [];

  //     try {
  //       activities = JSON.parse(user.activity_data || "[]").flat();

  //       const screenshotLogsToday = activities.filter((log) => {
  //         if (!log.timestamp || !log.screenshotName) return false;
  //         const logDate = new Date(log.timestamp).toISOString().slice(0, 10);
  //         return logDate === today;
  //       });

  //       totalActiveMinutes = screenshotLogsToday.length * 10;

  //       if (totalActiveMinutes < 60) {
  //         formattedActiveTime = `${totalActiveMinutes} min`;
  //       } else {
  //         const hours = Math.floor(totalActiveMinutes / 60);
  //         const minutes = totalActiveMinutes % 60;
  //         formattedActiveTime =
  //           minutes > 0 ? `${hours} hr ${minutes} min` : `${hours}:00 hr`;
  //       }
  //     } catch (err) {
  //       console.error(`Failed to parse activity_data for user ${user.id}`, err);
  //     }

  //     return {
  //       id: user.id,
  //       name: user.name,
  //       activeStatus: [...connectedUsers.values()].includes(user.id),
  //       totalActiveHours: formattedActiveTime,
  //     };
  //   });

  //   usersWithStats.sort((a, b) => {
  //     if (a.activeStatus === b.activeStatus) return 0;
  //     return a.activeStatus ? -1 : 1;
  //   });

  //   return usersWithStats;
  // }

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
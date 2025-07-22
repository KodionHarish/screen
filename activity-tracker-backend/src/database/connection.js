const mysql = require('mysql2/promise');
const dbConfig = require('../config/database');

let connection = null;

const connectDatabase = async () => {
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to MySQL database');
    return connection;
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
};

const getConnection = () => {
  if (!connection) {
    throw new Error('Database not connected');
  }
  return connection;
};

module.exports = {
  connectDatabase,
  getConnection
};
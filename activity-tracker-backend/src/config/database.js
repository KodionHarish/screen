const config = require('./config');

const dbConfig = {
  ...config.DB_CONFIG,
  // acquireTimeout: 60000,
  connectTimeout: 60000,
  // reconnect: true
};

module.exports = dbConfig;
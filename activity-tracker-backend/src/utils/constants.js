const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
};

const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user'
};

const ACTIVITY_TYPES = {
  APP_USAGE: 'app_usage',
  SCREEN_CAPTURE: 'screen_capture'
};

module.exports = {
  HTTP_STATUS,
  USER_ROLES,
  ACTIVITY_TYPES
};
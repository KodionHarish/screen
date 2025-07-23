const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { errorResponse } = require('../utils/response');
const { HTTP_STATUS } = require('../utils/constants')
const authenticate = (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return errorResponse(res, 'Unauthorized - Token missing', HTTP_STATUS.UNAUTHORIZED);
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return errorResponse(res, 'Invalid token', HTTP_STATUS.UNAUTHORIZED);
  }
};

const authorizeRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return errorResponse(res, 'Forbidden - Insufficient permissions', HTTP_STATUS.FORBIDDEN);
    } 
    next();
  };
};

module.exports = {
  authenticate,
  authorizeRole
};  
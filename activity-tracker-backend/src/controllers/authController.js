// src/controllers/authController.js
const AuthService = require('../services/authService');
const { successResponse, errorResponse } = require('../utils/response');
const config = require('../config/config');
const { HTTP_STATUS } = require('../utils/constants');

class AuthController {
  static async register(req, res) {
    try {
      const userData = req.body;
      await AuthService.register(userData);
      
      successResponse(res, 'Registration successful', null, HTTP_STATUS.CREATED);
    } catch (error) {
      errorResponse(res, error.message, HTTP_STATUS.BAD_REQUEST);
    }
  }

  static async login(req, res) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);
      
      // Set cookie
      res.cookie('token', result.token, {
        httpOnly: true,
        secure: config.NODE_ENV === 'production',
        sameSite: 'Strict',
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      });
       res.json({
        message: "Login successful",
        token: result.token,
        user:result.user,
        result
      });
      // successResponse(res, 'Login successful', result);
    } catch (error) {
      errorResponse(res, error.message, HTTP_STATUS.UNAUTHORIZED);
    }
  }

  static async logout(req, res) {
    try {
      res.clearCookie('token', {
        httpOnly: true,
        secure: config.NODE_ENV === 'production',
        sameSite: 'Strict',
      });
      
      successResponse(res, 'Logged out successfully');
    } catch (error) {
      errorResponse(res, error.message);
    }
  }

  static async checkAuth(req, res) {
    try {
      const token = req.cookies.token;
       
      if (!token) {
        return errorResponse(res, 'Unauthorized', HTTP_STATUS.UNAUTHORIZED);
      }

      const decoded = AuthService.verifyToken(token);
      successResponse(res, 'Authenticated', {
        userId: decoded.id,
        role: decoded.role
      });
    } catch (error) {
      errorResponse(res, 'Invalid token', HTTP_STATUS.UNAUTHORIZED);
    }
  }
}

module.exports = AuthController;
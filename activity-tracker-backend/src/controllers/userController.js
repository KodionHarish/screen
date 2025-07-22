// src/controllers/userController.js
const UserService = require('../services/userService');
const { successResponse, errorResponse } = require('../utils/response');
const { HTTP_STATUS } = require('../utils/constants');

class UserController {
  static async getAllUsers(req, res) {
    try {
      const users = await UserService.getAllUsers();
      successResponse(res, 'Users retrieved successfully', users);
    } catch (error) {
      errorResponse(res, error.message);
    }
  }

  static async getAllUsersCount(req, res) {
    try {
      const UsersCount = await UserService.getAllUsersCount();
      successResponse(res, 'Users retrieved successfully', UsersCount);
    } catch (error) {
      errorResponse(res, error.message);
    }
  }

  static async selectedUser(req,res)
  {
    try {
      const users = await UserService.selectedUser(req.query.date);
      successResponse(res, 'Users retrieved successfully', users);
    } catch (error) {
      errorResponse(res, error.message);
    }
  }
  static async usersWithLogs(req,res)
  {
    try {
      const users = await UserService.usersWithLogs(req.query.date);
      successResponse(res, 'Users retrieved successfully', users);
    } catch (error) {
      errorResponse(res, error.message);
    }
  }
  static async usersLogs(req,res)
    {
      try {
        const users = await UserService.usersLogs();
        successResponse(res, 'Users retrieved successfully', users);
      } catch (error) {
        errorResponse(res, error.message);
      }
  }
  static async getUserProfile(req, res) {
    try {
      const userId = req.user.id;
      const user = await UserService.getUserProfile(userId);
      successResponse(res, 'Profile retrieved successfully', user);
    } catch (error) {
      errorResponse(res, error.message, HTTP_STATUS.NOT_FOUND);
    }
  }
}

module.exports = UserController;
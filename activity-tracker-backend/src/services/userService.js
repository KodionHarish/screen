// src/services/userService.js
const User = require('../models/User');

class UserService {
  static async getAllUsers() {
    return await User.getAllUsers();
  }

  static async getAllUsersCount() {
    return await User.getAllUsersCount();
  }

  static async getUserProfile(userId) {
    const user = await User.getUserProfile(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  static async usersWithLogs(date)
  {
    return await User.usersWithLogs(date);
  }

  static async usersLogs()
  {
    return await User.usersLogs();
  }

   static async selectedUser(date)
  {
    return await User.selectedUser(date);
  }

  
}

module.exports = UserService;
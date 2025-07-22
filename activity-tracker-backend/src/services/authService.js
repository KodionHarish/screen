// src/services/authService.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/config');

class AuthService {
  static async register(userData) {
    const existingUser = await User.findByEmail(userData.email);
    
    if (existingUser) {
      throw new Error('Email already registered');
    }

    const newUser = await User.create(userData);
    return newUser;
  }

  static async login(email, password) {
    const user = await User.findByEmail(email);
    
    if (!user) {
      throw new Error('Email not found');
    }

    if (user.password !== password) {
      throw new Error('Incorrect password');
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      config.JWT_SECRET,
      { expiresIn: '1d' }
    );

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        designation: user.designation,
        company: user.company,
        role: user.role
      }
    };
  }

  static verifyToken(token) {
    try {
      return jwt.verify(token, config.JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
}

module.exports = AuthService;
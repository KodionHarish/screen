

// src/routes/users.js
const express = require('express');
const UserController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, UserController.getAllUsers);
router.get('/getAllUsersCount', authenticate, UserController.getAllUsersCount);
router.get('/usersWithLogs', authenticate, UserController.usersWithLogs);
router.get('/usersLogs', authenticate, UserController.usersLogs);
router.get('/selectedUser', authenticate, UserController.selectedUser);


router.get('/profile', authenticate, UserController.getUserProfile);

module.exports = router;
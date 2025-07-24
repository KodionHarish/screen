// src/routes/activities.js
const express = require('express');
const ActivityController = require('../controllers/activityController');
const { authenticate } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

const router = express.Router();
 
router.post('/log', upload.single('screenshot'), ActivityController.logActivity);
// router.get('/tracking-status/:userId', ActivityController.getTrackingStatus);
router.get('/user/:userId', authenticate, ActivityController.getUserActivities);
router.get('/all-activity', authenticate, ActivityController.getAllActivities);
router.get('/delete-screenshot/:userId/:id', authenticate, ActivityController.deleteScreenshot);
router.delete('/old-logs', authenticate, ActivityController.deleteOldLogs);
module.exports = router;
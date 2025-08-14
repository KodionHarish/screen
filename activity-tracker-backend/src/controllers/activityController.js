// src/controllers/activityController.js
const ActivityService = require("../services/activityService");
const { successResponse, errorResponse } = require("../utils/response");
const connectedUsers = require("../utils/socketStore");
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

// ✅ Helper functions for processing detailed tracking data
function getMostPressedKey(keyPressDetails) {
  if (!keyPressDetails || Object.keys(keyPressDetails).length === 0) {
    return null;
  }
  
  return Object.entries(keyPressDetails).reduce((max, [key, count]) => {
    return count > (max.count || 0) ? { key, count } : max;
  }, {});
}

function getDominantClickType(mouseClickDetails) {
  if (!mouseClickDetails || Object.keys(mouseClickDetails).length === 0) {
    return null;
  }
  
  return Object.entries(mouseClickDetails).reduce((max, [type, count]) => {
    return count > (max.count || 0) ? { type, count } : max;
  }, {});
}

function calculateKeyPressVariety(keyPressDetails) {
  if (!keyPressDetails || Object.keys(keyPressDetails).length === 0) {
    return 0;
  }
  
  const totalPresses = Object.values(keyPressDetails).reduce((sum, count) => sum + count, 0);
  const uniqueKeys = Object.keys(keyPressDetails).length;
  
  // Calculate variety score (0-1, where 1 means perfectly distributed)
  if (totalPresses === 0) return 0;
  
  const expectedPressesPerKey = totalPresses / uniqueKeys;
  const variance = Object.values(keyPressDetails).reduce((sum, count) => {
    return sum + Math.pow(count - expectedPressesPerKey, 2);
  }, 0) / uniqueKeys;
  
  // Normalize variance to get variety score
  const maxVariance = Math.pow(expectedPressesPerKey, 2);
  return Math.max(0, 1 - (variance / maxVariance));
}
  

class ActivityController {

  // Updated logActivity method for your controller
  static async logActivity(req, res,screenshotUrl) {
  try {
    const {
      id,
      userId,
      appName,
      windowTitle,
      duration,
      keyboardCount,
      mouseCount,
      memo,
      keyPressDetails,
      mouseClickDetails
    } = req.body;


    // Parse the JSON strings for detailed tracking data
    let parsedKeyPressDetails = {};
    let parsedMouseClickDetails = {};

    try {
      parsedKeyPressDetails = keyPressDetails ? JSON.parse(keyPressDetails) : {};
    } catch (parseError) {
      console.log("⚠️ Error parsing keyPressDetails:", parseError.message);
      parsedKeyPressDetails = {};
    }

    try {
      parsedMouseClickDetails = mouseClickDetails ? JSON.parse(mouseClickDetails) : {};
    } catch (parseError) {
      console.log("⚠️ Error parsing mouseClickDetails:", parseError.message);
      parsedMouseClickDetails = {};
    }

    // Enhanced activity data with detailed tracking
    const activityData = {
      id,
      appName,
      windowTitle,
      duration: parseInt(duration),
      keyboardCount: parseInt(keyboardCount),
      mouseCount: parseInt(mouseCount),
      memo: memo || "",
      // screenshotName: req.file ? req.file.originalname : null,
      screenshotUrl,
      timestamp: new Date().toISOString(),
      
      // ✅ NEW: Detailed tracking data
      keyPressDetails: parsedKeyPressDetails,
      mouseClickDetails: parsedMouseClickDetails,
      
      // ✅ NEW: Summary statistics
      totalUniqueKeys: Object.keys(parsedKeyPressDetails).length,
      mostPressedKey: getMostPressedKey(parsedKeyPressDetails),
      keyPressVariety: calculateKeyPressVariety(parsedKeyPressDetails),
      
      // Mouse statistics
      totalMouseClicks: Object.values(parsedMouseClickDetails).reduce((sum, count) => sum + count, 0),
      dominantClickType: getDominantClickType(parsedMouseClickDetails),
    };
 
    await ActivityService.logActivity(userId, activityData);
    const io = req.app.get("io");
   
    io.emit("activity-logged", { 
      userId,
      detailedStats: {
        keyPressDetails: parsedKeyPressDetails,
        mouseClickDetails: parsedMouseClickDetails,
        totalKeys: parseInt(keyboardCount),
        totalMouse: parseInt(mouseCount) 
      }
    });
    
    successResponse(res, "Activity logged successfully", {
      keyStats: {
        totalKeys: parseInt(keyboardCount),
        uniqueKeys: Object.keys(parsedKeyPressDetails).length,
        mostPressed: getMostPressedKey(parsedKeyPressDetails)
      },
      mouseStats: {
        totalMouse: parseInt(mouseCount),
        clickBreakdown: parsedMouseClickDetails
      },
      screenshotUrl 
    });
  } catch (error) {
    console.log(error, 'Error logging activity with detailed tracking');
    errorResponse(res, error.message);
  }
}

  static getSocketIdByUserId(userId) {
    console.log(connectedUsers,userId,'connectedUsers')
  for (const [socketId, uId] of connectedUsers.entries()) {
    if (uId == userId) {
      console.log(uId,userId,'iiiiiiiiii')
      return socketId;
    }
  }
  return null; // not found
}

  static async deleteScreenshot(req, res) {
    try {
      const id = req.params.id;
      const userId = req.params.userId;
      const result = await ActivityService.deleteScreenshot(userId, id);
      successResponse(res, "Activities retrieved successfully", result);
    } catch (error) {
      errorResponse(res, error.message);
    }
  }

  static async getUserActivities(req, res) {
    try {
      const userId = req.params.userId;
      const filterDate = req.query.date;

      const result = await ActivityService.getUserActivities(
        userId,
        filterDate
      );
      successResponse(res, "Activities retrieved successfully", result);
    } catch (error) {
      errorResponse(res, error.message);
    }
  }

  static async getAllActivities(req, res) {
    try {
      const activities = await ActivityService.getAllActivities();
      successResponse(res, "All activities retrieved successfully", {
        logs: activities,
      });
    } catch (error) {
      errorResponse(res, error.message);
    }
  }

  static async deleteOldLogs(req, res) {
    try {
      const days = parseInt(req.query.days) || 15; // Default to 15 days if not specified
      console.log(days,"days")
      // Validate days parameter 
      if (days < 1 || days > 365) {
        return res.status(400).json({
          success: false,
          message: 'Days parameter must be between 1 and 365'
        });
      }

      const deletedCount = await ActivityService.deleteOldLogs(days);
      
      res.status(200).json({
        success: true,
        message: `Successfully deleted ${deletedCount} old log entries`,
        deletedCount: deletedCount,
        cutoffDays: days
      });
    } catch (error) {
      console.error('Error deleting old logs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete old logs',
        error: error.message
      });
    }
  }
  
}

module.exports = ActivityController;
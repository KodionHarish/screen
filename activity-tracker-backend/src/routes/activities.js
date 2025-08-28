// src/routes/activities.js
const express = require('express');
const ActivityController = require('../controllers/activityController');
const { authenticate } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

const router = express.Router();
 
router.post('/log', upload.single('screenshot'), async (req, res) => {
  try {
    let screenshotUrl = null;

    if (req.file) {
      // Upload from memory to Cloudinary
      const cloudinaryResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'activity_screenshots' },
          (error, result) => {
            if (result) resolve(result);
            else reject(error);
          }
        );
        streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
      });

      screenshotUrl = cloudinaryResult.secure_url;
    }

    // Pass Cloudinary URL to controller
    await ActivityController.logActivity(req, res, screenshotUrl);

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Upload failed' });
  }
});

router.get('/user/:userId', authenticate, ActivityController.getUserActivities);
router.get('/all-activity', authenticate, ActivityController.getAllActivities);
router.get('/delete-screenshot/:userId/:id', authenticate, ActivityController.deleteScreenshot);
router.delete('/old-logs', authenticate, ActivityController.deleteOldLogs);
module.exports = router;
// src/routes/activities.js
const express = require('express');
const ActivityController = require('../controllers/activityController');
const { authenticate } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

const router = express.Router();
 
// router.post('/log', upload.single('screenshot'), ActivityController.logActivity);
// router.post('/log', upload.single('screenshot'), async (req, res) => {
//   try {
//     if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

//     // Upload to Cloudinary
//     const result = await new Promise((resolve, reject) => {
//       const stream = cloudinary.uploader.upload_stream(
//         { folder: 'activity_screenshots' }, // Optional folder name
//         (error, result) => {
//           if (result) resolve(result);
//           else reject(error);
//         }
//       );
//       streamifier.createReadStream(req.file.buffer).pipe(stream);
//     });

//     // Call your controller with Cloudinary URL instead of local path
//     await ActivityController.logActivity(req, res, result.secure_url);

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: 'Upload failed' });
//   }
// });
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
// src/routes/notify.js
const express = require("express");
const router = express.Router();
const NotifyController = require("../controllers/notifyController");
const { authenticate } = require("../middleware/auth");

// Manual email trigger (admin)
router.post("/force-email", authenticate, NotifyController.forceEmailSend);

module.exports = router;

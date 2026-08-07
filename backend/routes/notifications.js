const express = require('express');
const {
  getNotifications,
  createAnnouncement,
  markAsRead,
  markAllAsRead,
} = require('../controllers/notificationController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // protect all routes

router.route('/')
  .get(getNotifications)
  .post(authorize('Admin'), createAnnouncement);

router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);

module.exports = router;

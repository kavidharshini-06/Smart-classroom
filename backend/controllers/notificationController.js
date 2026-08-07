const Notification = require('../models/Notification');

// @desc    Get notifications for the logged-in user
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res, next) => {
  try {
    const userRole = req.user.role;
    const userId = req.user._id;

    let query = {};

    if (userRole === 'Admin') {
      // Admins see everything
      query = {};
    } else {
      // Faculty/Students see notifications matching their role, 'All', or explicitly targeted to them
      query = {
        $or: [
          { recipientRole: 'All' },
          { recipientRole: userRole },
          { recipients: userId },
        ],
      };
    }

    const notifications = await Notification.find(query)
      .populate('sender', 'name email role')
      .sort({ createdAt: -1 });

    // Calculate unread count
    const unreadCount = notifications.filter(
      notif => !notif.readBy.some(id => id.toString() === userId.toString())
    ).length;

    res.status(200).json({
      success: true,
      unreadCount,
      count: notifications.length,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create announcement (Admin only)
// @route   POST /api/notifications
// @access  Private/Admin
exports.createAnnouncement = async (req, res, next) => {
  try {
    const { title, message, recipientRole, recipients } = req.body;

    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Title and message are required' });
    }

    const announcement = await Notification.create({
      sender: req.user._id,
      title,
      message,
      recipientRole: recipientRole || 'All',
      recipients: recipients || [],
      readBy: [req.user._id], // sender already read it
    });

    const populated = await Notification.findById(announcement._id).populate('sender', 'name email role');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    // Add to readBy array if not already present
    if (!notification.readBy.some(id => id.toString() === req.user._id.toString())) {
      notification.readBy.push(req.user._id);
      await notification.save();
    }

    res.status(200).json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllAsRead = async (req, res, next) => {
  try {
    const userRole = req.user.role;
    const userId = req.user._id;

    let query = {};
    if (userRole !== 'Admin') {
      query = {
        $or: [
          { recipientRole: 'All' },
          { recipientRole: userRole },
          { recipients: userId },
        ],
      };
    }

    // Update all matching notifications that are not read by the user
    await Notification.updateMany(
      {
        ...query,
        readBy: { $ne: userId },
      },
      {
        $addToSet: { readBy: userId },
      }
    );

    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

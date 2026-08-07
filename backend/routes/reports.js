const express = require('express');
const {
  getDashboardStats,
  getClassroomUtilization,
  getFacultyWorkload,
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // protect all routes

router.get('/dashboard-stats', authorize('Admin'), getDashboardStats);
router.get('/classroom-utilization', getClassroomUtilization);
router.get('/faculty-workload', getFacultyWorkload);

module.exports = router;

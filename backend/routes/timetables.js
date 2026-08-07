const express = require('express');
const {
  getTimetable,
  autoGenerateTimetable,
  updateTimetableSlot,
  createTimetableSlot,
  deleteTimetableSlot,
  clearTimetable,
} = require('../controllers/timetableController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // protect all routes

router.route('/')
  .get(getTimetable)
  .post(authorize('Admin'), createTimetableSlot);

router.post('/generate', authorize('Admin'), autoGenerateTimetable);
router.delete('/clear', authorize('Admin'), clearTimetable);

router.route('/:id')
  .put(authorize('Admin'), updateTimetableSlot)
  .delete(authorize('Admin'), deleteTimetableSlot);

module.exports = router;

const express = require('express');
const {
  getClassrooms,
  getClassroomById,
  createClassroom,
  updateClassroom,
  deleteClassroom,
} = require('../controllers/classroomController');
const { protect, authorize } = require('../middleware/auth');
const { validateClassroom } = require('../middleware/validation');

const router = express.Router();

router.use(protect); // protect all routes

router
  .route('/')
  .get(getClassrooms)
  .post(authorize('Admin'), validateClassroom, createClassroom);

router
  .route('/:id')
  .get(getClassroomById)
  .put(authorize('Admin'), validateClassroom, updateClassroom)
  .delete(authorize('Admin'), deleteClassroom);

module.exports = router;

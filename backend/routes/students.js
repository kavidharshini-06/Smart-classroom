const express = require('express');
const {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
} = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/auth');
const { validateStudent } = require('../middleware/validation');

const router = express.Router();

router.use(protect); // protect all routes

router
  .route('/')
  .get(getStudents)
  .post(authorize('Admin'), validateStudent, createStudent);

router
  .route('/:id')
  .get(getStudentById)
  .put(authorize('Admin'), validateStudent, updateStudent)
  .delete(authorize('Admin'), deleteStudent);

module.exports = router;

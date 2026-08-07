const express = require('express');
const {
  getFaculty,
  getFacultyById,
  createFaculty,
  updateFaculty,
  deleteFaculty,
} = require('../controllers/facultyController');
const { protect, authorize } = require('../middleware/auth');
const { validateFaculty } = require('../middleware/validation');

const router = express.Router();

router.use(protect); // protect all routes

router
  .route('/')
  .get(getFaculty)
  .post(authorize('Admin'), validateFaculty, createFaculty);

router
  .route('/:id')
  .get(getFacultyById)
  .put(authorize('Admin'), validateFaculty, updateFaculty)
  .delete(authorize('Admin'), deleteFaculty);

module.exports = router;

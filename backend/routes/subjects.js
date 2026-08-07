const express = require('express');
const {
  getSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
} = require('../controllers/subjectController');
const { protect, authorize } = require('../middleware/auth');
const { validateSubject } = require('../middleware/validation');

const router = express.Router();

router.use(protect); // protect all routes

router
  .route('/')
  .get(getSubjects)
  .post(authorize('Admin'), validateSubject, createSubject);

router
  .route('/:id')
  .get(getSubjectById)
  .put(authorize('Admin'), validateSubject, updateSubject)
  .delete(authorize('Admin'), deleteSubject);

module.exports = router;

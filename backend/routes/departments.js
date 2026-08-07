const express = require('express');
const {
  getDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} = require('../controllers/departmentController');
const { protect, authorize } = require('../middleware/auth');
const { validateDepartment } = require('../middleware/validation');

const router = express.Router();

router.use(protect); // protect all routes

router
  .route('/')
  .get(getDepartments)
  .post(authorize('Admin'), validateDepartment, createDepartment);

router
  .route('/:id')
  .get(getDepartment)
  .put(authorize('Admin'), validateDepartment, updateDepartment)
  .delete(authorize('Admin'), deleteDepartment);

module.exports = router;

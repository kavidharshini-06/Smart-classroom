const Faculty = require('../models/Faculty');
const User = require('../models/User');

// @desc    Get all faculty
// @route   GET /api/faculty
// @access  Private
exports.getFaculty = async (req, res, next) => {
  try {
    const faculty = await Faculty.find().populate('department subjects');
    res.status(200).json({ success: true, count: faculty.length, data: faculty });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single faculty
// @route   GET /api/faculty/:id
// @access  Private
exports.getFacultyById = async (req, res, next) => {
  try {
    const faculty = await Faculty.findById(req.params.id).populate('department subjects');
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty member not found' });
    }
    res.status(200).json({ success: true, data: faculty });
  } catch (error) {
    next(error);
  }
};

// @desc    Create faculty profile and associated user login
// @route   POST /api/faculty
// @access  Private/Admin
exports.createFaculty = async (req, res, next) => {
  try {
    const { facultyName, facultyId, department, email, phone, subjects, availableHours } = req.body;

    // Check if faculty ID or email exists in profile
    const existingId = await Faculty.findOne({ facultyId: facultyId.toUpperCase() });
    if (existingId) {
      return res.status(400).json({ success: false, message: 'Faculty ID already exists' });
    }

    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(400).json({ success: false, message: 'Email address already in use' });
    }

    // 1. Create User login credentials
    const user = await User.create({
      name: facultyName,
      email: email.toLowerCase(),
      role: 'Faculty',
      password: 'Faculty@123', // default password
    });

    // 2. Create Faculty Profile referencing User
    const faculty = await Faculty.create({
      user: user._id,
      facultyName,
      facultyId: facultyId.toUpperCase(),
      department,
      email: email.toLowerCase(),
      phone,
      subjects: subjects || [],
      availableHours: availableHours || [],
    });

    res.status(201).json({ success: true, data: faculty });
  } catch (error) {
    next(error);
  }
};

// @desc    Update faculty profile
// @route   PUT /api/faculty/:id
// @access  Private/Admin
exports.updateFaculty = async (req, res, next) => {
  try {
    let faculty = await Faculty.findById(req.params.id);
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty member not found' });
    }

    const { facultyName, facultyId, department, email, phone, subjects, availableHours } = req.body;

    // Validation checks for unique fields
    if (facultyId) {
      const existingId = await Faculty.findOne({
        facultyId: facultyId.toUpperCase(),
        _id: { $ne: req.params.id },
      });
      if (existingId) {
        return res.status(400).json({ success: false, message: 'Faculty ID already exists' });
      }
      req.body.facultyId = facultyId.toUpperCase();
    }

    if (email) {
      const existingEmail = await User.findOne({
        email: email.toLowerCase(),
        _id: { $ne: faculty.user },
      });
      if (existingEmail) {
        return res.status(400).json({ success: false, message: 'Email address already in use' });
      }
      req.body.email = email.toLowerCase();
    }

    // Update Faculty Profile
    faculty = await Faculty.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    // Update user login details
    await User.findByIdAndUpdate(faculty.user, {
      name: facultyName || faculty.facultyName,
      email: email ? email.toLowerCase() : faculty.email,
    });

    res.status(200).json({ success: true, data: faculty });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete faculty profile and login user
// @route   DELETE /api/faculty/:id
// @access  Private/Admin
exports.deleteFaculty = async (req, res, next) => {
  try {
    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty member not found' });
    }

    // Delete User login details
    await User.findByIdAndDelete(faculty.user);
    // Delete Faculty profile
    await faculty.deleteOne();

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

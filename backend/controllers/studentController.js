const Student = require('../models/Student');
const User = require('../models/User');

// @desc    Get all students
// @route   GET /api/students
// @access  Private
exports.getStudents = async (req, res, next) => {
  try {
    const students = await Student.find().populate('department');
    res.status(200).json({ success: true, count: students.length, data: students });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single student
// @route   GET /api/students/:id
// @access  Private
exports.getStudentById = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id).populate('department');
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }
    res.status(200).json({ success: true, data: student });
  } catch (error) {
    next(error);
  }
};

// @desc    Create student profile and user login
// @route   POST /api/students
// @access  Private/Admin
exports.createStudent = async (req, res, next) => {
  try {
    const { registerNumber, studentName, department, year, semester, section, email } = req.body;

    // Check unique register number
    const existingReg = await Student.findOne({ registerNumber: registerNumber.toUpperCase() });
    if (existingReg) {
      return res.status(400).json({ success: false, message: 'Register number already exists' });
    }

    // Set default student email if not provided (e.g. reg_num@college.edu)
    const studentEmail = email ? email.toLowerCase() : `${registerNumber.toLowerCase()}@college.edu`;

    const existingEmail = await User.findOne({ email: studentEmail });
    if (existingEmail) {
      return res.status(400).json({ success: false, message: 'Email address already in use' });
    }

    // 1. Create User login credentials
    const user = await User.create({
      name: studentName,
      email: studentEmail,
      role: 'Student',
      password: 'Student@123', // default password
    });

    // 2. Create Student Profile
    const student = await Student.create({
      user: user._id,
      registerNumber: registerNumber.toUpperCase(),
      studentName,
      department,
      year: Number(year),
      semester: Number(semester),
      section: section.toUpperCase(),
    });

    res.status(201).json({ success: true, data: student });
  } catch (error) {
    next(error);
  }
};

// @desc    Update student profile
// @route   PUT /api/students/:id
// @access  Private/Admin
exports.updateStudent = async (req, res, next) => {
  try {
    let student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    const { registerNumber, studentName, department, year, semester, section, email } = req.body;

    if (registerNumber) {
      const existingReg = await Student.findOne({
        registerNumber: registerNumber.toUpperCase(),
        _id: { $ne: req.params.id },
      });
      if (existingReg) {
        return res.status(400).json({ success: false, message: 'Register number already exists' });
      }
      req.body.registerNumber = registerNumber.toUpperCase();
    }

    if (email) {
      const existingEmail = await User.findOne({
        email: email.toLowerCase(),
        _id: { $ne: student.user },
      });
      if (existingEmail) {
        return res.status(400).json({ success: false, message: 'Email address already in use' });
      }
    }

    if (section) {
      req.body.section = section.toUpperCase();
    }

    // Update Student Profile
    student = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    // Update user login
    const studentEmail = email ? email.toLowerCase() : undefined;
    await User.findByIdAndUpdate(student.user, {
      name: studentName || student.studentName,
      ...(studentEmail && { email: studentEmail }),
    });

    res.status(200).json({ success: true, data: student });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete student profile and user login
// @route   DELETE /api/students/:id
// @access  Private/Admin
exports.deleteStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    // Delete associated User
    await User.findByIdAndDelete(student.user);
    // Delete profile
    await student.deleteOne();

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

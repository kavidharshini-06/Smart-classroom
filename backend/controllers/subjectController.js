const Subject = require('../models/Subject');
const Faculty = require('../models/Faculty');

// Helper to sync subject inside Faculty's list
const addSubjectToFaculty = async (facultyId, subjectId) => {
  if (!facultyId) return;
  await Faculty.findByIdAndUpdate(facultyId, { $addToSet: { subjects: subjectId } });
};

const removeSubjectFromFaculty = async (facultyId, subjectId) => {
  if (!facultyId) return;
  await Faculty.findByIdAndUpdate(facultyId, { $pull: { subjects: subjectId } });
};

// @desc    Get all subjects
// @route   GET /api/subjects
// @access  Private
exports.getSubjects = async (req, res, next) => {
  try {
    const subjects = await Subject.find().populate('department faculty');
    res.status(200).json({ success: true, count: subjects.length, data: subjects });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single subject
// @route   GET /api/subjects/:id
// @access  Private
exports.getSubjectById = async (req, res, next) => {
  try {
    const subject = await Subject.findById(req.params.id).populate('department faculty');
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }
    res.status(200).json({ success: true, data: subject });
  } catch (error) {
    next(error);
  }
};

// @desc    Create subject
// @route   POST /api/subjects
// @access  Private/Admin
exports.createSubject = async (req, res, next) => {
  try {
    const { subjectCode, subjectName, credits, department, semester, faculty, type } = req.body;

    const existing = await Subject.findOne({ subjectCode: subjectCode.toUpperCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Subject code already exists' });
    }

    const subject = await Subject.create({
      subjectCode: subjectCode.toUpperCase(),
      subjectName,
      credits: Number(credits),
      department,
      semester: Number(semester),
      faculty: faculty || null,
      type,
    });

    // Add subject to assigned faculty's subjects list
    if (faculty) {
      await addSubjectToFaculty(faculty, subject._id);
    }

    res.status(201).json({ success: true, data: subject });
  } catch (error) {
    next(error);
  }
};

// @desc    Update subject
// @route   PUT /api/subjects/:id
// @access  Private/Admin
exports.updateSubject = async (req, res, next) => {
  try {
    let subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    const { subjectCode, faculty } = req.body;

    if (subjectCode) {
      const existing = await Subject.findOne({
        subjectCode: subjectCode.toUpperCase(),
        _id: { $ne: req.params.id },
      });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Subject code already exists' });
      }
      req.body.subjectCode = subjectCode.toUpperCase();
    }

    const oldFaculty = subject.faculty ? subject.faculty.toString() : null;
    const newFaculty = faculty || null;

    subject = await Subject.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    // Sync faculty subjects arrays
    if (oldFaculty !== newFaculty) {
      if (oldFaculty) {
        await removeSubjectFromFaculty(oldFaculty, subject._id);
      }
      if (newFaculty) {
        await addSubjectToFaculty(newFaculty, subject._id);
      }
    }

    res.status(200).json({ success: true, data: subject });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete subject
// @route   DELETE /api/subjects/:id
// @access  Private/Admin
exports.deleteSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    // Remove from faculty subjects list
    if (subject.faculty) {
      await removeSubjectFromFaculty(subject.faculty, subject._id);
    }

    await subject.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

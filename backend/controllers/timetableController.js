const Timetable = require('../models/Timetable');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Subject = require('../models/Subject');
const Classroom = require('../models/Classroom');
const { generateTimetable } = require('../utils/scheduler');

// @desc    Get all timetable slots (filtered)
// @route   GET /api/timetables
// @access  Private
exports.getTimetable = async (req, res, next) => {
  try {
    const { department, semester, section, faculty, classroom, studentId } = req.query;
    let query = {};

    if (department) query.department = department;
    if (semester) query.semester = Number(semester);
    if (section) query.section = section.toUpperCase();
    if (faculty) query.faculty = faculty;
    if (classroom) query.classroom = classroom;

    // If student ID is specified, we lookup their department, semester, and section to filter timetable
    if (studentId) {
      const student = await Student.findById(studentId);
      if (student) {
        query.department = student.department;
        query.semester = student.semester;
        query.section = student.section;
      } else {
        return res.status(404).json({ success: false, message: 'Student profile not found' });
      }
    }

    const timetable = await Timetable.find(query)
      .populate('department subject faculty classroom')
      .sort({ day: 1, period: 1 });

    res.status(200).json({ success: true, count: timetable.length, data: timetable });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate a conflict-free timetable automatically
// @route   POST /api/timetables/generate
// @access  Private/Admin
exports.autoGenerateTimetable = async (req, res, next) => {
  try {
    const { departmentId } = req.body; // optional filter

    // 1. Run the scheduling engine
    const result = await generateTimetable(departmentId);

    // 2. Clear old matching timetable slots
    const clearQuery = departmentId ? { department: departmentId } : {};
    await Timetable.deleteMany(clearQuery);

    // 3. Save new scheduled timetable slots
    let inserted = [];
    if (result.scheduled.length > 0) {
      inserted = await Timetable.insertMany(result.scheduled);
    }

    res.status(200).json({
      success: true,
      message: `Successfully scheduled ${inserted.length} classes.`,
      scheduledCount: inserted.length,
      unscheduled: result.unscheduled, // list of items that could not be scheduled due to conflicts
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a timetable slot manually (with conflict validation)
// @route   PUT /api/timetables/:id
// @access  Private/Admin
exports.updateTimetableSlot = async (req, res, next) => {
  try {
    const { day, period, subject, faculty, classroom } = req.body;
    const slotId = req.params.id;

    const currentSlot = await Timetable.findById(slotId);
    if (!currentSlot) {
      return res.status(404).json({ success: false, message: 'Timetable slot not found' });
    }

    // Validate update parameters
    const targetDay = day || currentSlot.day;
    const targetPeriod = Number(period) || currentSlot.period;
    const targetSubjectId = subject || currentSlot.subject;
    const targetFacultyId = faculty || currentSlot.faculty;
    const targetClassroomId = classroom || currentSlot.classroom;

    if (targetPeriod === 4) {
      return res.status(400).json({ success: false, message: 'Cannot schedule classes during Lunch Break (Period 4)' });
    }

    // Fetch details to check capacity and types
    const subObj = await Subject.findById(targetSubjectId);
    const roomObj = await Classroom.findById(targetClassroomId);
    
    if (!subObj || !roomObj) {
      return res.status(400).json({ success: false, message: 'Invalid Subject or Classroom ID' });
    }

    if (subObj.type === 'Lab' && roomObj.type !== 'Lab') {
      return res.status(400).json({ success: false, message: 'Lab subjects must be scheduled in Laboratory rooms' });
    }
    if (subObj.type === 'Theory' && roomObj.type !== 'Classroom') {
      return res.status(400).json({ success: false, message: 'Theory subjects must be scheduled in Classroom rooms' });
    }

    // Conflict Check 1: Faculty overlap
    const facultyOverlap = await Timetable.findOne({
      _id: { $ne: slotId },
      day: targetDay,
      period: targetPeriod,
      faculty: targetFacultyId,
    });
    if (facultyOverlap) {
      return res.status(400).json({ success: false, message: 'Faculty member is already teaching another class during this period' });
    }

    // Conflict Check 2: Classroom overlap
    const roomOverlap = await Timetable.findOne({
      _id: { $ne: slotId },
      day: targetDay,
      period: targetPeriod,
      classroom: targetClassroomId,
    });
    if (roomOverlap) {
      return res.status(400).json({ success: false, message: 'Classroom is already occupied by another class during this period' });
    }

    // Conflict Check 3: Student section overlap
    const studentOverlap = await Timetable.findOne({
      _id: { $ne: slotId },
      day: targetDay,
      period: targetPeriod,
      department: currentSlot.department,
      semester: currentSlot.semester,
      section: currentSlot.section,
    });
    if (studentOverlap) {
      return res.status(400).json({ success: false, message: 'This student section is already attending another class during this period' });
    }

    // If no conflicts, update the slot
    const updatedSlot = await Timetable.findByIdAndUpdate(
      slotId,
      {
        day: targetDay,
        period: targetPeriod,
        subject: targetSubjectId,
        faculty: targetFacultyId,
        classroom: targetClassroomId,
      },
      { new: true, runValidators: true }
    ).populate('department subject faculty classroom');

    res.status(200).json({ success: true, data: updatedSlot });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a timetable slot manually (with conflict validation)
// @route   POST /api/timetables
// @access  Private/Admin
exports.createTimetableSlot = async (req, res, next) => {
  try {
    const { department, semester, section, day, period, subject, faculty, classroom } = req.body;

    if (Number(period) === 4) {
      return res.status(400).json({ success: false, message: 'Cannot schedule classes during Lunch Break (Period 4)' });
    }

    const subObj = await Subject.findById(subject);
    const roomObj = await Classroom.findById(classroom);

    if (!subObj || !roomObj) {
      return res.status(400).json({ success: false, message: 'Invalid Subject or Classroom ID' });
    }

    if (subObj.type === 'Lab' && roomObj.type !== 'Lab') {
      return res.status(400).json({ success: false, message: 'Lab subjects must be scheduled in Laboratory rooms' });
    }
    if (subObj.type === 'Theory' && roomObj.type !== 'Classroom') {
      return res.status(400).json({ success: false, message: 'Theory subjects must be scheduled in Classroom rooms' });
    }

    // Conflict Check 1: Faculty overlap
    const facultyOverlap = await Timetable.findOne({ day, period: Number(period), faculty });
    if (facultyOverlap) {
      return res.status(400).json({ success: false, message: 'Faculty member is already teaching another class during this period' });
    }

    // Conflict Check 2: Classroom overlap
    const roomOverlap = await Timetable.findOne({ day, period: Number(period), classroom });
    if (roomOverlap) {
      return res.status(400).json({ success: false, message: 'Classroom is already occupied by another class during this period' });
    }

    // Conflict Check 3: Student section overlap
    const studentOverlap = await Timetable.findOne({
      day,
      period: Number(period),
      department,
      semester: Number(semester),
      section: section.toUpperCase(),
    });
    if (studentOverlap) {
      return res.status(400).json({ success: false, message: 'This student section is already attending another class during this period' });
    }

    const slot = await Timetable.create({
      department,
      semester: Number(semester),
      section: section.toUpperCase(),
      day,
      period: Number(period),
      subject,
      faculty,
      classroom,
    });

    const populated = await Timetable.findById(slot._id).populate('department subject faculty classroom');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a timetable slot
// @route   DELETE /api/timetables/:id
// @access  Private/Admin
exports.deleteTimetableSlot = async (req, res, next) => {
  try {
    const slot = await Timetable.findById(req.params.id);
    if (!slot) {
      return res.status(404).json({ success: false, message: 'Timetable slot not found' });
    }
    await slot.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

// @desc    Clear entire timetable or for a department
// @route   DELETE /api/timetables/clear
// @access  Private/Admin
exports.clearTimetable = async (req, res, next) => {
  try {
    const { departmentId } = req.body;
    const query = departmentId ? { department: departmentId } : {};
    await Timetable.deleteMany(query);
    res.status(200).json({ success: true, message: 'Timetable cleared successfully' });
  } catch (error) {
    next(error);
  }
};

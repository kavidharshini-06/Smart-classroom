const Department = require('../models/Department');
const Faculty = require('../models/Faculty');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const Classroom = require('../models/Classroom');
const Timetable = require('../models/Timetable');

// @desc    Get Admin Dashboard Statistics
// @route   GET /api/reports/dashboard-stats
// @access  Private/Admin
exports.getDashboardStats = async (req, res, next) => {
  try {
    const totalDepartments = await Department.countDocuments();
    const totalFaculty = await Faculty.countDocuments();
    const totalStudents = await Student.countDocuments();
    const totalSubjects = await Subject.countDocuments();
    const totalRooms = await Classroom.countDocuments();
    const totalTimetables = await Timetable.countDocuments();

    // Today's classes count
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayIndex = new Date().getDay();
    const todayName = daysOfWeek[todayIndex];

    let todaysClassesCount = 0;
    let todaysClasses = [];

    if (['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(todayName)) {
      todaysClassesCount = await Timetable.countDocuments({ day: todayName });
      todaysClasses = await Timetable.find({ day: todayName })
        .populate('department subject faculty classroom')
        .limit(5);
    } else {
      // Fallback for weekend view: show Monday's classes for demo
      todaysClassesCount = await Timetable.countDocuments({ day: 'Monday' });
      todaysClasses = await Timetable.find({ day: 'Monday' })
        .populate('department subject faculty classroom')
        .limit(5);
    }

    // Mock recent activities (highly informative for ERPs)
    const recentActivities = [
      { id: 1, action: 'System Seeding completed', user: 'System', time: 'Just now' },
      { id: 2, action: 'Database models initialized', user: 'Admin', time: '10 mins ago' },
      { id: 3, action: 'Timetable scheduler module loaded', user: 'System', time: '1 hour ago' },
      { id: 4, action: 'Security configurations applied', user: 'Admin', time: '2 hours ago' },
    ];

    res.status(200).json({
      success: true,
      data: {
        totalDepartments,
        totalFaculty,
        totalStudents,
        totalSubjects,
        totalRooms,
        totalTimetables,
        todaysClassesCount,
        todaysClasses,
        recentActivities,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Classroom Utilization Report
// @route   GET /api/reports/classroom-utilization
// @access  Private
exports.getClassroomUtilization = async (req, res, next) => {
  try {
    const classrooms = await Classroom.find({ status: 'Active' });
    const timetable = await Timetable.find();

    // Total schedule slots available per room = 5 days * 6 slots = 30 slots
    const totalSlotsPerWeek = 30;

    const utilizationData = classrooms.map(room => {
      const occupiedSlots = timetable.filter(
        slot => slot.classroom && slot.classroom.toString() === room._id.toString()
      ).length;

      const utilizationPercentage = Math.round((occupiedSlots / totalSlotsPerWeek) * 100);

      return {
        id: room._id,
        roomNumber: room.roomNumber,
        building: room.building,
        capacity: room.capacity,
        type: room.type,
        occupiedSlots,
        utilizationPercentage: Math.min(utilizationPercentage, 100), // Cap at 100% just in case
      };
    });

    res.status(200).json({ success: true, data: utilizationData });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Faculty Workload Report
// @route   GET /api/reports/faculty-workload
// @access  Private
exports.getFacultyWorkload = async (req, res, next) => {
  try {
    const facultyList = await Faculty.find().populate('department');
    const timetable = await Timetable.find();

    const workloadData = facultyList.map(fac => {
      const assignedPeriods = timetable.filter(
        slot => slot.faculty && slot.faculty.toString() === fac._id.toString()
      ).length;

      return {
        id: fac._id,
        facultyId: fac.facultyId,
        facultyName: fac.facultyName,
        departmentCode: fac.department ? fac.department.departmentCode : 'N/A',
        email: fac.email,
        phone: fac.phone,
        assignedPeriods, // each period represents 1 credit/hour of work per week
      };
    });

    res.status(200).json({ success: true, data: workloadData });
  } catch (error) {
    next(error);
  }
};

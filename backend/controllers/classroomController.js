const Classroom = require('../models/Classroom');

// @desc    Get all classrooms
// @route   GET /api/classrooms
// @access  Private
exports.getClassrooms = async (req, res, next) => {
  try {
    const classrooms = await Classroom.find();
    res.status(200).json({ success: true, count: classrooms.length, data: classrooms });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single classroom
// @route   GET /api/classrooms/:id
// @access  Private
exports.getClassroomById = async (req, res, next) => {
  try {
    const classroom = await Classroom.findById(req.params.id);
    if (!classroom) {
      return res.status(404).json({ success: false, message: 'Classroom not found' });
    }
    res.status(200).json({ success: true, data: classroom });
  } catch (error) {
    next(error);
  }
};

// @desc    Create classroom
// @route   POST /api/classrooms
// @access  Private/Admin
exports.createClassroom = async (req, res, next) => {
  try {
    const { roomNumber, building, capacity, type, status } = req.body;

    const existing = await Classroom.findOne({ roomNumber: roomNumber.toUpperCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Room number already exists' });
    }

    const classroom = await Classroom.create({
      roomNumber: roomNumber.toUpperCase(),
      building,
      capacity: Number(capacity),
      type,
      status: status || 'Active',
    });

    res.status(201).json({ success: true, data: classroom });
  } catch (error) {
    next(error);
  }
};

// @desc    Update classroom
// @route   PUT /api/classrooms/:id
// @access  Private/Admin
exports.updateClassroom = async (req, res, next) => {
  try {
    let classroom = await Classroom.findById(req.params.id);
    if (!classroom) {
      return res.status(404).json({ success: false, message: 'Classroom not found' });
    }

    const { roomNumber } = req.body;
    if (roomNumber) {
      const existing = await Classroom.findOne({
        roomNumber: roomNumber.toUpperCase(),
        _id: { $ne: req.params.id },
      });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Room number already exists' });
      }
      req.body.roomNumber = roomNumber.toUpperCase();
    }

    classroom = await Classroom.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, data: classroom });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete classroom
// @route   DELETE /api/classrooms/:id
// @access  Private/Admin
exports.deleteClassroom = async (req, res, next) => {
  try {
    const classroom = await Classroom.findById(req.params.id);
    if (!classroom) {
      return res.status(404).json({ success: false, message: 'Classroom not found' });
    }

    await classroom.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

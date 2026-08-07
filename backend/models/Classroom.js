const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema(
  {
    roomNumber: {
      type: String,
      required: [true, 'Room number is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    building: {
      type: String,
      required: [true, 'Building is required'],
      trim: true,
    },
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: [1, 'Capacity must be at least 1'],
    },
    type: {
      type: String,
      enum: ['Classroom', 'Lab'],
      required: [true, 'Room type is required'],
    },
    status: {
      type: String,
      enum: ['Active', 'Maintenance'],
      default: 'Active',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Classroom', classroomSchema);

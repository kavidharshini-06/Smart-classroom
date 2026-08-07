const Department = require('../models/Department');
const Faculty = require('../models/Faculty');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const Classroom = require('../models/Classroom');
const Timetable = require('../models/Timetable');

/**
 * Scheduling Engine
 * Generates conflict-free timetable entries using a Constraint Satisfaction Heuristic.
 */
async function generateTimetable(departmentId = null) {
  // 1. Fetch all raw data
  const depQuery = departmentId ? { _id: departmentId } : {};
  const departments = await Department.find(depQuery);
  const classrooms = await Classroom.find({ status: 'Active' });
  const facultyList = await Faculty.find().populate('subjects');
  const subjects = await Subject.find(departmentId ? { department: departmentId } : {});
  const students = await Student.find(departmentId ? { department: departmentId } : {});

  const departmentMap = new Map(departments.map(d => [d._id.toString(), d]));
  const facultyMap = new Map(facultyList.map(f => [f._id.toString(), f]));
  const subjectMap = new Map(subjects.map(s => [s._id.toString(), s]));
  const roomMap = new Map(classrooms.map(c => [c._id.toString(), c]));

  // 2. Identify student sections and calculate section sizes
  // A section is defined by (department, semester, section)
  const sections = {};
  students.forEach(student => {
    const key = `${student.department.toString()}-${student.semester}-${student.section}`;
    if (!sections[key]) {
      sections[key] = {
        department: student.department.toString(),
        semester: student.semester,
        section: student.section,
        size: 0,
      };
    }
    sections[key].size += 1;
  });

  // Fallback: if no students in DB yet, create default sections based on subjects
  if (Object.keys(sections).length === 0) {
    const uniqueSemestersAndDeps = new Set();
    subjects.forEach(sub => {
      uniqueSemestersAndDeps.add(`${sub.department.toString()}-${sub.semester}`);
    });

    uniqueSemestersAndDeps.forEach(key => {
      const [depId, sem] = key.split('-');
      const secKey = `${depId}-${sem}-A`;
      sections[secKey] = {
        department: depId,
        semester: parseInt(sem, 10),
        section: 'A',
        size: 40, // default size
      };
    });
  }

  // 3. Compile scheduling tasks
  // For each section, schedule all subjects belonging to that department and semester
  const tasks = [];
  const unscheduledTasks = [];

  for (const sectionKey of Object.keys(sections)) {
    const sec = sections[sectionKey];
    // Find subjects for this department and semester
    const secSubjects = subjects.filter(
      sub => sub.department.toString() === sec.department && sub.semester === sec.semester
    );

    for (const sub of secSubjects) {
      if (!sub.faculty) {
        unscheduledTasks.push({
          subject: sub,
          section: sec,
          reason: 'No faculty assigned to this subject',
        });
        continue;
      }

      const assignedFaculty = facultyMap.get(sub.faculty.toString());
      if (!assignedFaculty) {
        unscheduledTasks.push({
          subject: sub,
          section: sec,
          reason: 'Assigned faculty not found',
        });
        continue;
      }

      if (sub.type === 'Lab') {
        // Lab: 1 session of 3 consecutive periods
        tasks.push({
          id: `${sectionKey}-${sub._id}-lab`,
          subject: sub,
          faculty: assignedFaculty,
          section: sec,
          sectionKey,
          duration: 3,
          type: 'Lab',
          size: sec.size,
        });
      } else {
        // Theory: 'credits' sessions of 1 period each
        const credits = sub.credits || 3;
        for (let i = 0; i < credits; i++) {
          tasks.push({
            id: `${sectionKey}-${sub._id}-theory-${i}`,
            subject: sub,
            faculty: assignedFaculty,
            section: sec,
            sectionKey,
            duration: 1,
            type: 'Theory',
            size: sec.size,
          });
        }
      }
    }
  }

  // 4. Sort tasks: Labs first (highest duration, specific room requirements),
  // then Theory tasks sorted by credits or subject name to remain deterministic
  tasks.sort((a, b) => {
    if (a.duration !== b.duration) {
      return b.duration - a.duration; // Higher duration first
    }
    return b.size - a.size; // Larger class sizes first
  });

  // 5. Initialize tracking structures for conflicts
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const PERIODS = [1, 2, 3, 4, 5, 6, 7];
  const LUNCH_PERIOD = 4; // Period 4 is lunch break

  // Resource availability trackers
  // Structure: [day][period][resourceId] = true (means busy)
  const studentBusy = {};
  const facultyBusy = {};
  const roomBusy = {};
  
  // Track days on which a subject has already been scheduled for a section
  // To avoid scheduling the same theory subject multiple times on the same day
  const subjectDaysScheduled = {}; // [sectionKey][subjectId] = Set of days

  DAYS.forEach(day => {
    studentBusy[day] = {};
    facultyBusy[day] = {};
    roomBusy[day] = {};
    PERIODS.forEach(p => {
      studentBusy[day][p] = {};
      facultyBusy[day][p] = {};
      roomBusy[day][p] = {};
    });
  });

  // 6. Pre-populate trackers if keeping some existing manual entries (optional)
  // Here, we generate from scratch, so we assume all slots are free.

  // 7. Solve and assign slots
  const scheduledEntries = [];

  for (const task of tasks) {
    let allocated = false;
    const candidates = [];

    // Find all valid slots
    for (const day of DAYS) {
      // For theory tasks, we prefer not to schedule on a day that already has this subject
      const hasSubjectToday =
        subjectDaysScheduled[task.sectionKey] &&
        subjectDaysScheduled[task.sectionKey][task.subject._id.toString()] &&
        subjectDaysScheduled[task.sectionKey][task.subject._id.toString()].has(day);

      if (task.type === 'Theory' && hasSubjectToday) {
        continue; // enforce spreading of lectures
      }

      // Check period blocks
      const maxStartPeriod = 8 - task.duration;
      for (let startP = 1; startP <= maxStartPeriod; startP++) {
        const periodBlock = Array.from({ length: task.duration }, (_, i) => startP + i);
        
        // Ensure no periods in the block overlap the lunch period
        if (periodBlock.includes(LUNCH_PERIOD)) {
          continue;
        }

        // Check if student and faculty are free during all periods in the block
        let studentsFree = true;
        let facultyFree = true;

        for (const p of periodBlock) {
          if (studentBusy[day][p][task.sectionKey]) {
            studentsFree = false;
          }
          if (facultyBusy[day][p][task.faculty._id.toString()]) {
            facultyFree = false;
          }
        }

        if (!studentsFree || !facultyFree) {
          continue;
        }

        // Find available rooms that fit type and capacity
        const matchingRooms = classrooms.filter(room => {
          // Check room type compatibility
          if (task.type === 'Lab' && room.type !== 'Lab') return false;
          if (task.type === 'Theory' && room.type !== 'Classroom') return false;
          
          // Check room capacity
          if (room.capacity < task.size) return false;

          // Check if room is free during the period block
          for (const p of periodBlock) {
            if (roomBusy[day][p][room._id.toString()]) {
              return false;
            }
          }
          return true;
        });

        // Store each matching room as a candidate
        matchingRooms.forEach(room => {
          candidates.push({
            day,
            periods: periodBlock,
            room,
            score: room.capacity - task.size, // Heuristic: smaller waste of capacity is better
          });
        });
      }
    }

    // Sort candidates: prioritize least wasted room capacity
    candidates.sort((a, b) => a.score - b.score);

    if (candidates.length > 0) {
      // Assign the best candidate
      const choice = candidates[0];
      const { day, periods, room } = choice;

      periods.forEach(p => {
        studentBusy[day][p][task.sectionKey] = true;
        facultyBusy[day][p][task.faculty._id.toString()] = true;
        roomBusy[day][p][room._id.toString()] = true;

        // Record entry
        scheduledEntries.push({
          department: task.section.department,
          semester: task.section.semester,
          section: task.section.section,
          day,
          period: p,
          subject: task.subject._id,
          faculty: task.faculty._id,
          classroom: room._id,
        });
      });

      // Track day scheduled for theory
      if (task.type === 'Theory') {
        if (!subjectDaysScheduled[task.sectionKey]) {
          subjectDaysScheduled[task.sectionKey] = {};
        }
        if (!subjectDaysScheduled[task.sectionKey][task.subject._id.toString()]) {
          subjectDaysScheduled[task.sectionKey][task.subject._id.toString()] = new Set();
        }
        subjectDaysScheduled[task.sectionKey][task.subject._id.toString()].add(day);
      }

      allocated = true;
    }

    // Backcard / Fallback: If no candidate was found because of the day-spreading constraint,
    // retry WITHOUT the day-spreading constraint for theory classes
    if (!allocated && task.type === 'Theory') {
      const backupCandidates = [];
      for (const day of DAYS) {
        for (let startP = 1; startP <= 7; startP++) {
          if (startP === LUNCH_PERIOD) continue;

          if (!studentBusy[day][startP][task.sectionKey] && !facultyBusy[day][startP][task.faculty._id.toString()]) {
            const matchingRooms = classrooms.filter(room => {
              if (room.type !== 'Classroom') return false;
              if (room.capacity < task.size) return false;
              return !roomBusy[day][startP][room._id.toString()];
            });

            matchingRooms.forEach(room => {
              backupCandidates.push({
                day,
                periods: [startP],
                room,
                score: room.capacity - task.size,
              });
            });
          }
        }
      }

      backupCandidates.sort((a, b) => a.score - b.score);

      if (backupCandidates.length > 0) {
        const choice = backupCandidates[0];
        const { day, periods, room } = choice;
        const p = periods[0];

        studentBusy[day][p][task.sectionKey] = true;
        facultyBusy[day][p][task.faculty._id.toString()] = true;
        roomBusy[day][p][room._id.toString()] = true;

        scheduledEntries.push({
          department: task.section.department,
          semester: task.section.semester,
          section: task.section.section,
          day,
          period: p,
          subject: task.subject._id,
          faculty: task.faculty._id,
          classroom: room._id,
        });

        allocated = true;
      }
    }

    if (!allocated) {
      unscheduledTasks.push({
        subject: task.subject,
        section: task.section,
        reason: 'Insufficient classrooms, overlapping faculty schedules, or student section is fully booked.',
      });
    }
  }

  return {
    scheduled: scheduledEntries,
    unscheduled: unscheduledTasks.map(ut => ({
      subjectCode: ut.subject.subjectCode,
      subjectName: ut.subject.subjectName,
      semester: ut.section.semester,
      section: ut.section.section,
      reason: ut.reason,
    })),
  };
}

module.exports = {
  generateTimetable,
};

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Department = require('../models/Department');
const Faculty = require('../models/Faculty');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const Classroom = require('../models/Classroom');
const Timetable = require('../models/Timetable');
const Notification = require('../models/Notification');
const { generateTimetable } = require('../utils/scheduler');

dotenv.config();

const seedDB = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/smart-classroom');
    console.log('Connected. Cleaning database...');

    // Clear existing data
    await User.deleteMany();
    await Department.deleteMany();
    await Faculty.deleteMany();
    await Student.deleteMany();
    await Subject.deleteMany();
    await Classroom.deleteMany();
    await Timetable.deleteMany();
    await Notification.deleteMany();

    console.log('Database cleaned. Seeding default Admin...');
    
    // 1. Seed Admin User
    const adminUser = await User.create({
      name: 'System Admin',
      email: 'admin@college.edu',
      password: 'Admin@123',
      role: 'Admin',
    });

    console.log('Seeding Departments...');

    // 2. Seed 4 Departments
    const depsData = [
      { departmentName: 'Computer Science & Engineering', departmentCode: 'CSE' },
      { departmentName: 'Information Technology', departmentCode: 'IT' },
      { departmentName: 'Artificial Intelligence & Data Science', departmentCode: 'AI' },
      { departmentName: 'Electronics & Communication Engineering', departmentCode: 'ECE' },
    ];
    const departments = await Department.insertMany(depsData);
    const depMap = {};
    departments.forEach(d => {
      depMap[d.departmentCode] = d;
    });

    console.log('Seeding Classrooms and Labs...');

    // 3. Seed 20 Classrooms + 5 Labs
    const classroomsData = [];
    // 20 Classrooms
    for (let i = 1; i <= 20; i++) {
      const roomNum = 100 + i;
      classroomsData.push({
        roomNumber: `R${roomNum}`,
        building: i <= 10 ? 'Science Block' : 'Technology Tower',
        capacity: i % 2 === 0 ? 60 : 40,
        type: 'Classroom',
        status: 'Active',
      });
    }
    // 5 Labs
    for (let i = 1; i <= 5; i++) {
      classroomsData.push({
        roomNumber: `LAB${i}`,
        building: 'Innovation Hub',
        capacity: 30,
        type: 'Lab',
        status: 'Active',
      });
    }
    const classrooms = await Classroom.insertMany(classroomsData);

    console.log('Seeding Faculty...');

    // 4. Seed 20 Faculty
    // We will create the default faculty login user first
    const defaultFacultyUser = await User.create({
      name: 'Dr. Sarah Jenkins',
      email: 'faculty@college.edu',
      password: 'Faculty@123',
      role: 'Faculty',
    });

    const facultyNames = [
      'Dr. Sarah Jenkins', // default faculty
      'Dr. Richard Feynman',
      'Prof. Alan Turing',
      'Dr. Ada Lovelace',
      'Dr. Grace Hopper',
      'Prof. Claude Shannon',
      'Dr. John von Neumann',
      'Prof. Barbara Liskov',
      'Dr. Donald Knuth',
      'Prof. Tim Berners-Lee',
      'Dr. Dennis Ritchie',
      'Prof. Andrew Ng',
      'Dr. Geoffrey Hinton',
      'Prof. Yann LeCun',
      'Dr. Yoshua Bengio',
      'Prof. Fei-Fei Li',
      'Dr. Ken Thompson',
      'Prof. Vint Cerf',
      'Dr. Robert Kahn',
      'Dr. Bjarne Stroustrup',
    ];

    const facultyList = [];
    for (let i = 0; i < 20; i++) {
      let userObj;
      if (i === 0) {
        userObj = defaultFacultyUser;
      } else {
        const email = `faculty${i}@college.edu`;
        userObj = await User.create({
          name: facultyNames[i],
          email,
          password: 'Faculty@123',
          role: 'Faculty',
        });
      }

      // Assign to a department in cycle
      const depCode = ['CSE', 'IT', 'AI', 'ECE'][i % 4];
      const dept = depMap[depCode];

      const faculty = await Faculty.create({
        user: userObj._id,
        facultyName: facultyNames[i],
        facultyId: `FAC${1000 + i}`,
        department: dept._id,
        email: userObj.email,
        phone: `+1-555-01${10 + i}`,
        subjects: [],
        availableHours: [],
      });
      facultyList.push(faculty);
    }

    console.log('Seeding Subjects...');

    // 5. Seed 60 Subjects (15 per department, semesters 1, 3, 5, 7)
    const subjectsData = [];
    const semesters = [1, 3, 5, 7];

    const cseSubjectTemplates = [
      { name: 'Introduction to Programming', code: 'CS101', type: 'Theory', credits: 3, sem: 1 },
      { name: 'Programming Lab', code: 'CS102', type: 'Lab', credits: 3, sem: 1 },
      { name: 'Data Structures and Algorithms', code: 'CS301', type: 'Theory', credits: 4, sem: 3 },
      { name: 'Data Structures Lab', code: 'CS302', type: 'Lab', credits: 3, sem: 3 },
      { name: 'Discrete Mathematics', code: 'CS303', type: 'Theory', credits: 3, sem: 3 },
      { name: 'Database Management Systems', code: 'CS501', type: 'Theory', credits: 4, sem: 5 },
      { name: 'DBMS Lab', code: 'CS502', type: 'Lab', credits: 3, sem: 5 },
      { name: 'Operating Systems', code: 'CS503', type: 'Theory', credits: 3, sem: 5 },
      { name: 'Computer Networks', code: 'CS504', type: 'Theory', credits: 3, sem: 5 },
      { name: 'Theory of Computation', code: 'CS505', type: 'Theory', credits: 3, sem: 5 },
      { name: 'Software Engineering', code: 'CS701', type: 'Theory', credits: 3, sem: 7 },
      { name: 'Cloud Computing', code: 'CS702', type: 'Theory', credits: 3, sem: 7 },
      { name: 'Cryptography and Network Security', code: 'CS703', type: 'Theory', credits: 3, sem: 7 },
      { name: 'Compiler Design', code: 'CS704', type: 'Theory', credits: 4, sem: 7 },
      { name: 'Compiler Design Lab', code: 'CS705', type: 'Lab', credits: 3, sem: 7 },
    ];

    const itSubjectTemplates = [
      { name: 'Web Technologies', code: 'IT101', type: 'Theory', credits: 3, sem: 1 },
      { name: 'Web Programming Lab', code: 'IT102', type: 'Lab', credits: 3, sem: 1 },
      { name: 'Object Oriented Programming', code: 'IT301', type: 'Theory', credits: 4, sem: 3 },
      { name: 'OOP Lab', code: 'IT302', type: 'Lab', credits: 3, sem: 3 },
      { name: 'Digital Logic and Design', code: 'IT303', type: 'Theory', credits: 3, sem: 3 },
      { name: 'Computer Architecture', code: 'IT501', type: 'Theory', credits: 3, sem: 5 },
      { name: 'Information Coding and Information Security', code: 'IT502', type: 'Theory', credits: 3, sem: 5 },
      { name: 'Graphics and Multimedia', code: 'IT503', type: 'Theory', credits: 3, sem: 5 },
      { name: 'Graphics Lab', code: 'IT504', type: 'Lab', credits: 3, sem: 5 },
      { name: 'Software Architecture', code: 'IT505', type: 'Theory', credits: 3, sem: 5 },
      { name: 'Mobile App Development', code: 'IT701', type: 'Theory', credits: 3, sem: 7 },
      { name: 'Mobile App Lab', code: 'IT702', type: 'Lab', credits: 3, sem: 7 },
      { name: 'Cyber Forensics', code: 'IT703', type: 'Theory', credits: 3, sem: 7 },
      { name: 'E-Commerce Systems', code: 'IT704', type: 'Theory', credits: 3, sem: 7 },
      { name: 'Distributed Systems', code: 'IT705', type: 'Theory', credits: 3, sem: 7 },
    ];

    const aiSubjectTemplates = [
      { name: 'Introduction to AI', code: 'AI101', type: 'Theory', credits: 3, sem: 1 },
      { name: 'Python for AI Lab', code: 'AI102', type: 'Lab', credits: 3, sem: 1 },
      { name: 'Linear Algebra and Probability', code: 'AI301', type: 'Theory', credits: 4, sem: 3 },
      { name: 'Machine Learning Foundation', code: 'AI302', type: 'Theory', credits: 4, sem: 3 },
      { name: 'ML Coding Lab', code: 'AI303', type: 'Lab', credits: 3, sem: 3 },
      { name: 'Artificial Neural Networks', code: 'AI501', type: 'Theory', credits: 3, sem: 5 },
      { name: 'Deep Learning', code: 'AI502', type: 'Theory', credits: 4, sem: 5 },
      { name: 'Deep Learning Lab', code: 'AI503', type: 'Lab', credits: 3, sem: 5 },
      { name: 'Natural Language Processing', code: 'AI504', type: 'Theory', credits: 3, sem: 5 },
      { name: 'Computer Vision', code: 'AI505', type: 'Theory', credits: 3, sem: 5 },
      { name: 'Reinforcement Learning', code: 'AI701', type: 'Theory', credits: 3, sem: 7 },
      { name: 'Robotics and Control', code: 'AI702', type: 'Theory', credits: 3, sem: 7 },
      { name: 'Robotics Lab', code: 'AI703', type: 'Lab', credits: 3, sem: 7 },
      { name: 'AI Ethics and Policies', code: 'AI704', type: 'Theory', credits: 3, sem: 7 },
      { name: 'Big Data Analytics', code: 'AI705', type: 'Theory', credits: 3, sem: 7 },
    ];

    const eceSubjectTemplates = [
      { name: 'Basic Electrical Sciences', code: 'EC101', type: 'Theory', credits: 3, sem: 1 },
      { name: 'Electrical Engineering Lab', code: 'EC102', type: 'Lab', credits: 3, sem: 1 },
      { name: 'Electronic Devices and Circuits', code: 'EC301', type: 'Theory', credits: 4, sem: 3 },
      { name: 'Devices and Circuits Lab', code: 'EC302', type: 'Lab', credits: 3, sem: 3 },
      { name: 'Signals and Systems', code: 'EC303', type: 'Theory', credits: 4, sem: 3 },
      { name: 'Microprocessors and Microcontrollers', code: 'EC501', type: 'Theory', credits: 4, sem: 5 },
      { name: 'MPMC Lab', code: 'EC502', type: 'Lab', credits: 3, sem: 5 },
      { name: 'Analog Communication', code: 'EC503', type: 'Theory', credits: 3, sem: 5 },
      { name: 'Digital Communication', code: 'EC504', type: 'Theory', credits: 3, sem: 5 },
      { name: 'Digital Communication Lab', code: 'EC505', type: 'Lab', credits: 3, sem: 5 },
      { name: 'VLSI Design', code: 'EC701', type: 'Theory', credits: 4, sem: 7 },
      { name: 'VLSI Lab', code: 'EC702', type: 'Lab', credits: 3, sem: 7 },
      { name: 'Antenna and Wave Propagation', code: 'EC703', type: 'Theory', credits: 3, sem: 7 },
      { name: 'Embedded Systems', code: 'EC704', type: 'Theory', credits: 3, sem: 7 },
      { name: 'Fiber Optic Networks', code: 'EC705', type: 'Theory', credits: 3, sem: 7 },
    ];

    // Helper to add and link
    const seedSubjectsForDep = async (depCode, templates) => {
      // Find faculty belonging to this department
      const dept = depMap[depCode];
      const deptFaculty = facultyList.filter(f => f.department.toString() === dept._id.toString());

      for (let index = 0; index < templates.length; index++) {
        const t = templates[index];
        // Assign faculty cyclically from the department list
        const assignedFac = deptFaculty[index % deptFaculty.length];

        const subject = await Subject.create({
          subjectCode: t.code,
          subjectName: t.name,
          credits: t.credits,
          department: dept._id,
          semester: t.sem,
          faculty: assignedFac._id,
          type: t.type,
        });

        // Link in Faculty's subjects list
        await Faculty.findByIdAndUpdate(assignedFac._id, { $addToSet: { subjects: subject._id } });
      }
    };

    await seedSubjectsForDep('CSE', cseSubjectTemplates);
    await seedSubjectsForDep('IT', itSubjectTemplates);
    await seedSubjectsForDep('AI', aiSubjectTemplates);
    await seedSubjectsForDep('ECE', eceSubjectTemplates);

    console.log('Seeding Students...');

    // 6. Seed 200 Students
    // We will create the default student login user first
    const defaultStudentUser = await User.create({
      name: 'John Doe',
      email: 'student@college.edu',
      password: 'Student@123',
      role: 'Student',
    });

    // Create the student profile for John Doe
    await Student.create({
      user: defaultStudentUser._id,
      registerNumber: 'REG2026001',
      studentName: 'John Doe',
      department: depMap['CSE']._id,
      year: 3,
      semester: 5,
      section: 'A',
    });

    // Seed 199 more students distributed across 4 departments, 4 semesters, section A
    const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Elizabeth', 'William', 'Linda', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];

    const studentBatch = [];
    const deptsList = ['CSE', 'IT', 'AI', 'ECE'];

    for (let i = 2; i <= 200; i++) {
      const fName = firstNames[i % firstNames.length];
      const lName = lastNames[(i + 5) % lastNames.length];
      const name = `${fName} ${lName}`;
      const regNo = `REG2026${String(i).padStart(3, '0')}`;
      const email = `${regNo.toLowerCase()}@college.edu`;

      const userObj = await User.create({
        name,
        email,
        password: 'Student@123',
        role: 'Student',
      });

      const depCode = deptsList[i % 4];
      const dept = depMap[depCode];
      // Semester choice cycle: 1, 3, 5, 7
      const sem = semesters[i % 4];
      // Year choice: sem=1 -> 1, sem=3 -> 2, sem=5 -> 3, sem=7 -> 4
      const year = Math.ceil(sem / 2);

      studentBatch.push({
        user: userObj._id,
        registerNumber: regNo,
        studentName: name,
        department: dept._id,
        year,
        semester: sem,
        section: 'A',
      });
    }
    await Student.insertMany(studentBatch);

    console.log('Seeding completed for basic data.');
    console.log('Invoking timetable scheduling algorithm...');

    // 7. Auto-generate timetable
    const schedulingResult = await generateTimetable();

    console.log(`Generated ${schedulingResult.scheduled.length} timetable entries.`);
    if (schedulingResult.unscheduled.length > 0) {
      console.log(`Warning: ${schedulingResult.unscheduled.length} classes could not be scheduled.`);
      console.log(schedulingResult.unscheduled);
    }

    // Save timetable slots into DB
    await Timetable.insertMany(schedulingResult.scheduled);
    console.log('Timetable entries inserted into database.');

    // 8. Create default announcements
    console.log('Seeding Announcements/Notifications...');
    await Notification.create([
      {
        sender: adminUser._id,
        title: 'New Semester Schedule Published',
        message: 'The automated timetable scheduler has successfully generated and published conflict-free schedules for all semesters. You can view your classes in your dashboard.',
        recipientRole: 'All',
        readBy: [adminUser._id],
      },
      {
        sender: adminUser._id,
        title: 'Laboratory Maintenance Notice',
        message: 'Please note that LAB2 is scheduled for server maintenance on Thursday from 2:00 PM onwards. Classes scheduled there will be temporarily adjusted.',
        recipientRole: 'Faculty',
        readBy: [adminUser._id],
      },
      {
        sender: adminUser._id,
        title: 'Guest Lecture on Deep Learning',
        message: 'A guest lecture on modern architectures in deep learning is scheduled for the Artificial Intelligence department on Friday, 10:00 AM, in the Innovation Hub Auditorium.',
        recipientRole: 'Student',
        readBy: [adminUser._id],
      },
    ]);

    console.log('Database seeding successfully completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDB();

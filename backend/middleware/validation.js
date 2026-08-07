const validateRegister = (req, res, next) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ success: false, message: 'Please provide name, email, password, and role' });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
  }
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
  }
  if (!['Admin', 'Faculty', 'Student'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Invalid role' });
  }
  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email and password' });
  }
  next();
};

const validateDepartment = (req, res, next) => {
  const { departmentName, departmentCode } = req.body;
  if (!departmentName || !departmentCode) {
    return res.status(400).json({ success: false, message: 'Department name and code are required' });
  }
  next();
};

const validateFaculty = (req, res, next) => {
  const { facultyName, facultyId, department, email, phone } = req.body;
  if (!facultyName || !facultyId || !department || !email || !phone) {
    return res.status(400).json({ success: false, message: 'All fields (name, id, department, email, phone) are required' });
  }
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
  }
  next();
};

const validateStudent = (req, res, next) => {
  const { registerNumber, studentName, department, year, semester, section } = req.body;
  if (!registerNumber || !studentName || !department || !year || !semester || !section) {
    return res.status(400).json({ success: false, message: 'All fields (registerNumber, name, department, year, semester, section) are required' });
  }
  const yr = Number(year);
  const sem = Number(semester);
  if (isNaN(yr) || yr < 1 || yr > 4) {
    return res.status(400).json({ success: false, message: 'Year must be a number between 1 and 4' });
  }
  if (isNaN(sem) || sem < 1 || sem > 8) {
    return res.status(400).json({ success: false, message: 'Semester must be a number between 1 and 8' });
  }
  next();
};

const validateSubject = (req, res, next) => {
  const { subjectCode, subjectName, credits, department, semester, type } = req.body;
  if (!subjectCode || !subjectName || !credits || !department || !semester || !type) {
    return res.status(400).json({ success: false, message: 'All fields (code, name, credits, department, semester, type) are required' });
  }
  const cred = Number(credits);
  const sem = Number(semester);
  if (isNaN(cred) || cred < 1 || cred > 6) {
    return res.status(400).json({ success: false, message: 'Credits must be a number between 1 and 6' });
  }
  if (isNaN(sem) || sem < 1 || sem > 8) {
    return res.status(400).json({ success: false, message: 'Semester must be a number between 1 and 8' });
  }
  if (!['Theory', 'Lab'].includes(type)) {
    return res.status(400).json({ success: false, message: 'Type must be Theory or Lab' });
  }
  next();
};

const validateClassroom = (req, res, next) => {
  const { roomNumber, building, capacity, type, status } = req.body;
  if (!roomNumber || !building || !capacity || !type) {
    return res.status(400).json({ success: false, message: 'roomNumber, building, capacity, and type are required' });
  }
  const cap = Number(capacity);
  if (isNaN(cap) || cap < 1) {
    return res.status(400).json({ success: false, message: 'Capacity must be a positive number' });
  }
  if (!['Classroom', 'Lab'].includes(type)) {
    return res.status(400).json({ success: false, message: 'Type must be Classroom or Lab' });
  }
  if (status && !['Active', 'Maintenance'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Status must be Active or Maintenance' });
  }
  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateDepartment,
  validateFaculty,
  validateStudent,
  validateSubject,
  validateClassroom,
};

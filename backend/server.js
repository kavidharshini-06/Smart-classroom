const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

// Route files
const auth = require('./routes/auth');
const departments = require('./routes/departments');
const faculty = require('./routes/faculty');
const students = require('./routes/students');
const subjects = require('./routes/subjects');
const classrooms = require('./routes/classrooms');
const timetables = require('./routes/timetables');
const reports = require('./routes/reports');
const notifications = require('./routes/notifications');

const app = express();

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors({
  origin: '*', // Allow all origins for simplicity in development/deployment, or configure specifically
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Set security headers
app.use(helmet());

// Sanitize data (NoSQL injection prevention)
app.use(mongoSanitize());

// Rate Limiting: max 200 requests per 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
});
app.use('/api', limiter);

// Mount routers
app.use('/api/auth', auth);
app.use('/api/departments', departments);
app.use('/api/faculty', faculty);
app.use('/api/students', students);
app.use('/api/subjects', subjects);
app.use('/api/classrooms', classrooms);
app.use('/api/timetables', timetables);
app.use('/api/reports', reports);
app.use('/api/notifications', notifications);

// Health Check Route (Required by Render deployment)
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is healthy and running' });
});

// Root route redirects to health or serves message
app.get('/', (req, res) => {
  res.status(200).json({ success: true, message: 'Welcome to the Smart Classroom and Timetable Scheduler API' });
});

// 404 Route handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'API route not found' });
});

// Global Error Handler Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

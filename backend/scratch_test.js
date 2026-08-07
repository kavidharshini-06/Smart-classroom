const mongoose = require('mongoose');
const URI = 'mongodb+srv://testuser:testpass123@cluster0.yzlvy.mongodb.net/smart_classroom_test?retryWrites=true&w=majority';

async function test() {
  try {
    console.log('Connecting to remote MongoDB Atlas sandbox...');
    await mongoose.connect(URI);
    console.log('Successfully connected to remote Atlas Sandbox!');
    process.exit(0);
  } catch (err) {
    console.error('Connection failed:', err.message);
    process.exit(1);
  }
}

test();

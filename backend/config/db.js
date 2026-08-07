const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const dbUri = process.env.MONGO_URI || 'mongodb://localhost:27017/smart-classroom';
    console.log(`Connecting to MongoDB at: ${dbUri.replace(/:([^@]+)@/, ':****@')}`);
    
    // Set connection timeout to 3 seconds for quick local fallback
    const conn = await mongoose.connect(dbUri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`Standard MongoDB Connection failed: ${error.message}`);
    console.log('Attempting to start MongoDB Memory Server for offline demo fallback...');
    
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();
      
      console.log(`MongoDB Memory Server started at: ${mongoUri}`);
      const conn = await mongoose.connect(mongoUri);
      console.log(`MongoDB In-Memory Connected: ${conn.connection.host}`);
      console.log('--- RUNNING IN OFFLINE DEMO MODE ---');

      // Disconnect and stop on process exit
      process.on('SIGINT', async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
        process.exit(0);
      });

      // Automatically seed the in-memory database
      setTimeout(async () => {
        try {
          console.log('Seeding in-memory database with default registry profiles...');
          const { seedInMemory } = require('../seed/seederMemory');
          await seedInMemory();
          console.log('Offline demo data ready! You can now log in using the Quick Fill buttons.');
        } catch (se) {
          console.error('In-memory seeding failed:', se.message);
        }
      }, 500);

    } catch (memError) {
      console.error(`MongoDB Memory Server fallback failed: ${memError.message}`);
      process.exit(1);
    }
  }
};

module.exports = connectDB;

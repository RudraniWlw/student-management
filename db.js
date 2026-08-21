const mongoose = require('mongoose');

let isConnected = false;
let lastCheckedAt = null;

async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('MONGODB_URI is not set. Please configure your .env file (see .env.example).');
    process.exit(1);
  }

  mongoose.set('strictQuery', true);

  mongoose.connection.on('connected', () => {
    isConnected = true;
    lastCheckedAt = new Date();
    console.log(`MongoDB connected -> database: ${mongoose.connection.name}`);
  });

  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    lastCheckedAt = new Date();
    console.warn('MongoDB disconnected');
  });

  mongoose.connection.on('error', (err) => {
    isConnected = false;
    lastCheckedAt = new Date();
    console.error('MongoDB connection error:', err.message);
  });

  await mongoose.connect(uri, {
    dbName: process.env.DB_NAME || 'student_management'
  });

  return mongoose.connection;
}

function getConnectionStatus() {
  isConnected = mongoose.connection.readyState === 1;
  return {
    connected: isConnected,
    readyState: mongoose.connection.readyState,
    lastCheckedAt: lastCheckedAt || new Date()
  };
}

module.exports = { connectDB, getConnectionStatus };

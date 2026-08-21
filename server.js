require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB, getConnectionStatus } = require('./config/db');
const { errorHandler } = require('./middleware/errorHandler');

const studentRoutes = require('./routes/students');
const attendanceRoutes = require('./routes/attendance');
const courseRoutes = require('./routes/courses');
const gradeRoutes = require('./routes/grades');
const dashboardRoutes = require('./routes/dashboard');

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check — the frontend polls this to show "Cloud Connected" / "Connection Error"
app.get('/api/health', (req, res) => {
  const status = getConnectionStatus();
  res.json({
    status: status.connected ? 'ok' : 'error',
    database: status.connected ? 'connected' : 'disconnected',
    lastCheckedAt: status.lastCheckedAt
  });
});

app.use('/api/students', studentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

start();

module.exports = app;

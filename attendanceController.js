const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const { AppError } = require('../middleware/errorHandler');

// GET /api/students/:studentId/attendance
async function getAttendanceForStudent(req, res, next) {
  try {
    const { studentId } = req.params;
    const student = await Student.findById(studentId).lean();
    if (!student) return next(new AppError('Student not found', 404));

    const records = await Attendance.find({ student: studentId }).sort({ date: -1 }).lean();
    res.json({ attendance: records });
  } catch (err) {
    next(err);
  }
}

// POST /api/students/:studentId/attendance
async function createAttendance(req, res, next) {
  try {
    const { studentId } = req.params;
    const student = await Student.findById(studentId).lean();
    if (!student) return next(new AppError('Student not found', 404));

    const record = await Attendance.create({
      student: studentId,
      date: req.body.date,
      status: req.body.status
    });
    res.status(201).json({ attendance: record, message: 'Attendance recorded' });
  } catch (err) {
    next(err);
  }
}

// PUT /api/attendance/:id
async function updateAttendance(req, res, next) {
  try {
    const record = await Attendance.findByIdAndUpdate(
      req.params.id,
      { date: req.body.date, status: req.body.status },
      { new: true, runValidators: true }
    );
    if (!record) return next(new AppError('Attendance record not found', 404));
    res.json({ attendance: record, message: 'Attendance updated' });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/attendance/:id
async function deleteAttendance(req, res, next) {
  try {
    const record = await Attendance.findByIdAndDelete(req.params.id);
    if (!record) return next(new AppError('Attendance record not found', 404));
    res.json({ message: 'Attendance record deleted' });
  } catch (err) {
    next(err);
  }
}

// GET /api/students/:studentId/attendance/stats
async function getAttendanceStats(req, res, next) {
  try {
    const { studentId } = req.params;
    const student = await Student.findById(studentId).lean();
    if (!student) return next(new AppError('Student not found', 404));

    const stats = await Attendance.aggregate([
      { $match: { student: new mongoose.Types.ObjectId(studentId) } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const result = { present: 0, absent: 0, late: 0 };
    stats.forEach((s) => {
      if (s._id === 'Present') result.present = s.count;
      if (s._id === 'Absent') result.absent = s.count;
      if (s._id === 'Late') result.late = s.count;
    });

    const total = result.present + result.absent + result.late;
    const percentage = total > 0 ? Number((((result.present + result.late) / total) * 100).toFixed(1)) : 0;

    res.json({
      totalClasses: total,
      present: result.present,
      absent: result.absent,
      late: result.late,
      attendancePercentage: percentage
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAttendanceForStudent,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  getAttendanceStats
};

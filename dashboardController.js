const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Grade = require('../models/Grade');
const { calculateGPA } = require('../utils/grading');

// GET /api/dashboard/stats
async function getDashboardStats(req, res, next) {
  try {
    const [totalStudents, activeStudents, attendanceAgg, grades] = await Promise.all([
      Student.countDocuments({}),
      Student.countDocuments({ status: 'Active' }),
      Attendance.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            presentOrLate: {
              $sum: { $cond: [{ $in: ['$status', ['Present', 'Late']] }, 1, 0] }
            }
          }
        }
      ]),
      Grade.find({}).lean()
    ]);

    const attendanceRow = attendanceAgg[0];
    const averageAttendance = attendanceRow && attendanceRow.total > 0
      ? Number(((attendanceRow.presentOrLate / attendanceRow.total) * 100).toFixed(1))
      : 0;

    const averageGPA = calculateGPA(grades);

    res.json({
      totalStudents,
      activeStudents,
      averageAttendance,
      averageGPA
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/dashboard/enrollment  -> enrollment trends grouped by month/year
async function getEnrollmentAnalytics(req, res, next) {
  try {
    const trends = await Student.aggregate([
      {
        $group: {
          _id: { year: { $year: '$enrollmentDate' }, month: { $month: '$enrollmentDate' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      {
        $project: {
          _id: 0,
          year: '$_id.year',
          month: '$_id.month',
          count: 1
        }
      }
    ]);

    res.json({ enrollment: trends });
  } catch (err) {
    next(err);
  }
}

// GET /api/dashboard/attendance -> present/absent/late totals across all students
async function getAttendanceAnalytics(req, res, next) {
  try {
    const result = await Attendance.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const summary = { Present: 0, Absent: 0, Late: 0 };
    result.forEach((r) => {
      summary[r._id] = r.count;
    });

    res.json({ attendance: summary });
  } catch (err) {
    next(err);
  }
}

// GET /api/dashboard/departments -> student counts grouped by department
async function getDepartmentAnalytics(req, res, next) {
  try {
    const result = await Student.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { _id: 0, department: '$_id', count: 1 } }
    ]);

    res.json({ departments: result });
  } catch (err) {
    next(err);
  }
}

// GET /api/dashboard/grades -> grade distribution
async function getGradeAnalytics(req, res, next) {
  try {
    const result = await Grade.aggregate([
      { $group: { _id: '$grade', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, grade: '$_id', count: 1 } }
    ]);

    res.json({ gradeDistribution: result });
  } catch (err) {
    next(err);
  }
}

// GET /api/dashboard/performance -> academic performance overview (avg marks per course)
async function getPerformanceAnalytics(req, res, next) {
  try {
    const result = await Grade.aggregate([
      {
        $lookup: {
          from: 'courses',
          localField: 'course',
          foreignField: '_id',
          as: 'courseInfo'
        }
      },
      { $unwind: '$courseInfo' },
      {
        $group: {
          _id: '$courseInfo.courseName',
          averageMarks: { $avg: '$marks' },
          studentsGraded: { $sum: 1 }
        }
      },
      { $sort: { averageMarks: -1 } },
      {
        $project: {
          _id: 0,
          course: '$_id',
          averageMarks: { $round: ['$averageMarks', 1] },
          studentsGraded: 1
        }
      }
    ]);

    res.json({ performance: result });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDashboardStats,
  getEnrollmentAnalytics,
  getAttendanceAnalytics,
  getDepartmentAnalytics,
  getGradeAnalytics,
  getPerformanceAnalytics
};

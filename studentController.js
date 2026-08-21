const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Grade = require('../models/Grade');
const StudentCourse = require('../models/StudentCourse');
const { AppError } = require('../middleware/errorHandler');

// GET /api/students?search=&department=&year=&page=&limit=
async function getStudents(req, res, next) {
  try {
    const { search, department, year, status, page = 1, limit = 20 } = req.query;
    const query = {};

    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [{ fullName: regex }, { studentId: regex }, { email: regex }];
    }
    if (department) query.department = department;
    if (year) query.year = Number(year);
    if (status) query.status = status;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 20);
    const skip = (pageNum - 1) * limitNum;

    const [students, total] = await Promise.all([
      Student.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      Student.countDocuments(query)
    ]);

    res.json({
      students,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1
      }
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/students/:id
async function getStudent(req, res, next) {
  try {
    const student = await Student.findById(req.params.id).lean();
    if (!student) return next(new AppError('Student not found', 404));
    res.json({ student });
  } catch (err) {
    next(err);
  }
}

// POST /api/students
async function createStudent(req, res, next) {
  try {
    const student = await Student.create(req.body);
    res.status(201).json({ student, message: 'Student created successfully' });
  } catch (err) {
    next(err);
  }
}

// PUT /api/students/:id
async function updateStudent(req, res, next) {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!student) return next(new AppError('Student not found', 404));
    res.json({ student, message: 'Student updated successfully' });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/students/:id  — cascades attendance, grades, student-course links
async function deleteStudent(req, res, next) {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return next(new AppError('Student not found', 404));

    await Promise.all([
      Attendance.deleteMany({ student: student._id }),
      Grade.deleteMany({ student: student._id }),
      StudentCourse.deleteMany({ student: student._id })
    ]);
    await student.deleteOne();

    res.json({ message: 'Student and associated records deleted successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getStudents, getStudent, createStudent, updateStudent, deleteStudent };

const Grade = require('../models/Grade');
const Student = require('../models/Student');
const { AppError } = require('../middleware/errorHandler');
const { calculateGrade, calculateGPA } = require('../utils/grading');

// GET /api/students/:studentId/grades
async function getGradesForStudent(req, res, next) {
  try {
    const { studentId } = req.params;
    const student = await Student.findById(studentId).lean();
    if (!student) return next(new AppError('Student not found', 404));

    const grades = await Grade.find({ student: studentId })
      .populate('course', 'courseCode courseName credits')
      .sort({ semester: 1, createdAt: -1 })
      .lean();

    res.json({ grades });
  } catch (err) {
    next(err);
  }
}

// POST /api/grades
async function createGrade(req, res, next) {
  try {
    const { student, course, marks, semester } = req.body;
    const { grade, gradePoint } = calculateGrade(marks);

    const record = await Grade.create({ student, course, marks, grade, gradePoint, semester });
    const populated = await record.populate('course', 'courseCode courseName credits');

    res.status(201).json({ grade: populated, message: 'Grade recorded successfully' });
  } catch (err) {
    next(err);
  }
}

// PUT /api/grades/:id
async function updateGrade(req, res, next) {
  try {
    const update = { ...req.body };
    if (update.marks !== undefined) {
      const { grade, gradePoint } = calculateGrade(update.marks);
      update.grade = grade;
      update.gradePoint = gradePoint;
    }

    const record = await Grade.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true
    }).populate('course', 'courseCode courseName credits');

    if (!record) return next(new AppError('Grade record not found', 404));
    res.json({ grade: record, message: 'Grade updated successfully' });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/grades/:id
async function deleteGrade(req, res, next) {
  try {
    const record = await Grade.findByIdAndDelete(req.params.id);
    if (!record) return next(new AppError('Grade record not found', 404));
    res.json({ message: 'Grade record deleted successfully' });
  } catch (err) {
    next(err);
  }
}

// GET /api/students/:studentId/gpa
async function getStudentGPA(req, res, next) {
  try {
    const { studentId } = req.params;
    const student = await Student.findById(studentId).lean();
    if (!student) return next(new AppError('Student not found', 404));

    const grades = await Grade.find({ student: studentId }).lean();
    const gpa = calculateGPA(grades);

    res.json({ gpa, coursesCounted: grades.length });
  } catch (err) {
    next(err);
  }
}

module.exports = { getGradesForStudent, createGrade, updateGrade, deleteGrade, getStudentGPA };

const { AppError } = require('./errorHandler');

function validateStudent(req, res, next) {
  const { studentId, fullName, email, department, year, semester } = req.body;
  const errors = [];

  if (!studentId || !studentId.trim()) errors.push('Student ID is required');
  if (!fullName || !fullName.trim()) errors.push('Full name is required');
  if (!email || !email.trim()) errors.push('Email is required');
  else if (!/^\S+@\S+\.\S+$/.test(email)) errors.push('Email is not valid');
  if (!department || !department.trim()) errors.push('Department is required');

  if (year === undefined || year === null || year === '') {
    errors.push('Year is required');
  } else if (Number(year) < 1 || Number(year) > 4) {
    errors.push('Year must be between 1 and 4');
  }

  if (semester === undefined || semester === null || semester === '') {
    errors.push('Semester is required');
  } else if (Number(semester) < 1 || Number(semester) > 8) {
    errors.push('Semester must be between 1 and 8');
  }

  if (errors.length) {
    return next(new AppError(errors.join(', '), 400));
  }
  next();
}

function validateAttendance(req, res, next) {
  const { status, date } = req.body;
  const validStatuses = ['Present', 'Absent', 'Late'];

  if (!date) return next(new AppError('Date is required', 400));
  if (!status || !validStatuses.includes(status)) {
    return next(new AppError('Status must be one of: Present, Absent, Late', 400));
  }
  next();
}

function validateGrade(req, res, next) {
  const { marks, student, course, semester } = req.body;

  if (!student) return next(new AppError('Student is required', 400));
  if (!course) return next(new AppError('Course is required', 400));
  if (marks === undefined || marks === null || marks === '') {
    return next(new AppError('Marks are required', 400));
  }
  if (Number(marks) < 0 || Number(marks) > 100) {
    return next(new AppError('Marks must be between 0 and 100', 400));
  }
  if (semester === undefined || semester === null || semester === '') {
    return next(new AppError('Semester is required', 400));
  }
  next();
}

function validateCourse(req, res, next) {
  const { courseCode, courseName, department, credits } = req.body;
  const errors = [];
  if (!courseCode || !courseCode.trim()) errors.push('Course code is required');
  if (!courseName || !courseName.trim()) errors.push('Course name is required');
  if (!department || !department.trim()) errors.push('Department is required');
  if (credits === undefined || credits === null || credits === '') errors.push('Credits is required');

  if (errors.length) return next(new AppError(errors.join(', '), 400));
  next();
}

module.exports = { validateStudent, validateAttendance, validateGrade, validateCourse };

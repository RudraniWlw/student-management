const Course = require('../models/Course');
const { AppError } = require('../middleware/errorHandler');

// GET /api/courses?search=&department=
async function getCourses(req, res, next) {
  try {
    const { search, department } = req.query;
    const query = {};
    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [{ courseName: regex }, { courseCode: regex }];
    }
    if (department) query.department = department;

    const courses = await Course.find(query).sort({ courseCode: 1 }).lean();
    res.json({ courses });
  } catch (err) {
    next(err);
  }
}

// GET /api/courses/:id
async function getCourse(req, res, next) {
  try {
    const course = await Course.findById(req.params.id).lean();
    if (!course) return next(new AppError('Course not found', 404));
    res.json({ course });
  } catch (err) {
    next(err);
  }
}

// POST /api/courses
async function createCourse(req, res, next) {
  try {
    const course = await Course.create(req.body);
    res.status(201).json({ course, message: 'Course created successfully' });
  } catch (err) {
    next(err);
  }
}

// PUT /api/courses/:id
async function updateCourse(req, res, next) {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!course) return next(new AppError('Course not found', 404));
    res.json({ course, message: 'Course updated successfully' });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/courses/:id
async function deleteCourse(req, res, next) {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return next(new AppError('Course not found', 404));
    res.json({ message: 'Course deleted successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getCourses, getCourse, createCourse, updateCourse, deleteCourse };

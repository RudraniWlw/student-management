const express = require('express');
const router = express.Router();

const studentController = require('../controllers/studentController');
const attendanceController = require('../controllers/attendanceController');
const gradeController = require('../controllers/gradeController');
const { validateStudent, validateAttendance } = require('../middleware/validation');

router.get('/', studentController.getStudents);
router.get('/:id', studentController.getStudent);
router.post('/', validateStudent, studentController.createStudent);
router.put('/:id', validateStudent, studentController.updateStudent);
router.delete('/:id', studentController.deleteStudent);

// Nested attendance
router.get('/:studentId/attendance', attendanceController.getAttendanceForStudent);
router.post('/:studentId/attendance', validateAttendance, attendanceController.createAttendance);
router.get('/:studentId/attendance/stats', attendanceController.getAttendanceStats);

// Nested grades / gpa
router.get('/:studentId/grades', gradeController.getGradesForStudent);
router.get('/:studentId/gpa', gradeController.getStudentGPA);

module.exports = router;

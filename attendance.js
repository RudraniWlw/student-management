const express = require('express');
const router = express.Router();

const attendanceController = require('../controllers/attendanceController');
const { validateAttendance } = require('../middleware/validation');

router.put('/:id', validateAttendance, attendanceController.updateAttendance);
router.delete('/:id', attendanceController.deleteAttendance);

module.exports = router;

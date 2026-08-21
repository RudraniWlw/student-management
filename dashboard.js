const express = require('express');
const router = express.Router();

const dashboardController = require('../controllers/dashboardController');

router.get('/stats', dashboardController.getDashboardStats);
router.get('/enrollment', dashboardController.getEnrollmentAnalytics);
router.get('/attendance', dashboardController.getAttendanceAnalytics);
router.get('/departments', dashboardController.getDepartmentAnalytics);
router.get('/grades', dashboardController.getGradeAnalytics);
router.get('/performance', dashboardController.getPerformanceAnalytics);

module.exports = router;

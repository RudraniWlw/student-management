const express = require('express');
const router = express.Router();

const courseController = require('../controllers/courseController');
const { validateCourse } = require('../middleware/validation');

router.get('/', courseController.getCourses);
router.get('/:id', courseController.getCourse);
router.post('/', validateCourse, courseController.createCourse);
router.put('/:id', validateCourse, courseController.updateCourse);
router.delete('/:id', courseController.deleteCourse);

module.exports = router;

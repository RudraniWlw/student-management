const express = require('express');
const router = express.Router();

const gradeController = require('../controllers/gradeController');
const { validateGrade } = require('../middleware/validation');

router.post('/', validateGrade, gradeController.createGrade);
router.put('/:id', gradeController.updateGrade);
router.delete('/:id', gradeController.deleteGrade);

module.exports = router;

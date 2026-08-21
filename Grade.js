const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    },
    marks: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    grade: {
      type: String,
      required: true
    },
    gradePoint: {
      type: Number,
      required: true
    },
    semester: {
      type: Number,
      required: true,
      min: 1,
      max: 8
    }
  },
  { timestamps: true }
);

gradeSchema.index({ student: 1 });
gradeSchema.index({ course: 1 });
gradeSchema.index({ student: 1, course: 1, semester: 1 }, { unique: true });

module.exports = mongoose.model('Grade', gradeSchema);

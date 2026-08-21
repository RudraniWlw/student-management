const mongoose = require('mongoose');

const studentCourseSchema = new mongoose.Schema(
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
    semester: {
      type: Number,
      required: true,
      min: 1,
      max: 8
    },
    enrollmentDate: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

studentCourseSchema.index({ student: 1, course: 1, semester: 1 }, { unique: true });

module.exports = mongoose.model('StudentCourse', studentCourseSchema);

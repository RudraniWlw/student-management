const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    courseCode: {
      type: String,
      required: [true, 'Course code is required'],
      trim: true,
      uppercase: true
    },
    courseName: {
      type: String,
      required: [true, 'Course name is required'],
      trim: true
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true
    },
    credits: {
      type: Number,
      required: [true, 'Credits is required'],
      min: 1,
      max: 10
    }
  },
  { timestamps: true }
);

courseSchema.index({ courseCode: 1 }, { unique: true });
courseSchema.index({ department: 1 });

module.exports = mongoose.model('Course', courseSchema);

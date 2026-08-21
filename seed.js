/**
 * Database seed script.
 * Run intentionally with: npm run seed
 * WARNING: this clears existing data in the students/courses/attendance/grades/
 * studentCourses collections before inserting fresh sample data.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('./config/db');
const Student = require('./models/Student');
const Course = require('./models/Course');
const Attendance = require('./models/Attendance');
const Grade = require('./models/Grade');
const StudentCourse = require('./models/StudentCourse');
const { calculateGrade } = require('./utils/grading');

const DEPARTMENTS = ['Computer Science', 'Electronics', 'Mechanical', 'Civil'];

const FIRST_NAMES = [
  'Aarav', 'Vivaan', 'Aditya', 'Ishaan', 'Rohan', 'Kabir', 'Ananya', 'Diya',
  'Priya', 'Sneha', 'Meera', 'Kavya', 'Arjun', 'Rahul', 'Sanjay', 'Neha',
  'Pooja', 'Karan', 'Riya', 'Vikram'
];
const LAST_NAMES = [
  'Sharma', 'Verma', 'Patel', 'Reddy', 'Gupta', 'Iyer', 'Nair', 'Joshi',
  'Kulkarni', 'Deshmukh', 'Mehta', 'Chopra', 'Rao', 'Menon', 'Pillai',
  'Agarwal', 'Bose', 'Chatterjee', 'Kapoor', 'Malhotra'
];

const COURSES = [
  { courseCode: 'CS201', courseName: 'Data Structures', department: 'Computer Science', credits: 4 },
  { courseCode: 'CS305', courseName: 'Database Systems', department: 'Computer Science', credits: 4 },
  { courseCode: 'CS410', courseName: 'Machine Learning', department: 'Computer Science', credits: 3 },
  { courseCode: 'EC210', courseName: 'Digital Electronics', department: 'Electronics', credits: 4 },
  { courseCode: 'EC330', courseName: 'Signals and Systems', department: 'Electronics', credits: 3 },
  { courseCode: 'ME220', courseName: 'Thermodynamics', department: 'Mechanical', credits: 4 },
  { courseCode: 'ME340', courseName: 'Fluid Mechanics', department: 'Mechanical', credits: 3 },
  { courseCode: 'CE215', courseName: 'Structural Analysis', department: 'Civil', credits: 4 }
];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(startYear, endYear) {
  const start = new Date(startYear, 0, 1).getTime();
  const end = new Date(endYear, 11, 31).getTime();
  return new Date(start + Math.random() * (end - start));
}

function randomStatus() {
  const r = Math.random();
  if (r < 0.72) return 'Present';
  if (r < 0.9) return 'Late';
  return 'Absent';
}

async function seed() {
  await connectDB();
  console.log('Connected. Clearing existing collections...');

  await Promise.all([
    Student.deleteMany({}),
    Course.deleteMany({}),
    Attendance.deleteMany({}),
    Grade.deleteMany({}),
    StudentCourse.deleteMany({})
  ]);

  console.log('Inserting courses...');
  const courses = await Course.insertMany(COURSES);

  console.log('Inserting students...');
  const studentDocs = [];
  for (let i = 0; i < 20; i++) {
    const first = FIRST_NAMES[i % FIRST_NAMES.length];
    const last = LAST_NAMES[(i + 3) % LAST_NAMES.length];
    const department = DEPARTMENTS[i % DEPARTMENTS.length];
    const year = randomInt(1, 4);
    studentDocs.push({
      studentId: `STU${String(1000 + i)}`,
      fullName: `${first} ${last}`,
      email: `${first}.${last}${i}@college.edu`.toLowerCase(),
      phone: `9${randomInt(100000000, 999999999)}`,
      dateOfBirth: randomDate(2002, 2007),
      department,
      course: department === 'Computer Science' ? 'B.Tech CSE'
        : department === 'Electronics' ? 'B.Tech ECE'
          : department === 'Mechanical' ? 'B.Tech Mech'
            : 'B.Tech Civil',
      year,
      semester: Math.min(8, year * 2 - randomInt(0, 1)),
      enrollmentDate: randomDate(2022, 2025),
      address: `${randomInt(1, 200)}, Sample Street, Nashik, Maharashtra`,
      status: Math.random() < 0.85 ? 'Active' : Math.random() < 0.7 ? 'On Leave' : 'Graduated'
    });
  }
  const students = await Student.insertMany(studentDocs);

  console.log('Inserting attendance records...');
  const attendanceDocs = [];
  for (const student of students) {
    const classCount = randomInt(15, 30);
    const usedDates = new Set();
    for (let i = 0; i < classCount; i++) {
      let date;
      do {
        date = new Date(2026, randomInt(0, 7), randomInt(1, 28));
        date.setHours(0, 0, 0, 0);
      } while (usedDates.has(date.toISOString()));
      usedDates.add(date.toISOString());
      attendanceDocs.push({ student: student._id, date, status: randomStatus() });
    }
  }
  await Attendance.insertMany(attendanceDocs);

  console.log('Enrolling students in courses and inserting grades...');
  const departmentCourses = {};
  DEPARTMENTS.forEach((d) => {
    departmentCourses[d] = courses.filter((c) => c.department === d);
  });

  const studentCourseDocs = [];
  const gradeDocs = [];

  for (const student of students) {
    const availableCourses = departmentCourses[student.department] || courses;
    const numCourses = Math.min(availableCourses.length, randomInt(2, 3));
    const chosen = [...availableCourses].sort(() => 0.5 - Math.random()).slice(0, numCourses);

    for (const course of chosen) {
      studentCourseDocs.push({
        student: student._id,
        course: course._id,
        semester: student.semester,
        enrollmentDate: student.enrollmentDate
      });

      const marks = randomInt(40, 98);
      const { grade, gradePoint } = calculateGrade(marks);
      gradeDocs.push({
        student: student._id,
        course: course._id,
        marks,
        grade,
        gradePoint,
        semester: student.semester
      });
    }
  }

  await StudentCourse.insertMany(studentCourseDocs);
  await Grade.insertMany(gradeDocs);

  console.log('Seed complete:');
  console.log(`  Students: ${students.length}`);
  console.log(`  Courses: ${courses.length}`);
  console.log(`  Attendance records: ${attendanceDocs.length}`);
  console.log(`  Grade records: ${gradeDocs.length}`);
  console.log(`  Student-course enrollments: ${studentCourseDocs.length}`);

  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});

/**
 * Central grading logic. Change the SCALE array to adjust grade boundaries
 * without touching any controller code.
 */
const SCALE = [
  { min: 90, max: 100, grade: 'A+', point: 10 },
  { min: 80, max: 89, grade: 'A', point: 9 },
  { min: 70, max: 79, grade: 'B+', point: 8 },
  { min: 60, max: 69, grade: 'B', point: 7 },
  { min: 50, max: 59, grade: 'C', point: 6 },
  { min: 0, max: 49, grade: 'F', point: 0 }
];

function calculateGrade(marks) {
  const m = Number(marks);
  const band = SCALE.find((b) => m >= b.min && m <= b.max);
  if (!band) {
    throw new Error('Marks must be between 0 and 100');
  }
  return { grade: band.grade, gradePoint: band.point };
}

function calculateGPA(grades) {
  if (!grades || grades.length === 0) return 0;
  const totalPoints = grades.reduce((sum, g) => sum + (g.gradePoint || 0), 0);
  return Number((totalPoints / grades.length).toFixed(2));
}

module.exports = { calculateGrade, calculateGPA, SCALE };

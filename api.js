/**
 * Centralized API layer. Every network call in the app goes through here.
 * Change API_BASE when deploying the backend somewhere other than localhost.
 */
const API_BASE = window.API_BASE_URL || 'http://localhost:5000/api';

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
  } catch (err) {
    // Network-level failure (backend down, CORS, offline, etc.)
    const error = new Error('Unable to connect to the cloud database. Please try again.');
    error.isNetworkError = true;
    throw error;
  }

  let body = null;
  try {
    body = await res.json();
  } catch (e) {
    // no JSON body
  }

  if (!res.ok) {
    const message = (body && body.message) || 'Something went wrong. Please try again.';
    const error = new Error(message);
    error.status = res.status;
    throw error;
  }

  return body;
}

const api = {
  // Health
  getHealth: () => request('/health'),

  // Students
  getStudents: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/students${qs ? `?${qs}` : ''}`);
  },
  getStudent: (id) => request(`/students/${id}`),
  createStudent: (data) => request('/students', { method: 'POST', body: JSON.stringify(data) }),
  updateStudent: (id, data) => request(`/students/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteStudent: (id) => request(`/students/${id}`, { method: 'DELETE' }),

  // Attendance
  getAttendance: (studentId) => request(`/students/${studentId}/attendance`),
  getAttendanceStats: (studentId) => request(`/students/${studentId}/attendance/stats`),
  createAttendance: (studentId, data) =>
    request(`/students/${studentId}/attendance`, { method: 'POST', body: JSON.stringify(data) }),
  updateAttendance: (id, data) => request(`/attendance/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAttendance: (id) => request(`/attendance/${id}`, { method: 'DELETE' }),

  // Courses
  getCourses: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/courses${qs ? `?${qs}` : ''}`);
  },
  getCourse: (id) => request(`/courses/${id}`),
  createCourse: (data) => request('/courses', { method: 'POST', body: JSON.stringify(data) }),
  updateCourse: (id, data) => request(`/courses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCourse: (id) => request(`/courses/${id}`, { method: 'DELETE' }),

  // Grades
  getGrades: (studentId) => request(`/students/${studentId}/grades`),
  getGPA: (studentId) => request(`/students/${studentId}/gpa`),
  createGrade: (data) => request('/grades', { method: 'POST', body: JSON.stringify(data) }),
  updateGrade: (id, data) => request(`/grades/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteGrade: (id) => request(`/grades/${id}`, { method: 'DELETE' }),

  // Dashboard / analytics
  getDashboardStats: () => request('/dashboard/stats'),
  getEnrollmentAnalytics: () => request('/dashboard/enrollment'),
  getAttendanceAnalytics: () => request('/dashboard/attendance'),
  getDepartmentAnalytics: () => request('/dashboard/departments'),
  getGradeAnalytics: () => request('/dashboard/grades'),
  getPerformanceAnalytics: () => request('/dashboard/performance')
};

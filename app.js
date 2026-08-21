/* Core app shell: routing, cloud connection indicator, dashboard, shared chart helpers, toasts */

const PAGE_TITLES = {
  dashboard: 'Student Dashboard',
  students: 'Students',
  'student-form': 'Student Form',
  profile: 'Student Profile',
  attendance: 'Attendance',
  courses: 'Courses',
  grades: 'Marks & Grades',
  reports: 'Reports & Analytics'
};

let state = {
  currentStudentId: null // used by profile/attendance/grades pages
};

function showPage(page) {
  document.querySelectorAll('.page').forEach((p) => p.classList.remove('active'));
  const el = document.getElementById('page-' + page);
  if (el) el.classList.add('active');
  document.getElementById('page-heading-text').textContent = PAGE_TITLES[page] || 'Dashboard';

  document.querySelectorAll('.sidebar-item').forEach((i) => i.classList.remove('active'));
  document.querySelectorAll(`.sidebar-item[data-page="${page}"]`).forEach((i) => i.classList.add('active'));

  window.location.hash = page;

  if (page === 'dashboard') loadDashboard();
  if (page === 'students') Students.load();
  if (page === 'attendance') Attendance.loadPage();
  if (page === 'courses') Courses.load();
  if (page === 'grades') Grades.loadPage();
  if (page === 'reports') Reports.load();
}

function setupRouting() {
  document.querySelectorAll('.sidebar-item[data-page]').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      showPage(a.dataset.page);
    });
  });

  const initial = (window.location.hash || '#dashboard').replace('#', '');
  showPage(PAGE_TITLES[initial] ? initial : 'dashboard');
}

/* ---------- Toasts / messages ---------- */
function showToast(message, isError = false) {
  let toast = document.getElementById('app-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'app-toast';
    toast.className = 'fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-lg transition-opacity duration-300';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.background = isError ? '#fdecea' : '#e8f5e9';
  toast.style.color = isError ? '#c62828' : '#2e7d32';
  toast.style.opacity = '1';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.style.opacity = '0';
  }, 3000);
}

function formMsg(elId, text, isErr) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.textContent = text;
  el.className = 'mt-3 text-sm ' + (isErr ? 'text-red-500' : 'text-green-600');
  setTimeout(() => {
    el.className = 'mt-3 text-sm hidden';
  }, 3000);
}

function friendlyError(err) {
  return err && err.message ? err.message : 'Something went wrong. Please try again.';
}

/* ---------- Cloud connection indicator ---------- */
async function checkCloudStatus() {
  const el = document.getElementById('cloud-status');
  const label = document.getElementById('cloud-status-label');
  try {
    const health = await api.getHealth();
    if (health.status === 'ok') {
      el.classList.remove('bg-red-50', 'text-red-600');
      el.classList.add('bg-green-50', 'text-green-600');
      label.textContent = 'Cloud Connected';
    } else {
      throw new Error('database disconnected');
    }
    window.__lastSyncAt = new Date();
  } catch (err) {
    el.classList.remove('bg-green-50', 'text-green-600');
    el.classList.add('bg-red-50', 'text-red-600');
    label.textContent = 'Connection Error';
  }
}

/* ---------- Dashboard page ---------- */
async function loadDashboard() {
  setLoading('dashboard-table-body', 7, 'Loading students...');
  try {
    const [stats, studentsRes, attendanceAnalytics, enrollmentAnalytics] = await Promise.all([
      api.getDashboardStats(),
      api.getStudents({ limit: 5 }),
      api.getAttendanceAnalytics(),
      api.getEnrollmentAnalytics()
    ]);

    document.querySelector('#stat-total p.text-2xl').textContent = stats.totalStudents;
    document.querySelector('#stat-total-label').textContent = 'Total Students';
    document.querySelector('#stat-active p.text-2xl').textContent = stats.activeStudents;
    document.querySelector('#stat-active-label').textContent = 'Active Students';
    document.querySelector('#stat-attendance p.text-2xl').textContent = `${stats.averageAttendance}%`;
    document.querySelector('#stat-attendance-label').textContent = 'Avg Attendance';
    document.querySelector('#stat-gpa p.text-2xl').textContent = stats.averageGPA;
    document.querySelector('#stat-gpa-label').textContent = 'Avg GPA';

    document.getElementById('chart-enrollment-title').textContent = 'Enrollment Trend';
    document.getElementById('chart-attendance-title').textContent = 'Attendance Overview';
    document.getElementById('recent-records-title').textContent = 'Recent Students';

    renderEnrollmentChart(enrollmentAnalytics.enrollment);
    renderAttendanceDonut('attendanceChart', attendanceAnalytics.attendance);
    renderDashboardTable(studentsRes.students);
  } catch (err) {
    showToast(friendlyError(err), true);
    document.getElementById('dashboard-table-body').innerHTML =
      `<tr><td colspan="7" class="py-6 text-center text-gray-400">Unable to load dashboard data.</td></tr>`;
  }
}

function renderDashboardTable(students) {
  const tbody = document.getElementById('dashboard-table-body');
  if (!students || students.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="py-6 text-center text-gray-400">No students yet.</td></tr>`;
    return;
  }
  tbody.innerHTML = students
    .map(
      (s) => `<tr class="border-b border-gray-50">
        <td class="py-3">${s.studentId}</td>
        <td class="py-3 font-medium">${s.fullName}</td>
        <td class="py-3">${s.department}</td>
        <td class="py-3">${s.year}</td>
        <td class="py-3">—</td>
        <td class="py-3">—</td>
        <td class="py-3"><span class="badge ${badgeClass(s.status)}">${s.status}</span></td>
      </tr>`
    )
    .join('');
}

function badgeClass(status) {
  if (status === 'On Leave') return 'badge-leave';
  if (status === 'Graduated') return 'badge-graduated';
  return 'badge-active';
}

function setLoading(tbodyId, colspan, message) {
  const el = document.getElementById(tbodyId);
  if (el) el.innerHTML = `<tr><td colspan="${colspan}" class="py-6 text-center text-gray-400">${message}</td></tr>`;
}

/* ---------- Shared canvas chart helpers (kept from original hand-rolled charts) ---------- */
function drawLineChart(ctx, labels, data, color) {
  const w = ctx.canvas.width, h = ctx.canvas.height;
  const max = Math.max(1, ...data) * 1.2;
  const px = 40, py = 20;
  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = '#eee';
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    const y = py + (h - py * 2) * i / 4;
    ctx.beginPath();
    ctx.moveTo(px, y);
    ctx.lineTo(w - 10, y);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  data.forEach((v, i) => {
    const x = px + (w - px - 10) * i / Math.max(1, data.length - 1);
    const y = h - py - (v / max) * (h - py * 2);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.fillStyle = '#999';
  ctx.font = '11px DM Sans';
  labels.forEach((l, i) => {
    const x = px + (w - px - 10) * i / Math.max(1, labels.length - 1);
    ctx.fillText(l, x - 10, h - 4);
  });
}

function drawDonut(ctx, data, colors, labels) {
  const w = ctx.canvas.width, h = ctx.canvas.height;
  const cx = w / 2, cy = h / 2, r = Math.min(w, h) * 0.35;
  const total = data.reduce((a, b) => a + b, 0) || 1;
  let start = -Math.PI / 2;
  ctx.clearRect(0, 0, w, h);
  data.forEach((v, i) => {
    const angle = (v / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, start + angle);
    ctx.fillStyle = colors[i];
    ctx.fill();
    start += angle;
  });
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.6, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.fillStyle = '#555';
  ctx.font = '12px DM Sans';
  labels.forEach((l, i) => {
    ctx.fillStyle = colors[i];
    ctx.fillRect(w - 100, 20 + i * 22, 10, 10);
    ctx.fillStyle = '#555';
    ctx.fillText(`${l} ${data[i]}`, w - 84, 29 + i * 22);
  });
}

function renderEnrollmentChart(rows) {
  const canvas = document.getElementById('enrollmentChart');
  if (!canvas) return;
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const labels = (rows || []).map((r) => `${monthNames[r.month - 1]} ${String(r.year).slice(2)}`);
  const data = (rows || []).map((r) => r.count);
  if (data.length === 0) {
    labels.push('No data');
    data.push(0);
  }
  drawLineChart(canvas.getContext('2d'), labels, data, '#7c6dd8');
}

function renderAttendanceDonut(canvasId, attendance) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const data = [attendance.Present || 0, attendance.Absent || 0, attendance.Late || 0];
  drawDonut(canvas.getContext('2d'), data, ['#86d4a9', '#f5a8a8', '#f5d89a'], ['Present', 'Absent', 'Late']);
}

/* ---------- Global search ---------- */
let globalSearchTimer = null;
function setupGlobalSearch() {
  const input = document.getElementById('global-search');
  const resultsBox = document.getElementById('global-search-results');
  if (!input) return;

  input.addEventListener('input', () => {
    clearTimeout(globalSearchTimer);
    const q = input.value.trim();
    if (!q) {
      resultsBox.classList.add('hidden');
      return;
    }
    globalSearchTimer = setTimeout(async () => {
      try {
        const res = await api.getStudents({ search: q, limit: 6 });
        renderGlobalSearchResults(res.students);
      } catch (err) {
        resultsBox.classList.add('hidden');
      }
    }, 300);
  });

  document.addEventListener('click', (e) => {
    if (!resultsBox.contains(e.target) && e.target !== input) {
      resultsBox.classList.add('hidden');
    }
  });
}

function renderGlobalSearchResults(students) {
  const resultsBox = document.getElementById('global-search-results');
  if (!students || students.length === 0) {
    resultsBox.innerHTML = `<div class="p-3 text-sm text-gray-400">No students found</div>`;
    resultsBox.classList.remove('hidden');
    return;
  }
  resultsBox.innerHTML = students
    .map(
      (s) => `<button class="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm" onclick="Students.viewProfile('${s._id}')">
        <span class="font-medium">${s.fullName}</span> <span class="text-gray-400">· ${s.studentId} · ${s.department}</span>
      </button>`
    )
    .join('');
  resultsBox.classList.remove('hidden');
}

/* ---------- Bootstrap ---------- */
(function init() {
  lucide.createIcons();
  setupRouting();
  setupGlobalSearch();
  checkCloudStatus();
  setInterval(checkCloudStatus, 30000);
})();

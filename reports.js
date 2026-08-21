const Reports = (() => {
  async function load() {
    try {
      const [stats, deptRes, gradeRes, health] = await Promise.all([
        api.getDashboardStats(),
        api.getDepartmentAnalytics(),
        api.getGradeAnalytics(),
        api.getHealth()
      ]);

      document.getElementById('report-total').textContent = stats.totalStudents;
      document.getElementById('report-attendance').textContent = `${stats.averageAttendance}%`;
      document.getElementById('report-gpa').textContent = stats.averageGPA;

      renderDeptChart(deptRes.departments);
      renderGradeChart(gradeRes.gradeDistribution);
      renderCloudStatus(health);
    } catch (err) {
      showToast(friendlyError(err), true);
    }
  }

  function renderDeptChart(departments) {
    const canvas = document.getElementById('deptChart');
    if (!canvas) return;
    const colors = ['#b8a9e8', '#9ad0f5', '#86d4a9', '#f5c89a', '#f5a8a8', '#e8d5b8'];
    const data = (departments || []).map((d) => d.count);
    const labels = (departments || []).map((d) => d.department);
    if (data.length === 0) { data.push(1); labels.push('No data'); }
    drawDonut(canvas.getContext('2d'), data, colors, labels);
  }

  function renderGradeChart(distribution) {
    const canvas = document.getElementById('gradeChart');
    if (!canvas) return;
    const order = ['A+', 'A', 'B+', 'B', 'C', 'F'];
    const map = {};
    (distribution || []).forEach((d) => { map[d.grade] = d.count; });
    const labels = order.filter((g) => map[g] !== undefined);
    const data = labels.map((g) => map[g]);
    if (data.length === 0) { labels.push('No data'); data.push(0); }
    drawLineChart(canvas.getContext('2d'), labels, data, '#6c5ce7');
  }

  function renderCloudStatus(health) {
    const dot = document.getElementById('report-cloud-dot');
    const text = document.getElementById('report-cloud-text');
    const syncTime = document.getElementById('report-cloud-sync');
    const connected = health.status === 'ok';
    dot.className = `w-2.5 h-2.5 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`;
    text.textContent = connected ? 'Cloud Data Status: Synchronized' : 'Cloud Data Status: Connection Error';
    syncTime.textContent = `Last Sync: ${new Date(health.lastCheckedAt).toLocaleString()}`;
  }

  return { load };
})();

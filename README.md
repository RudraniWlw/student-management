# Cloud-Based Student Record Management System

A full-stack Student Record Management System backed by **MongoDB Atlas**, built on top of the
existing pastel/SaaS-style frontend. The Canva Data SDK has been fully removed and replaced with a
real REST API — every action (add, edit, delete, attendance, grades, dashboard stats) reads and
writes actual documents in MongoDB Atlas.

---

## 1. What was found in the uploaded frontend (analysis)

Before building, the uploaded frontend was inspected in detail:

- **Pages present:** Dashboard, Students (list), Add Student (form), Student Profile, Reports.
  Sidebar links for "Courses", "Attendance" and "Marks & Grades" existed visually but all pointed
  back to `#dashboard` — they were not real pages yet.
- **Forms:** a single "Add Student" form (`#add-student-form`) with fields for student ID, name,
  email, phone, DOB, department, course, year, semester, enrollment date, address.
- **Student fields (mock):** `student_id, full_name, email, phone, date_of_birth, department,
  course, year, semester, enrollment_date, address, attendance, gpa, status, created_at`.
- **Existing JS functions:** `renderDashboardTable`, `renderStudentsTable`, `badgeClass`,
  `showMsg`, `deleteStudent`, `viewProfile`, `showPage`, `setupRouting`, hand-rolled canvas chart
  helpers (`drawLineChart`, `drawDonut`) used for a line chart and two donut charts.
  These canvas helpers were **kept** — they render the visuals from real API data now.
- **Mock/static data:** the "1,248 / 1,180 / 87% / 8.4" dashboard stat cards, a hardcoded
  enrollment array `[180,220,250,310,280,320]`, a hardcoded attendance split `[72,18,10]`, and
  hardcoded department/grade distributions on the Reports page.
- **Canva SDK usage:** `window.dataSdk.init(dataHandler)`, `window.dataSdk.create(record)`,
  `window.dataSdk.delete(record)` — all Canva-specific, all removed.
- **Navigation:** simple hash-based routing already existed (`showPage`, `setupRouting`) and was
  reused/extended rather than rewritten.
- **Charts/stats:** two dashboard donut/line charts and three report charts, all previously static.

Everything reusable (layout, Tailwind classes, color palette, DM Sans, Lucide icons, the canvas
chart-drawing functions, the routing pattern) was preserved. Only the data layer changed.

---

## 2. Architecture

```
Frontend (HTML/CSS/vanilla JS)
        ↓ fetch()
Centralized API layer (frontend/js/api.js)
        ↓ REST
Express.js routes → controllers
        ↓
Mongoose models (with validation, indexes)
        ↓
MongoDB Atlas (student_management database)
        ↓
Aggregation pipelines (dashboard/reports analytics)
```

## 3. Technology Stack

- **Frontend:** HTML, Tailwind CSS (CDN), vanilla JavaScript, Lucide icons, DM Sans, hand-rolled
  canvas charts (no external chart library dependency).
- **Backend:** Node.js, Express.js, Mongoose, dotenv, cors.
- **Database:** MongoDB Atlas.

## 4. Project Structure

```
student-management/
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── .env.example
│   ├── config/db.js
│   ├── models/ (Student, Attendance, Course, StudentCourse, Grade)
│   ├── routes/ (students, attendance, courses, grades, dashboard)
│   ├── controllers/ (studentController, attendanceController, courseController,
│   │                  gradeController, dashboardController)
│   ├── middleware/ (errorHandler, validation)
│   ├── utils/grading.js   (grade scale + GPA calc, easy to edit)
│   ├── seed.js
│   └── tests/api.test.js
└── frontend/
    ├── index.html
    ├── css/styles.css
    └── js/ (api.js, app.js, students.js, attendance.js, courses.js, grades.js, reports.js)
```

## 5. Database Collections

| Collection      | Key fields                                                                 |
|------------------|-----------------------------------------------------------------------------|
| `students`       | studentId (unique), fullName, email (unique), department, year, semester, status |
| `attendance`     | student (ref), date, status (Present/Absent/Late) — unique per student+date |
| `courses`        | courseCode (unique), courseName, department, credits                       |
| `studentcourses` | student (ref), course (ref), semester, enrollmentDate                      |
| `grades`         | student (ref), course (ref), marks, grade, gradePoint, semester            |

Relationships use Mongoose `ObjectId` references and `.populate()` (e.g. grades populate their
course's code/name/credits).

## 6. API Documentation

Base URL: `/api`

**Students**
- `GET /students?search=&department=&year=&status=&page=&limit=` — paginated, filterable list
- `GET /students/:id`
- `POST /students`
- `PUT /students/:id`
- `DELETE /students/:id` — cascades attendance, grades, and course-enrollment records

**Attendance**
- `GET /students/:studentId/attendance`
- `POST /students/:studentId/attendance` — `{ date, status }`
- `GET /students/:studentId/attendance/stats` — `{ totalClasses, present, absent, late, attendancePercentage }`
- `PUT /attendance/:id`
- `DELETE /attendance/:id`

**Courses**
- `GET /courses?search=&department=`
- `GET /courses/:id`
- `POST /courses`
- `PUT /courses/:id`
- `DELETE /courses/:id`

**Grades**
- `GET /students/:studentId/grades` — populated with course info
- `GET /students/:studentId/gpa` — `{ gpa, coursesCounted }`
- `POST /grades` — `{ student, course, marks, semester }`; grade & gradePoint calculated automatically
- `PUT /grades/:id`
- `DELETE /grades/:id`

**Dashboard / Analytics** (all computed with MongoDB aggregation pipelines)
- `GET /dashboard/stats` — totals, active count, average attendance, average GPA
- `GET /dashboard/enrollment` — enrollment counts grouped by year/month
- `GET /dashboard/attendance` — Present/Absent/Late totals
- `GET /dashboard/departments` — student counts per department
- `GET /dashboard/grades` — grade distribution
- `GET /dashboard/performance` — average marks per course (`$lookup` + `$unwind` + `$group`)

**Health**
- `GET /health` — `{ status, database, lastCheckedAt }` — polled by the frontend every 30s to
  drive the "Cloud Connected" / "Connection Error" indicator.

Example request:
```bash
curl -X POST http://localhost:5000/api/students \
  -H "Content-Type: application/json" \
  -d '{"studentId":"STU2001","fullName":"Asha Rao","email":"asha@college.edu","department":"Computer Science","year":2,"semester":3}'
```

## 7. MongoDB Atlas Setup

1. Create a free account at https://www.mongodb.com/cloud/atlas/register
2. Create a new cluster (the free M0 tier is enough for this project).
3. Under **Database Access**, create a database user with a username/password.
4. Under **Network Access**, add your current IP (or `0.0.0.0/0` for development only).
5. Click **Connect → Drivers**, copy the connection string, e.g.:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Paste it into `backend/.env` as `MONGODB_URI`, and append the database name if not already
   present: `.../student_management?retryWrites=true&w=majority`
7. Start the backend — you should see `MongoDB connected -> database: student_management` in the
   console.
8. Verify with `curl http://localhost:5000/api/health` → `{"status":"ok","database":"connected"}`.

**Never commit the real connection string** — only `.env.example` (with blank `MONGODB_URI`) is
checked into version control.

## 8. Local Development

```bash
# Backend
cd backend
cp .env.example .env      # then fill in MONGODB_URI
npm install
npm run seed               # inserts ~20 students, 8 courses, attendance & grades
npm run dev                 # starts on http://localhost:5000

# Frontend
cd ../frontend
# Simplest: open index.html directly, or serve it statically, e.g.
npx serve .                 # or: python3 -m http.server 3000
```

The frontend calls `http://localhost:5000/api` by default (set in `index.html` via
`window.API_BASE_URL`). Update that one line when deploying.

## 9. Environment Variables (`backend/.env`)

```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/student_management
DB_NAME=student_management
CLIENT_URL=http://localhost:3000
```

## 10. Seeding

`npm run seed` clears and repopulates: `students`, `courses`, `attendance`, `grades`,
`studentcourses`. Safe to re-run — it always starts from a clean slate for these collections.
Produces varied attendance percentages and GPAs so dashboard charts and reports look meaningful.

## 11. Deployment

- **Frontend:** any static host (Netlify, Vercel, GitHub Pages, S3 + CloudFront).
- **Backend:** Render, Railway, or an AWS EC2 instance running `npm start` behind a process
  manager (pm2) and a reverse proxy (nginx). Set the same environment variables there.
- **Database:** MongoDB Atlas (already cloud-hosted).

After deploying the backend, update `window.API_BASE_URL` in `frontend/index.html` from
`http://localhost:5000/api` to your deployed backend's URL, e.g.
`https://your-backend.onrender.com/api`.

**AWS EC2 (optional):** launch an Ubuntu instance, install Node.js, `git clone`/upload the
`backend/` folder, set `.env`, install dependencies, and run under `pm2 start server.js`. Open
port 5000 (or put nginx in front on port 80/443) in the instance's security group.

## 12. Data Engineering Notes

This project is more than CRUD — it demonstrates a small data pipeline:

```
Frontend form entry → REST validation (frontend + backend) → Express controller
→ Mongoose schema validation → MongoDB Atlas write
→ Aggregation pipelines ($match, $group, $lookup, $unwind, $project, $sort)
→ Analytics endpoints → Dashboard/Report charts
```

- **Enrollment trend:** `$group` by `{ $year, $month }` of `enrollmentDate`.
- **Department distribution:** `$group` by `department`, `$sort` by count.
- **Grade distribution:** `$group` by `grade`.
- **Course performance:** `$lookup` grades → courses, `$unwind`, `$group` average marks per course.
- **Attendance percentage:** computed per student from raw `Attendance` documents, never
  hardcoded or stored redundantly on the student document.
- **GPA:** computed on demand from `Grade` documents (`sum(gradePoint) / count`), not stored as a
  static field, so it always reflects the latest data.

Indexes exist on `studentId`, `email`, `fullName`, `department`, `year` (students),
`student+date` (attendance, unique), `courseCode` (courses), and `student+course+semester`
(grades/studentCourses, unique) to keep filtered queries and duplicate-prevention efficient.

## 13. Testing Checklist

- [ ] Add a student → appears in Students table and Dashboard
- [ ] Refresh browser → student still exists (real persistence, not local state)
- [ ] Edit a student → changes reflected everywhere
- [ ] Delete a student → confirmation prompt, cascades attendance/grades/enrollments
- [ ] Search by name / student ID / email (Students page and global header search)
- [ ] Filter by department and year
- [ ] Add attendance (Present/Absent/Late) → percentage recalculates
- [ ] Add marks → grade + grade point auto-calculated, GPA updates
- [ ] Dashboard stats update after add/delete
- [ ] Reports charts (department distribution, grade distribution) reflect real data
- [ ] Stop the backend → frontend shows "Connection Error", not fake "Cloud Connected"
- [ ] `GET /api/health` returns `connected` when MongoDB Atlas is reachable
- [ ] `npm test` (Jest/Supertest) passes against a reachable MongoDB instance

## 14. Future Improvements

- Authentication (JWT) and role-based access (admin/faculty/student)
- File export (CSV/PDF) of reports
- Automated MongoDB Atlas backups
- CI pipeline running the Jest/Supertest suite
- An ETL job for importing bulk student data from spreadsheets

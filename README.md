# School Management SaaS

A multi-tenant, AI-powered School Management System built with Node.js, Express, Angular, and PostgreSQL.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)
![Node](https://img.shields.io/badge/node-20.x-green.svg)
![Angular](https://img.shields.io/badge/angular-19-red.svg)

---

## Features

### Core Management

-  Student Information Management (admission, profiles, class history)
-  Teacher Management (subjects, classes, workload)
-  Class Management (sections, capacity, assignments)
-  Attendance Tracking (daily, bulk marking, reports)
-  Fee Management (categories, invoices, payments)
-  Grade Management (assessments, report cards)
-  Timetable Management (class schedules, exams)

### Multi-Tenant SaaS

-  Schools as tenants with isolated data
-  Subscription plans (Trial/Basic/Standard/Premium/Enterprise)
-  Razorpay payment integration
-  Super-admin platform management

### AI-Powered

-  Attendance Risk Detection
-  Grade Trend Analysis
-  Fee Default Risk Scoring
-  AI Chat Assistant (Standard+ plan)
-  Natural Language Q&A

---

## Tech Stack

| Layer            | Technology                               |
| ---------------- | ---------------------------------------- |
| Backend          | Node.js 20, Express 5, TypeScript        |
| Frontend         | Angular 19 (standalone components)       |
| Database         | PostgreSQL 16                            |
| Cache            | Redis 7                                  |
| AI               | Anthropic Claude API                     |
| Auth             | JWT with refresh token rotation          |
| Payments         | Razorpay                                 |
| Containerization | Docker, Docker Compose                   |

---

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- Redis 7+ (optional)
- Docker (recommended)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd SCHOOL-MANAGEMENT

# Install backend dependencies
npm install

# Install frontend dependencies
cd school-management-frontend
npm install
cd ..

# Configure environment
cp .env.example .env
# Edit .env with your database credentials, JWT secrets, etc.
```

### Running the Application

```bash
# Using Docker (recommended)
docker-compose up -d

# Or manual startup
# 1. Start PostgreSQL and Redis
docker run -d -e POSTGRES_PASSWORD=yourpass -p 5432:5432 postgres:16
docker run -d -p 6379:6379 redis:7

# 2. Run database migrations
npm run db:migrate

# 3. Start backend
npm run dev

# 4. Start frontend (new terminal)
cd school-management-frontend
ng serve
```

Access the application:

- Frontend: http://localhost:4200
- Backend API: http://localhost:3000/api/v1

---

## API Endpoints

### Authentication

```
POST /api/v1/auth/login         - User login
POST /api/v1/auth/register     - User registration
POST /api/v1/auth/refresh     - Refresh token
POST /api/v1/auth/logout       - Logout
```

### Students

```
GET    /api/v1/students           - List students
POST   /api/v1/students           - Create student
GET    /api/v1/students/:id       - Get student
PUT    /api/v1/students/:id       - Update student
DELETE /api/v1/students/:id       - Delete student
GET    /api/v1/students/:id/summary - Student summary
GET    /api/v1/students/:id/history - Class history
```

### Teachers

```
GET    /api/v1/teachers           - List teachers
POST   /api/v1/teachers           - Create teacher
GET    /api/v1/teachers/:id     - Get teacher
PUT    /api/v1/teachers/:id     - Update teacher
DELETE /api/v1/teachers/:id     - Delete teacher
GET    /api/v1/teachers/:id/classes - Teacher classes
GET    /api/v1/teachers/:id/workload - Teacher workload
```

### Classes

```
GET    /api/v1/classes           - List classes
POST   /api/v1/classes           - Create class
GET    /api/v1/classes/:id       - Get class
PUT    /api/v1/classes/:id       - Update class
DELETE /api/v1/classes/:id       - Delete class
GET    /api/v1/classes/:id/students - Class students
GET    /api/v1/classes/:id/subjects - Class subjects
```

### Attendance

```
POST   /api/v1/attendance           - Mark attendance
POST   /api/v1/attendance/bulk     - Bulk mark
GET    /api/v1/attendance         - Get attendance
GET    /api/v1/attendance/reports - Attendance reports
GET    /api/v1/attendance/stats   - Attendance statistics
```

### Fees

```
GET    /api/v1/fees/categories      - List fee categories
POST   /api/v1/fees/categories      - Create category
GET    /api/v1/fees               - List student fees
POST   /api/v1/fees               - Assign fee
POST   /api/v1/payments           - Record payment
GET    /api/v1/payments           - List payments
GET    /api/v1/payments/statistics - Payment statistics
```

### Grades

```
POST   /api/v1/grades              - Create grade
GET    /api/v1/grades              - List grades
GET    /api/v1/grades/student/:id  - Student grades
GET    /api/v1/grades/class/:id    - Class grades
POST   /api/v1/report-cards      - Generate report card
GET    /api/v1/report-cards      - List report cards
```

### Academic

```
GET    /api/v1/academic-years      - List academic years
POST   /api/v1/academic-years      - Create year
GET    /api/v1/semesters          - List semesters
POST   /api/v1/semesters          - Create semester
GET    /api/v1/subjects          - List subjects
POST   /api/v1/subjects          - Create subject
```

### Staff & Parents

```
GET    /api/v1/staff              - List staff
POST   /api/v1/staff              - Create staff
GET    /api/v1/parents           - List parents
POST   /api/v1/parents           - Create parent
POST   /api/v1/parents/link-student - Link student to parent
```

### Timetable

```
GET    /api/v1/timetable              - List slots
POST   /api/v1/timetable              - Create slot
GET    /api/v1/timetable/class/:id - Class timetable
GET    /api/v1/timetable/teacher/:id - Teacher schedule
GET    /api/v1/timetable/exams      - List exams
POST   /api/v1/timetable/exams      - Create exam
```

### AI & Analytics

```
GET    /api/v1/ai/attendance-risks  - Attendance risk students
GET    /api/v1/ai/grade-trends    - Grade trends
GET    /api/v1/ai/fee-risks       - Fee risk students
GET    /api/v1/ai/school-health  - School health (Standard+)
POST   /api/v1/ai/ask          - Ask AI a question (Standard+)
```

### Dashboard

```
GET    /api/v1/dashboard/admin    - Admin dashboard
GET    /api/v1/dashboard/teacher - Teacher dashboard
GET    /api/v1/dashboard/student - Student dashboard
GET    /api/v1/dashboard/parent - Parent dashboard
```

---

## Database Schema

### Core Tables

```sql
-- Multi-tenant schools (tenants)
schools (id, name, slug, email, plan, subscription_status, ...)

-- Users (all roles)
users (id, school_id, first_name, last_name, email, password_hash, role, ...)

-- Academic
academic_years (id, school_id, name, start_date, end_date, is_active)
semesters (id, school_id, academic_year_id, name, start_date, end_date, is_active)
classes (id, school_id, name, grade, section, teacher_id, capacity, ...)

-- People
students (id, school_id, user_id, class_id, student_id, guardian_name, ...)
teachers (id, school_id, user_id, employee_id, specialization, qualification, ...)
staff (id, school_id, user_id, employee_id, department, position, ...)
student_parents (id, school_id, student_id, parent_user_id, relationship_type, ...)

-- Academic Data
subjects (id, school_id, name, code, credit_hours, ...)
attendance (id, school_id, student_id, date, status, ...)
grades (id, school_id, student_id, subject_id, marks_obtained, ...)
report_cards (id, school_id, student_id, semester_id, overall_percentage, ...)

-- Finance
fee_categories (id, school_id, name, amount, description, ...)
student_fees (id, school_id, student_id, fee_category_id, amount, due_date, status, ...)
payments (id, school_id, student_fee_id, amount, payment_date, mode, ...)
billing_events (id, school_id, event_type, amount, gateway, ...)
```

---

## Security

| Threat            | Mitigation                          |
| ----------------- | ----------------------------------- |
| SQL Injection     | Parameterized queries               |
| XSS               | Helmet, Angular Sanitizer           |
| CSRF              | SameSite cookies, CORS              |
| Brute Force       | Rate limiting                       |
| Token Theft       | Short-lived JWTs + refresh rotation |
| Tenant Escalation | Separate JWT secrets                |

---

## Subscription Plans

| Plan       | Price     | Students  | Teachers  | AI Insights |
| ---------- | --------- | --------- | --------- | ----------- |
| Trial      | Free      | 100       | 20        | ✗           |
| Basic      | ₹999/mo   | 300       | 30        | ✗           |
| Standard   | ₹2,499/mo | 1,000     | 80        | ✓           |
| Premium    | ₹4,999/mo | 3,000     | 200       | ✓           |
| Enterprise | Custom    | Unlimited | Unlimited | ✓           |

---

## Project Structure

```
SCHOOL-MANAGEMENT/
├── src/
│   ├── config/           # Environment configuration
│   ├── controllers/     # Route handlers
│   ├── database/       # DB connection & migrations
│   ├── middleware/    # Auth, tenant, rate limiting
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── types/          # TypeScript schemas
│   └── utils/          # Helper functions
├── school-management-frontend/
│   └── src/app/
│       ├── components/   # Shared components
│       ├── guards/      # Route guards
│       ├── modules/    # Feature modules
│       ├── services/   # API services
│       └── models/     # Data models
└── docker-compose.yml
```

---

## Environment Variables

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=SMS
DB_USER=postgres
DB_PASSWORD=yourpass

# JWT
JWT_SECRET=your_32_char_minimum_secret_key
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:4200

# Redis (optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_ENABLED=false
```

---

## Building for Production

```bash
# Backend build
npm run build

# Frontend build
cd school-management-frontend
ng build --configuration=production
```

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -am 'Add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Create new Pull Request

---

## License

MIT License - see LICENSE file for details.

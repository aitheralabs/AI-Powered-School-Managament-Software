# End-to-End Testing Guide

## Overview

This guide covers comprehensive E2E testing for the School Management System. Test all features, user roles, and workflows to identify any issues before production.

---

## Step 1: Start the Infrastructure

### Option A: Using Docker (Recommended)

```bash
# Start PostgreSQL and Redis
docker run -d --name school-postgres -e POSTGRES_PASSWORD=Kishan8051 -e POSTGRES_DB=SMS -p 5432:5432 postgres:16

# Verify containers are running
docker ps
```

### Option B: Using Existing Database

Ensure your PostgreSQL server is running and accessible. Update `.env` if needed:

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=SMS
DB_USER=postgres
DB_PASSWORD=Kishan8051
```

---

## Step 2: Run Migrations

```bash
# Navigate to backend
cd D:\SCHOOL-MANAGEMENT

# Run migrations to create tables
npm run db:migrate:dev
```

**Expected:** All migration files execute without errors, tables created in PostgreSQL.

---

## Step 3: Start Backend

```bash
# Terminal 1 - Backend API
npm run dev
```

**Expected:** Server starts on http://localhost:3000

Test backend health:

```bash
curl http://localhost:3000/health
```

---

## Step 4: Start Frontend

```bash
# Terminal 2 - Frontend
cd school-management-frontend
ng serve
```

**Expected:** Angular app builds and serves on http://localhost:4200

---

## Step 5: Test School Registration (First Flow)

### 5.1 Register a New School

1. Open browser: http://localhost:4200
2. Click "Register" or navigates to `/auth/register`
3. Fill form:
   - School Name: "Test Academy"
   - School Slug: "testacademy"
   - Admin First Name: "Admin"
   - Admin Last Name: "User"
   - Email: "admin@testacademy.com"
   - Password: "TestPass123!"
4. Submit

**API Test:**

```bash
curl -X POST http://localhost:3000/api/v1/schools/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Academy",
    "slug": "testacademy",
    "email": "admin@testacademy.com",
    "adminFirstName": "Admin",
    "adminLastName": "User",
    "adminPassword": "TestPass123!"
  }'
```

**Expected:** Returns success, school created, admin user created

---

## Step 6: Test User Roles & Authentication

### 6.1 Login as Admin

1. Go to http://localhost:4200/auth/login
2. Enter credentials
3. Click Login

**API Test:**

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@testacademy.com", "password": "TestPass123!"}'
```

**Expected:** Returns JWT tokens (accessToken, refreshToken)

---

## TESTING CHECKLIST BY ROLE

### 👑 ADMIN USER TESTS

#### 1. Dashboard

- [ ] Login successfully
- [ ] View admin dashboard with stats
- [ ] See summary cards (students, teachers, attendance, fees)
- [ ] Check quick actions work

#### 2. Academic Years

- [ ] Create academic year
- [ ] Set as active
- [ ] View academic years list
- [ ] Cannot duplicate names

#### 3. Semesters

- [ ] Create semester linked to academic year
- [ ] Set as active
- [ ] View semesters list

#### 4. Subjects

- [ ] Create new subject
- [ ] Edit subject
- [ ] Delete subject (soft delete)
- [ ] List all subjects
- [ ] Search subjects

#### 5. Classes

- [ ] Create new class (Grade + Section)
- [ ] Assign class teacher
- [ ] Set capacity
- [ ] Edit class details
- [ ] Delete class
- [ ] View class list with filters
- [ ] View class details (students, subjects)

#### 6. Students

- [ ] Add new student (manual)
- [ ] View student list with pagination
- [ ] Search student by name/ID
- [ ] Filter by class
- [ ] View student profile
- [ ] Edit student details
- [ ] Change student class
- [ ] View attendance history
- [ ] View grade history
- [ ] View fee status
- [ ] Delete student (soft delete)
- [ ] Bulk import students (CSV)

#### 7. Teachers

- [ ] Add new teacher
- [ ] View teacher list
- [ ] Search teacher
- [ ] View teacher profile
- [ ] Assign subjects to teacher
- [ ] Assign classes to teacher
- [ ] View teacher workload
- [ ] Edit teacher details
- [ ] Delete teacher

#### 8. Attendance

- [ ] Mark attendance for a class (date picker)
- [ ] Mark individual student
- [ ] Bulk mark attendance
- [ ] View attendance calendar
- [ ] Filter by class/date
- [ ] View attendance reports
- [ ] Export attendance report
- [ ] View attendance stats (% present)

#### 9. Fees

- [ ] Create fee category
- [ ] Edit fee category
- [ ] Delete fee category
- [ ] Assign fee to student
- [ ] Bulk assign fee to class
- [ ] View student fee details
- [ ] Record payment
- [ ] View payment history
- [ ] Generate fee receipt
- [ ] Send payment reminder
- [ ] View fee reports
- [ ] Export fee report

#### 10. Grades

- [ ] Create assessment type
- [ ] Add grade for student
- [ ] Bulk add grades
- [ ] View grade list
- [ ] Filter by class/subject
- [ ] View student grades
- [ ] View grade statistics
- [ ] Generate report card
- [ ] Download report card PDF

#### 11. Timetable

- [ ] Create time slot
- [ ] Assign teacher to slot
- [ ] View class timetable
- [ ] View teacher timetable
- [ ] Create exam schedule
- [ ] View exam list

#### 12. Staff

- [ ] Add new staff
- [ ] View staff list
- [ ] Filter by department
- [ ] Edit staff details
- [ ] Deactivate/reactivate staff

#### 13. Parents

- [ ] Add parent account
- [ ] Link parent to student
- [ ] View parent list
- [ ] Edit parent details
- [ ] View parent children

#### 14. Reports

- [ ] Attendance report
- [ ] Fee collection report
- [ ] Student report card
- [ ] Export to CSV/PDF

#### 15. AI Chat

- [ ] Ask attendance question
- [ ] Ask grade question
- [ ] Ask fee question
- [ ] Ask general question
- [ ] View suggested questions
- [ ] Clear chat

#### 16. Settings

- [ ] View profile
- [ ] Edit profile
- [ ] Change password
- [ ] Update notification settings

---

### 👨‍🏫 TEACHER USER TESTS

#### 1. Login

- [ ] Login as teacher
- [ ] See teacher-specific dashboard

#### 2. My Classes

- [ ] View assigned classes
- [ ] View class students
- [ ] View class subjects

#### 3. Attendance

- [ ] Mark attendance for assigned class
- [ ] View attendance history

#### 4. Grades

- [ ] Add grades for students
- [ ] Bulk add grades
- [ ] View class grades
- [ ] View student grades

#### 5. Timetable

- [ ] View my schedule
- [ ] View upcoming classes

#### 6. Dashboard

- [ ] See my stats
- [ ] View class performance

---

### 👨‍🎓 STUDENT USER TESTS

#### 1. Login

- [ ] Login as student
- [ ] See student dashboard

#### 2. Profile

- [ ] View own profile
- [ ] View class info

#### 3. Attendance

- [ ] View own attendance
- [ ] See attendance percentage

#### 4. Grades

- [ ] View own grades
- [ ] View report cards

#### 5. Fees

- [ ] View fee status
- [ ] View payment history

#### 6. Timetable

- [ ] View own schedule

---

### 👨‍👩‍👧 PARENT USER TESTS

#### 1. Login

- [ ] Login as parent
- [ ] See parent dashboard

#### 2. Children

- [ ] View linked children
- [ ] Select child

#### 3. Child's Attendance

- [ ] View child's attendance
- [ ] See attendance %

#### 4. Child's Grades

- [ ] View child's grades
- [ ] View report cards

#### 5. Child's Fees

- [ ] View child's fee status
- [ ] View payment history

---

## API TESTING SCRIPTS

### Login and Get Token

```bash
# Login as Admin
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@testacademy.com", "password": "TestPass123!"}' \
  | jq -r '.data.accessToken')

echo "Token: $TOKEN"
```

### Test Authenticated Requests

```bash
# Set token
TOKEN="your-jwt-token-here"

# Get school profile
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/schools/me

# Get students
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/students
```

---

## COMMON ISSUES TO LOOK FOR

### Authentication Issues

- [ ] Login fails with correct credentials
- [ ] Token expires unexpectedly
- [ ] Refresh token doesn't work
- [ ] Logout doesn't invalidate token

### CRUD Issues

- [ ] Create fails with validation errors
- [ ] Update doesn't reflect changes
- [ ] Delete doesn't work
- [ ] List doesn't show new items

### Permission Issues

- [ ] Teacher can access admin features
- [ ] Student can see other students' data
- [ ] Parent can see other children's data

### Data Issues

- [ ] Pagination not working
- [ ] Search returns wrong results
- [ ] Filters don't apply correctly

### UI Issues

- [ ] Forms don't validate
- [ ] Buttons don't respond
- [ ] Loading states stuck
- [ ] Error messages not showing

---

## POSTMAN COLLECTION

Import this JSON into Postman for quick testing:

```json
{
  "info": {
    "name": "School Management API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    { "key": "baseUrl", "value": "http://localhost:3000/api/v1" },
    { "key": "token", "value": "" }
  ],
  "auth": {
    "type": "bearer",
    "bearer": [{ "key": "token", "value": "{{token}}" }]
  },
  "request": {
    "method": "POST",
    "url": "{{baseUrl}}/auth/login",
    "header": [{ "key": "Content-Type", "value": "application/json" }],
    "body": {
      "mode": "raw",
      "raw": "{\"email\": \"admin@testacademy.com\", \"password\": \"TestPass123!\"}"
    }
  }
}
```

---

## RUNNING TESTS

### Quick API Health Check

```bash
# Health check
curl http://localhost:3000/health

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@testacademy.com", "password": "TestPass123!"}'
```

### Check All Routes

```bash
# Using the token from login
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Students
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/v1/students

# Teachers
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/v1/teachers

# Classes
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/v1/classes

# Attendance
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/v1/attendance

# Fees
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/v1/fees

# Grades
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/v1/grades
```

---

## REPORT BUGS

Document any issues found:

1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Screenshots/logs
5. Environment (browser, OS)

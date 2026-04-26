# How to Run E2E Tests

## Step 1 — Start backend
```bash
# Terminal 1
cd "D:\SCHOOL MANAGEMNET"
npm run dev
```

## Step 2 — Start frontend
```bash
# Terminal 2
cd "D:\SCHOOL MANAGEMNET\school-management-frontend"
npm start
```

## Step 3 — Seed test users (first time only)
```bash
# Terminal 3
cd "D:\SCHOOL MANAGEMNET"
npm run db:seed            # creates superadmin@system.com
npm run seed:test-users    # creates admin/teacher/student/parent
```

## Step 4 — Run all E2E tests
```bash
npm run e2e                    # all tests, headless
npm run e2e:headed             # watch browser
npm run e2e:ui                 # Playwright interactive UI
npm run e2e:api                # API tests only
npm run e2e:auth               # Login flow tests only
npm run e2e:report             # Open last HTML report
npm run e2e:debug              # Step through with debugger
```

## Run a single test file
```bash
npx playwright test e2e/tests/03-student-management.spec.ts
npx playwright test e2e/tests/07-fees-payments.spec.ts --headed
```

## Run tests matching a title
```bash
npx playwright test --grep "can add a new student"
npx playwright test --grep "Admin Dashboard"
```

## Test files overview
| File | What it tests |
|------|---------------|
| 00-auth.setup.ts | Login all roles, save sessions |
| 01-login-flows.spec.ts | Login/logout/guards for all roles |
| 02-admin-dashboard.spec.ts | Dashboard KPIs and nav for all roles |
| 03-student-management.spec.ts | CRUD students (Admin) |
| 04-teacher-management.spec.ts | CRUD teachers (Admin) |
| 05-class-management.spec.ts | Classes, academic years, subjects |
| 06-attendance.spec.ts | Mark & view attendance (Admin/Teacher/Student) |
| 07-fees-payments.spec.ts | Fee categories, payments, student/parent view |
| 08-grades-assessments.spec.ts | Grade entry, report cards |
| 09-timetable.spec.ts | Timetable CRUD and view |
| 10-reports-staff-parents.spec.ts | Reports, staff, parents, profile, settings |
| 11-super-admin.spec.ts | Super admin dashboard, school mgmt |
| 12-ai-chat.spec.ts | AI chat interface |
| 13-api-all-endpoints.spec.ts | Direct HTTP tests for every API endpoint |

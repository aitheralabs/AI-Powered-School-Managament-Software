# School Management SaaS — Architecture Document

## Overview

A multi-tenant, AI-powered School Management System offered as a Software-as-a-Service (SaaS) product to multiple schools. Each school is an isolated tenant with its own data, users, and subscription plan.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend API | Node.js 20 + Express 5 + TypeScript |
| Frontend | Angular 19 (standalone components) |
| Database | PostgreSQL 16 (primary datastore) |
| Cache | Redis 7 (query cache, session invalidation) |
| AI | Anthropic Claude API (claude-haiku-4-5) |
| Auth | JWT (RS256 access + refresh token rotation) |
| Email | Nodemailer (SMTP — SendGrid / AWS SES in prod) |
| Payments | Razorpay (India) + Stripe (international) |
| Monitoring | Sentry (errors) + express-status-monitor |
| Containerization | Docker + docker-compose |
| CI/CD | GitHub Actions |
| Reverse Proxy | Nginx |

---

## Multi-Tenancy Architecture

### Strategy: Shared Database, Row-Level Isolation

Every data table has a `school_id` UUID foreign key. All queries are scoped by `school_id`. This is the simplest strategy to operate and scale at startup stage.

```
schools (tenants)
   │
   ├── users          (school_id FK)
   ├── students       (school_id FK)
   ├── teachers       (school_id FK)
   ├── classes        (school_id FK)
   ├── attendance     (school_id FK)
   ├── fees / payments(school_id FK)
   ├── grades         (school_id FK)
   └── ... all tables (school_id FK)
```

### Tenant Resolution Flow

```
HTTP Request
    │
    ▼
authenticate()          — verify JWT, load user.schoolId from users table
    │
    ▼
resolveTenant()         — load school record from DB (with in-process 60s cache)
    │                     attach req.school and req.schoolId
    ▼
requireActiveSubscription()  — check subscription_status, trial_ends_at
    │
    ▼
requireFeature('aiInsights') — check feature flags (per plan)
    │
    ▼
Controller              — use req.schoolId in every DB query
```

### Subdomain Routing (Production)

Each school gets a unique slug (e.g. `greenwood`). The Angular frontend reads the subdomain and sends an `X-School-ID` header, or the slug is resolved on the backend.

```
greenwood.yourapp.com  →  Nginx  →  Angular SPA
                          Nginx  →  /api/v1/* → Node.js API (req.schoolId resolved from JWT)
```

---

## Subscription Plans

| Plan | Price/month | Students | Teachers | AI Insights | Library | Transport |
|---|---|---|---|---|---|---|
| Trial (30 days) | Free | 100 | 20 | ✗ | ✗ | ✗ |
| Basic | ₹999 | 300 | 30 | ✗ | ✗ | ✗ |
| Standard | ₹2,499 | 1,000 | 80 | ✓ | ✓ | ✗ |
| Premium | ₹4,999 | 3,000 | 200 | ✓ | ✓ | ✓ |
| Enterprise | Custom | Unlimited | Unlimited | ✓ | ✓ | ✓ |

### Subscription Enforcement

1. `requireActiveSubscription` middleware blocks requests when trial/subscription has expired.
2. `requireFeature(featureName)` blocks requests to premium features.
3. `schoolService.checkLimit(schoolId, 'student')` is called before creating a student — blocks if at plan limit.
4. Webhooks from Razorpay/Stripe update the `schools` table and invalidate the in-process cache.

---

## AI-Powered Features

### Rule-Based Analytics (All Plans — No API Cost)
- **Attendance Risk Detection**: Identifies students below configurable threshold (default 75%)
- **Grade Trend Analysis**: Detects declining performance across semesters
- **Fee Defaulter Risk Scoring**: Scores students 0-100 based on overdue amount and days past due

### AI Narrative Generation (Standard Plan+)
Uses `claude-haiku-4-5-20251001` for cost-effective generation:
- **School Health Summary**: AI-written narrative of attendance, grades, and fee health
- **Natural Language Q&A**: Administrators ask questions in plain English about school data
- **Report Card Comments**: Personalized AI-generated comments per student

---

## Database Schema (Key Tables)

### schools (tenants)
```sql
id, name, slug, email, plan, subscription_status,
trial_ends_at, subscription_ends_at,
max_students, max_teachers, max_staff,
feature_ai_insights, feature_library, feature_transport, ...
```

### users
```sql
id, school_id, first_name, last_name, email, password_hash,
role (admin|teacher|student|parent|staff), is_active
```

### subscription_plans (seed data)
```sql
id, name, price_monthly, price_yearly, max_students,
feature_ai_insights, feature_library, ...
```

### billing_events
```sql
id, school_id, event_type, amount, gateway, gateway_event_id, status
```

---

## API Structure

### Public (no auth)
```
POST /api/v1/schools/register      — self-service onboarding
GET  /api/v1/schools/plans         — list subscription plans
POST /api/v1/auth/login
POST /api/v1/auth/register
GET  /health
POST /api/v1/webhooks/razorpay     — Razorpay payment events
POST /api/v1/webhooks/stripe       — Stripe payment events
```

### Authenticated (school users)
```
GET  /api/v1/schools/me            — school profile
GET  /api/v1/schools/me/usage      — usage vs limits

# Rule-based analytics (basic+)
GET  /api/v1/ai/attendance-risks
GET  /api/v1/ai/grade-trends
GET  /api/v1/ai/fee-risks

# AI-powered (standard+, feature_ai_insights required)
GET  /api/v1/ai/school-health
POST /api/v1/ai/ask

# All existing school-management routes
/api/v1/students, /api/v1/teachers, /api/v1/attendance, ...
```

### Super-Admin (platform operators)
```
POST /api/v1/superadmin/login
GET  /api/v1/superadmin/schools
GET  /api/v1/superadmin/stats
PUT  /api/v1/superadmin/schools/:id/subscription
POST /api/v1/superadmin/schools/:id/suspend
POST /api/v1/superadmin/schools/:id/reactivate
```

---

## Security Architecture

| Threat | Mitigation |
|---|---|
| SQL Injection | Parameterized queries everywhere; `preventSQLInjection` middleware |
| XSS | Helmet headers; xss sanitization; Angular DomSanitizer |
| CSRF | SameSite cookies; CORS origin whitelist |
| Brute Force | express-rate-limit (5 req/min on auth routes); express-slow-down |
| Token Theft | Short-lived access tokens (1h); refresh token rotation; DB-stored refresh tokens |
| Data Leakage | Row-level school_id isolation on all queries; no cross-tenant data access |
| Webhook Fraud | Signature verification (HMAC-SHA256) on Razorpay and Stripe webhooks |
| Tenant Escalation | super_admin uses a separate JWT secret; school users cannot access superadmin routes |

---

## Deployment Architecture

```
Internet
    │
    ▼
[Nginx] ─── SSL termination, rate limiting, static file serving
    │
    ├──── /          → Angular SPA (static files)
    └──── /api/v1/*  → Node.js API container (port 3000)
                           │
                           ├── PostgreSQL (persistent data)
                           ├── Redis (cache)
                           └── Background Worker (notifications, cron jobs)
```

### Docker Services
- `postgres` — database
- `redis` — cache
- `api` — main Node.js API
- `nginx` — reverse proxy + static serving
- `worker` — background notification processor + cron jobs

---

## Development Setup

```bash
# 1. Clone and install
git clone <repo>
npm install
cd school-management-frontend && npm install && cd ..

# 2. Configure environment
cp .env.example .env
# Edit .env with your database credentials, JWT secrets, etc.

# 3. Start database (Docker)
docker-compose up postgres redis -d

# 4. Run migrations
npm run db:migrate

# 5. Start API in dev mode
npm run dev

# 6. Start Angular frontend
cd school-management-frontend && ng serve
```

### Onboard your first school
```bash
curl -X POST http://localhost:3000/api/v1/schools/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Greenwood Academy",
    "slug": "greenwood",
    "email": "admin@greenwood.edu",
    "adminFirstName": "Ravi",
    "adminLastName": "Kumar",
    "adminPassword": "SecurePass123!"
  }'
```

---

## Roadmap

### Phase 1 — Foundation (DONE)
- [x] Core school management (students, teachers, attendance, fees, grades)
- [x] Authentication & RBAC
- [x] Security hardening

### Phase 2 — SaaS (In Progress)
- [x] Multi-tenancy (school_id isolation)
- [x] Subscription plans & billing
- [x] Payment gateway webhooks (Razorpay + Stripe)
- [x] Tenant middleware + feature flags
- [x] Super-admin dashboard API
- [ ] Frontend: school registration/onboarding flow
- [ ] Frontend: subscription management UI
- [ ] Razorpay hosted checkout integration

### Phase 3 — AI & Advanced Features
- [x] Rule-based analytics (attendance/grade/fee risks)
- [x] AI narrative summaries (Claude API)
- [x] AI Q&A for administrators
- [ ] AI-generated report card comments
- [ ] Timetable management UI
- [ ] Exam scheduling module
- [ ] Library management module

### Phase 4 — Growth
- [ ] Mobile app (React Native / Capacitor)
- [ ] Real-time notifications (WebSockets)
- [ ] Transport/GPS tracking
- [ ] Hostel management
- [ ] Custom branding (white-label)
- [ ] Multi-language support (i18n)
- [ ] Advanced analytics dashboard

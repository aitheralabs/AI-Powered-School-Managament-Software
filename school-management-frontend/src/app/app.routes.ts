import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  // ─── Public landing page ──────────────────────────────────────────────────
  {
    path: '',
    loadComponent: () =>
      import('./components/landing/landing.component').then(
        (c) => c.LandingComponent,
      ),
  },
  // ─── School self-registration (public) ──────────────────────────────────
  {
    path: 'school-register',
    loadComponent: () =>
      import('./modules/school-register/school-register.component').then(
        (c) => c.SchoolRegisterComponent,
      ),
  },
  // ─── Auth ────────────────────────────────────────────────────────────────
  {
    path: 'auth',
    loadChildren: () =>
      import('./modules/auth/auth.module').then((m) => m.AuthModule),
  },
  // ─── Super Admin (standalone, no shell) ─────────────────────────────────
  {
    path: 'super-admin',
    loadChildren: () =>
      import('./modules/super-admin/super-admin.routes').then(
        (m) => m.superAdminRoutes,
      ),
  },
  // ─── School Portal (guarded) ─────────────────────────────────────────────
  {
    path: 'dashboard',
    loadChildren: () =>
      import('./modules/dashboard/dashboard.module').then(
        (m) => m.DashboardModule,
      ),
    canActivate: [AuthGuard],
    data: { roles: ['admin', 'teacher', 'student', 'parent', 'staff'] },
  },
  {
    path: 'academic',
    loadChildren: () =>
      import('./modules/academic/academic-routing.module').then(
        (m) => m.routes,
      ),
    canActivate: [AuthGuard],
    data: { roles: ['admin', 'staff'] },
  },
  {
    path: 'students',
    loadChildren: () =>
      import('./modules/students/students.module').then(
        (m) => m.StudentsModule,
      ),
    canActivate: [AuthGuard],
    data: { roles: ['admin', 'teacher', 'staff'] },
  },
  {
    path: 'teachers',
    loadChildren: () =>
      import('./modules/teachers/teachers.module').then(
        (m) => m.TeachersModule,
      ),
    canActivate: [AuthGuard],
    data: { roles: ['admin', 'staff'] },
  },
  {
    path: 'classes',
    loadChildren: () =>
      import('./modules/classes/classes.module').then((m) => m.ClassesModule),
    canActivate: [AuthGuard],
    data: { roles: ['admin', 'teacher', 'staff'] },
  },
  {
    path: 'attendance',
    loadChildren: () =>
      import('./modules/attendance/attendance.module').then(
        (m) => m.AttendanceModule,
      ),
    canActivate: [AuthGuard],
    data: { roles: ['admin', 'teacher', 'staff'] },
  },
  {
    path: 'fees',
    loadChildren: () =>
      import('./modules/fees/fees.routes').then((m) => m.feesRoutes),
    canActivate: [AuthGuard],
    data: { roles: ['admin', 'staff'] },
  },
  {
    path: 'grades',
    loadChildren: () =>
      import('./modules/grades/grades.routes').then((m) => m.gradesRoutes),
    canActivate: [AuthGuard],
    data: { roles: ['admin', 'teacher', 'staff'] },
  },
  {
    path: 'timetable',
    loadChildren: () =>
      import('./modules/timetable/timetable.module').then(
        (m) => m.TimetableModule,
      ),
    canActivate: [AuthGuard],
    data: { roles: ['admin', 'teacher', 'staff'] },
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./components/profile/profile.component').then(
        (c) => c.ProfileComponent,
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./components/settings/settings.component').then(
        (c) => c.SettingsComponent,
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'parents',
    loadComponent: () =>
      import('./modules/parents/parent-list.component').then(
        (c) => c.ParentListComponent,
      ),
    canActivate: [AuthGuard],
    data: { roles: ['admin', 'staff'] },
  },
  // "Add parent" opens a dialog on the list page — redirect to list
  {
    path: 'parents/add',
    redirectTo: 'parents',
    pathMatch: 'full',
  },
  {
    path: 'reports',
    loadChildren: () =>
      import('./modules/reports/reports.routes').then((m) => m.reportsRoutes),
    canActivate: [AuthGuard],
    data: { roles: ['admin', 'teacher', 'staff'] },
  },
  {
    path: 'subjects',
    loadComponent: () =>
      import('./modules/subjects/subject-list.component').then(
        (c) => c.SubjectListComponent,
      ),
    canActivate: [AuthGuard],
    data: { roles: ['admin', 'teacher', 'staff'] },
  },
  {
    path: 'ai-chat',
    loadComponent: () =>
      import('./modules/ai-chat/ai-chat.component').then(
        (c) => c.AiChatComponent,
      ),
    canActivate: [AuthGuard],
    data: { roles: ['admin', 'teacher', 'staff'] },
  },
  {
    path: 'ai-insights',
    redirectTo: 'ai-chat',
    pathMatch: 'full',
  },
  {
    path: 'staff',
    loadChildren: () =>
      import('./modules/staff/staff.routes').then((m) => m.staffRoutes),
    canActivate: [AuthGuard],
    data: { roles: ['admin'] },
  },
  {
    path: 'billing',
    loadComponent: () =>
      import('./modules/billing/billing.component').then(
        (c) => c.BillingComponent,
      ),
    canActivate: [AuthGuard],
    data: { roles: ['admin'] },
  },
  {
    path: 'verify-email',
    loadComponent: () =>
      import('./modules/verify-email/verify-email.component').then(
        (c) => c.VerifyEmailComponent,
      ),
  },
  {
    path: 'unauthorized',
    loadComponent: () =>
      import('./components/unauthorized/unauthorized.component').then(
        (c) => c.UnauthorizedComponent,
      ),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./components/not-found/not-found.component').then(
        (c) => c.NotFoundComponent,
      ),
  },
];

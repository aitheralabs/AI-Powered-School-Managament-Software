import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  // ─── Public landing page ──────────────────────────────────────────────────
  {
    path: '',
    loadComponent: () => import('./components/landing/landing.component').then(c => c.LandingComponent)
  },
  // ─── Auth ────────────────────────────────────────────────────────────────
  {
    path: 'auth',
    loadChildren: () => import('./modules/auth/auth.module').then(m => m.AuthModule)
  },
  // ─── Super Admin (standalone, no shell) ─────────────────────────────────
  {
    path: 'super-admin',
    loadChildren: () =>
      import('./modules/super-admin/super-admin.routes').then(m => m.superAdminRoutes)
  },
  // ─── School Portal (guarded) ─────────────────────────────────────────────
  {
    path: 'dashboard',
    loadChildren: () => import('./modules/dashboard/dashboard.module').then(m => m.DashboardModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'academic',
    loadChildren: () => import('./modules/academic/academic-routing.module').then(m => m.routes),
    canActivate: [AuthGuard]
  },
  {
    path: 'students',
    loadChildren: () => import('./modules/students/students.module').then(m => m.StudentsModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'teachers',
    loadChildren: () => import('./modules/teachers/teachers.module').then(m => m.TeachersModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'classes',
    loadChildren: () => import('./modules/classes/classes.module').then(m => m.ClassesModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'attendance',
    loadChildren: () => import('./modules/attendance/attendance.module').then(m => m.AttendanceModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'fees',
    loadChildren: () => import('./modules/fees/fees.routes').then(m => m.feesRoutes),
    canActivate: [AuthGuard]
  },
  {
    path: 'grades',
    loadChildren: () => import('./modules/grades/grades.routes').then(m => m.gradesRoutes),
    canActivate: [AuthGuard]
  },
  {
    path: 'profile',
    loadComponent: () => import('./components/profile/profile.component').then(c => c.ProfileComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'settings',
    loadComponent: () => import('./components/settings/settings.component').then(c => c.SettingsComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'unauthorized',
    loadComponent: () => import('./components/unauthorized/unauthorized.component').then(c => c.UnauthorizedComponent)
  },
  {
    path: '**',
    loadComponent: () => import('./components/not-found/not-found.component').then(c => c.NotFoundComponent)
  }
];

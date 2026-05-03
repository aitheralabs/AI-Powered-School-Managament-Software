import { Routes } from '@angular/router';

export const superAdminRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./components/super-admin-login/super-admin-login.component')
        .then(c => c.SuperAdminLoginComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./components/super-admin-dashboard/super-admin-dashboard.component')
        .then(c => c.SuperAdminDashboardComponent)
  },
  {
    path: 'schools',
    loadComponent: () =>
      import('./components/schools-list/schools-list.component')
        .then(c => c.SchoolsListComponent)
  },
  {
    path: 'schools/:id',
    loadComponent: () =>
      import('./components/school-detail/school-detail.component')
        .then(c => c.SchoolDetailComponent)
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];

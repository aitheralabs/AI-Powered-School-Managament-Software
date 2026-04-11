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
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];

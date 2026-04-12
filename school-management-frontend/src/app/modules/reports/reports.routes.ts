import { Routes } from '@angular/router';

export const reportsRoutes: Routes = [
  {
    path: '',
    redirectTo: 'attendance',
    pathMatch: 'full',
  },
  {
    path: 'attendance',
    loadComponent: () =>
      import('../attendance/components/attendance-reports/attendance-reports.component')
        .then(c => c.AttendanceReportsComponent),
  },
  {
    path: 'fees',
    loadComponent: () =>
      import('../fees/components/fee-list/fee-list.component')
        .then(c => c.FeeListComponent),
  },
  {
    path: 'report-cards',
    loadComponent: () =>
      import('../grades/components/report-cards/report-cards.component')
        .then(c => c.ReportCardsComponent),
  },
];

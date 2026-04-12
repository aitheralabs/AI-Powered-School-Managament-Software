import { Routes } from '@angular/router';

export const feesRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/fee-list/fee-list.component').then(c => c.FeeListComponent),
  },
  {
    // Alias: sidebar links here — show the same fee management page
    path: 'categories',
    loadComponent: () =>
      import('./components/fee-list/fee-list.component').then(c => c.FeeListComponent),
  },
  {
    // Alias: sidebar links here — show the fee management page
    path: 'student-fees',
    loadComponent: () =>
      import('./components/fee-list/fee-list.component').then(c => c.FeeListComponent),
  },
  {
    path: 'payments',
    loadComponent: () =>
      import('./components/payment-list/payment-list.component').then(c => c.PaymentListComponent),
  },
  {
    // Alias: fee reports → payment list
    path: 'reports',
    loadComponent: () =>
      import('./components/payment-list/payment-list.component').then(c => c.PaymentListComponent),
  },
];

import { Routes } from '@angular/router';

export const feesRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/fee-list/fee-list.component').then(c => c.FeeListComponent),
  },
];

import { Routes } from '@angular/router';

export const staffRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./staff-list.component').then((c) => c.StaffListComponent),
  },
];

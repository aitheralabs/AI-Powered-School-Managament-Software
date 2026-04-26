import { Routes } from '@angular/router';

export const staffRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./staff-list.component').then((c) => c.StaffListComponent),
  },
  // "Add staff" opens a dialog on the list page — redirect to list
  {
    path: 'add',
    redirectTo: '',
    pathMatch: 'full',
  },
];

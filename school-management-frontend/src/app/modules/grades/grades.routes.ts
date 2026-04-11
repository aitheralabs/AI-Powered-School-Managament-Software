import { Routes } from '@angular/router';

export const gradesRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/grade-list/grade-list.component').then(c => c.GradeListComponent),
  },
];

import { Routes } from '@angular/router';

export const gradesRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/grade-list/grade-list.component').then(c => c.GradeListComponent),
  },
  {
    // Alias: sidebar "Grade Entry" → grade list (form is inline on that page)
    path: 'entry',
    loadComponent: () =>
      import('./components/grade-list/grade-list.component').then(c => c.GradeListComponent),
  },
  {
    path: 'report-cards',
    loadComponent: () =>
      import('./components/report-cards/report-cards.component').then(c => c.ReportCardsComponent),
  },
  {
    // Assessment types are managed inside the grade list page
    path: 'assessment-types',
    loadComponent: () =>
      import('./components/grade-list/grade-list.component').then(c => c.GradeListComponent),
  },
];

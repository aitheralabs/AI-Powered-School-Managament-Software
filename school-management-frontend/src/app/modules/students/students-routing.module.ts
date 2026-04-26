import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StudentListComponent } from './components/student-list/student-list.component';
import { StudentDetailComponent } from './components/student-detail/student-detail.component';

const routes: Routes = [
  {
    path: '',
    component: StudentListComponent
  },
  // "Add student" opens a dialog on the list page — redirect to list
  {
    path: 'add',
    redirectTo: '',
    pathMatch: 'full',
  },
  // "Student reports" links to the attendance reports page
  {
    path: 'reports',
    redirectTo: '/reports/attendance',
    pathMatch: 'full',
  },
  {
    path: ':id',
    component: StudentDetailComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class StudentsRoutingModule { }

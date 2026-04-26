import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TeacherListComponent } from './components/teacher-list/teacher-list.component';
import { TeacherDetailComponent } from './components/teacher-detail/teacher-detail.component';

const routes: Routes = [
  {
    path: '',
    component: TeacherListComponent
  },
  // "Add teacher" opens a dialog on the list page — redirect to list
  {
    path: 'add',
    redirectTo: '',
    pathMatch: 'full',
  },
  // Teacher assignments shown on list page
  {
    path: 'assignments',
    redirectTo: '',
    pathMatch: 'full',
  },
  {
    path: ':id',
    component: TeacherDetailComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TeachersRoutingModule { }

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TimetableViewComponent } from './components/timetable-view/timetable-view.component';
import { TimetableFormComponent } from './components/timetable-form/timetable-form.component';
import { ExamsComponent } from './components/exams/exams.component';

const routes: Routes = [
  { path: '', redirectTo: 'view', pathMatch: 'full' },
  { path: 'view',  component: TimetableViewComponent,  data: { title: 'Class Timetable' } },
  { path: 'manage', component: TimetableFormComponent, data: { title: 'Manage Timetable' } },
  { path: 'exams',  component: ExamsComponent,         data: { title: 'Exams' } },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TimetableRoutingModule {}

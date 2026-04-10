import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AttendanceMarkingComponent } from './components/attendance-marking/attendance-marking.component';
import { AttendanceReportsComponent } from './components/attendance-reports/attendance-reports.component';
import { AttendanceCalendarComponent } from './components/attendance-calendar/attendance-calendar.component';
import { StudentAttendanceComponent } from './components/student-attendance/student-attendance.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'marking',
    pathMatch: 'full'
  },
  {
    path: 'marking',
    component: AttendanceMarkingComponent,
    data: { title: 'Mark Attendance' }
  },
  {
    path: 'reports',
    component: AttendanceReportsComponent,
    data: { title: 'Attendance Reports' }
  },
  {
    path: 'calendar',
    component: AttendanceCalendarComponent,
    data: { title: 'Attendance Calendar' }
  },
  {
    path: 'student/:studentId',
    component: StudentAttendanceComponent,
    data: { title: 'Student Attendance' }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AttendanceRoutingModule { }
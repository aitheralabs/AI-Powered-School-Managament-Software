import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

// Angular Material Modules
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatMenuModule } from '@angular/material/menu';

// Routing
import { AttendanceRoutingModule } from './attendance-routing.module';

// Components
import { AttendanceMarkingComponent } from './components/attendance-marking/attendance-marking.component';
import { AttendanceReportsComponent } from './components/attendance-reports/attendance-reports.component';
import { AttendanceCalendarComponent } from './components/attendance-calendar/attendance-calendar.component';
import { StudentAttendanceComponent } from './components/student-attendance/student-attendance.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AttendanceRoutingModule,
    
    // Material Modules
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatChipsModule,
    MatTabsModule,
    MatRadioModule,
    MatCheckboxModule,
    MatPaginatorModule,
    MatSortModule,
    MatMenuModule,
    
    // Standalone Components
    AttendanceMarkingComponent,
    AttendanceReportsComponent,
    AttendanceCalendarComponent,
    StudentAttendanceComponent
  ]
})
export class AttendanceModule { }
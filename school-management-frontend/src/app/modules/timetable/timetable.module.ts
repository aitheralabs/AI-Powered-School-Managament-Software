import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { TimetableRoutingModule } from './timetable-routing.module';
import { TimetableViewComponent } from './components/timetable-view/timetable-view.component';
import { TimetableFormComponent } from './components/timetable-form/timetable-form.component';
import { ExamsComponent } from './components/exams/exams.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    TimetableRoutingModule,
    MatCardModule, MatButtonModule, MatIconModule, MatTableModule,
    MatFormFieldModule, MatSelectModule, MatInputModule, MatDialogModule,
    MatProgressSpinnerModule, MatTooltipModule, MatTabsModule, MatChipsModule,
    MatMenuModule, MatDatepickerModule, MatNativeDateModule, MatSnackBarModule,
    TimetableViewComponent,
    TimetableFormComponent,
    ExamsComponent,
  ]
})
export class TimetableModule {}

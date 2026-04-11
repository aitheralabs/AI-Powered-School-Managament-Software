import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';

import { TimetableService } from '../../../../services/timetable.service';
import { ClassService } from '../../../../services/class.service';
import { TimetableSlot, WeeklyTimetable, DAY_NAMES } from '../../../../models/timetable.model';

@Component({
  selector: 'app-timetable-view',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    MatIconModule, MatProgressSpinnerModule, MatSelectModule,
    MatFormFieldModule, MatTooltipModule, MatButtonModule,
  ],
  templateUrl: './timetable-view.component.html',
  styleUrl: './timetable-view.component.scss'
})
export class TimetableViewComponent implements OnInit {
  classes: any[] = [];
  selectedClassId = '';
  weeklyData: WeeklyTimetable | null = null;
  isLoading = false;
  error = '';

  readonly days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  constructor(
    private timetableService: TimetableService,
    private classService: ClassService,
  ) {}

  ngOnInit() {
    this.loadClasses();
  }

  loadClasses() {
    this.classService.getClasses({ limit: 100 }).subscribe({
      next: (res: any) => {
        this.classes = res.data?.items || res.data || [];
        if (this.classes.length > 0) {
          this.selectedClassId = this.classes[0].id;
          this.loadTimetable();
        }
      },
      error: () => {}
    });
  }

  loadTimetable() {
    if (!this.selectedClassId) return;
    this.isLoading = true;
    this.error = '';
    this.timetableService.getClassTimetable(this.selectedClassId).subscribe({
      next: (res) => {
        this.weeklyData = res.data ?? null;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load timetable';
        this.isLoading = false;
      }
    });
  }

  onClassChange() {
    this.loadTimetable();
  }

  getSlotsForDay(day: string): TimetableSlot[] {
    return this.weeklyData?.timetable[day] || [];
  }

  getSubjectColor(color?: string): string {
    return color || '#6366f1';
  }

  get totalSlots(): number {
    if (!this.weeklyData) return 0;
    return this.days.reduce((sum, d) => sum + this.getSlotsForDay(d).length, 0);
  }
}

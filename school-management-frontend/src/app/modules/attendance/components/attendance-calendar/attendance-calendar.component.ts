import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AttendanceService } from '../../../../services/attendance.service';
import { ClassService } from '../../../../services/class.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

interface CalendarDay {
  date: Date;
  dayNum: number;
  isCurrentMonth: boolean;
  status?: string;   // present | absent | late | holiday | null
  count?: { present: number; absent: number; late: number };
}

@Component({
  selector: 'app-attendance-calendar',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatIconModule, MatButtonModule,
    MatProgressSpinnerModule, MatSelectModule, MatFormFieldModule, MatTooltipModule,
  ],
  templateUrl: './attendance-calendar.component.html',
  styleUrl: './attendance-calendar.component.scss',
})
export class AttendanceCalendarComponent implements OnInit {
  currentDate = new Date();
  year  = this.currentDate.getFullYear();
  month = this.currentDate.getMonth(); // 0-based

  classes: any[] = [];
  selectedClassId = '';
  isLoading = false;

  calendarWeeks: CalendarDay[][] = [];
  weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Map from 'YYYY-MM-DD' → attendance summary
  attendanceMap: Record<string, { present: number; absent: number; late: number }> = {};

  constructor(
    private attendanceService: AttendanceService,
    private classService: ClassService,
  ) {}

  ngOnInit() {
    this.loadClasses();
    this.buildCalendar();
  }

  loadClasses() {
    (this.classService as any).getClasses({ limit: 100 })
      .pipe(catchError(() => of({ data: [] })))
      .subscribe((res: any) => {
        this.classes = res.data?.items || res.data || [];
      });
  }

  buildCalendar() {
    const firstDay = new Date(this.year, this.month, 1);
    const lastDay  = new Date(this.year, this.month + 1, 0);

    const days: CalendarDay[] = [];

    // Pad from previous month
    for (let i = 0; i < firstDay.getDay(); i++) {
      const d = new Date(this.year, this.month, -i);
      days.unshift({ date: d, dayNum: d.getDate(), isCurrentMonth: false });
    }

    // Current month days
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(this.year, this.month, d);
      const key = this.toKey(date);
      const info = this.attendanceMap[key];
      days.push({ date, dayNum: d, isCurrentMonth: true, count: info });
    }

    // Pad to end
    const remainder = 7 - (days.length % 7);
    if (remainder < 7) {
      for (let i = 1; i <= remainder; i++) {
        const d = new Date(this.year, this.month + 1, i);
        days.push({ date: d, dayNum: d.getDate(), isCurrentMonth: false });
      }
    }

    // Chunk into weeks
    this.calendarWeeks = [];
    for (let i = 0; i < days.length; i += 7) {
      this.calendarWeeks.push(days.slice(i, i + 7));
    }
  }

  loadAttendance() {
    this.isLoading = true;
    const startDate = `${this.year}-${String(this.month + 1).padStart(2, '0')}-01`;
    const lastD = new Date(this.year, this.month + 1, 0).getDate();
    const endDate = `${this.year}-${String(this.month + 1).padStart(2, '0')}-${String(lastD).padStart(2, '0')}`;

    const params: any = { startDate, endDate, limit: 500 };
    if (this.selectedClassId) params.classId = this.selectedClassId;

    this.attendanceService.getAttendance(params)
      .pipe(catchError(() => of({ data: { items: [] } })))
      .subscribe((res: any) => {
        const records: any[] = res.data?.items || res.data || [];
        this.attendanceMap = {};

        records.forEach((r: any) => {
          const key = r.date?.split('T')[0] || r.date;
          if (!key) return;
          if (!this.attendanceMap[key]) {
            this.attendanceMap[key] = { present: 0, absent: 0, late: 0 };
          }
          const status = (r.status || '').toLowerCase();
          if (status === 'present')      this.attendanceMap[key].present++;
          else if (status === 'absent')  this.attendanceMap[key].absent++;
          else if (status === 'late')    this.attendanceMap[key].late++;
        });

        this.isLoading = false;
        this.buildCalendar();
      });
  }

  prevMonth() {
    if (this.month === 0) { this.month = 11; this.year--; }
    else this.month--;
    this.loadAttendance();
  }

  nextMonth() {
    if (this.month === 11) { this.month = 0; this.year++; }
    else this.month++;
    this.loadAttendance();
  }

  onClassChange() { this.loadAttendance(); }

  getMonthLabel(): string {
    return new Date(this.year, this.month, 1)
      .toLocaleString('default', { month: 'long', year: 'numeric' });
  }

  getDayClass(day: CalendarDay): string {
    if (!day.isCurrentMonth) return 'other-month';
    if (!day.count) return '';
    const { present, absent } = day.count;
    if (absent === 0 && present > 0) return 'all-present';
    if (present === 0 && absent > 0) return 'all-absent';
    if (absent > 0) return 'mixed';
    return '';
  }

  getTooltip(day: CalendarDay): string {
    if (!day.count) return '';
    const { present, absent, late } = day.count;
    return `Present: ${present}  Absent: ${absent}  Late: ${late}`;
  }

  private toKey(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  isToday(day: CalendarDay): boolean {
    const t = new Date();
    return day.date.getDate() === t.getDate() &&
           day.date.getMonth() === t.getMonth() &&
           day.date.getFullYear() === t.getFullYear();
  }
}

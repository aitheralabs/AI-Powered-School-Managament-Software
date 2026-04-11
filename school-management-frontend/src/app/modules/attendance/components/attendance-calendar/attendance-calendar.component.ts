import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-attendance-calendar',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <div class="attendance-calendar" style="padding:24px">
      <mat-card>
        <mat-card-header>
          <mat-card-title>
            <mat-icon style="vertical-align:middle;margin-right:8px">calendar_month</mat-icon>
            Attendance Calendar
          </mat-card-title>
        </mat-card-header>
        <mat-card-content style="padding:24px 0 8px">
          <p style="color:#64748b">Monthly attendance calendar view coming soon.</p>
        </mat-card-content>
      </mat-card>
    </div>
  `
})
export class AttendanceCalendarComponent implements OnInit {
  ngOnInit() {}
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';

import { GradeService } from '../../../../services/grade.service';
import { NotificationService } from '../../../../services/notification.service';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-grade-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatTableModule,
    MatChipsModule, MatFormFieldModule, MatSelectModule, MatInputModule,
    MatProgressSpinnerModule, MatDialogModule, MatTooltipModule,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1>Grade Management</h1>
          <p class="subtitle">View and manage student grades and academic performance</p>
        </div>
        <div class="header-actions" *ngIf="isTeacherOrAdmin">
          <button mat-raised-button color="primary" (click)="showForm = !showForm">
            <mat-icon>{{ showForm ? 'close' : 'add' }}</mat-icon>
            {{ showForm ? 'Cancel' : 'Add Grade' }}
          </button>
        </div>
      </div>

      <!-- Stats -->
      <div class="stats-row" *ngIf="stats">
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-value">{{ stats.total }}</div>
            <div class="stat-label">Total Grades</div>
          </mat-card-content>
        </mat-card>
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-value">{{ stats.avgPercentage }}%</div>
            <div class="stat-label">Avg Score</div>
          </mat-card-content>
        </mat-card>
        <mat-card class="stat-card pass">
          <mat-card-content>
            <div class="stat-value">{{ stats.passing }}</div>
            <div class="stat-label">Passing</div>
            <div class="stat-sub">{{ stats.passRate }}% pass rate</div>
          </mat-card-content>
        </mat-card>
        <mat-card class="stat-card fail">
          <mat-card-content>
            <div class="stat-value">{{ stats.failing }}</div>
            <div class="stat-label">Failing</div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Grade Distribution -->
      <mat-card *ngIf="stats?.byGradeLetter?.length" class="distribution-card">
        <mat-card-header><mat-card-title>Grade Distribution</mat-card-title></mat-card-header>
        <mat-card-content class="distribution-row">
          <div *ngFor="let g of stats.byGradeLetter" class="grade-chip">
            <span class="grade-letter">{{ g.grade }}</span>
            <span class="grade-count">{{ g.count }}</span>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Quick Grade Entry Form -->
      <mat-card *ngIf="showForm" class="form-card">
        <mat-card-header><mat-card-title>Record Grade</mat-card-title></mat-card-header>
        <mat-card-content>
          <form [formGroup]="gradeForm" (ngSubmit)="submitGrade()" class="grade-form">
            <mat-form-field appearance="outline">
              <mat-label>Student ID</mat-label>
              <input matInput formControlName="studentId" placeholder="Student UUID" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Subject ID</mat-label>
              <input matInput formControlName="subjectId" placeholder="Subject UUID" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Assessment Type ID</mat-label>
              <input matInput formControlName="assessmentTypeId" placeholder="Assessment Type UUID" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Semester ID</mat-label>
              <input matInput formControlName="semesterId" placeholder="Semester UUID" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Marks Obtained</mat-label>
              <input matInput type="number" formControlName="marksObtained" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Total Marks</mat-label>
              <input matInput type="number" formControlName="totalMarks" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Remarks (optional)</mat-label>
              <input matInput formControlName="remarks" />
            </mat-form-field>
            <div class="form-actions">
              <button mat-raised-button color="primary" type="submit" [disabled]="gradeForm.invalid || submitting">
                <mat-spinner diameter="18" *ngIf="submitting"></mat-spinner>
                {{ submitting ? 'Saving...' : 'Save Grade' }}
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>

      <!-- Grades Table -->
      <mat-card>
        <mat-card-header>
          <mat-card-title>Recent Grades</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div *ngIf="loading" class="loading-center"><mat-spinner diameter="40"></mat-spinner></div>
          <table mat-table [dataSource]="grades" *ngIf="!loading">
            <ng-container matColumnDef="student">
              <th mat-header-cell *matHeaderCellDef>Student</th>
              <td mat-cell *matCellDef="let g">
                {{ g.student?.user?.firstName }} {{ g.student?.user?.lastName }}
              </td>
            </ng-container>
            <ng-container matColumnDef="subject">
              <th mat-header-cell *matHeaderCellDef>Subject</th>
              <td mat-cell *matCellDef="let g">{{ g.subject?.name }}</td>
            </ng-container>
            <ng-container matColumnDef="assessment">
              <th mat-header-cell *matHeaderCellDef>Assessment</th>
              <td mat-cell *matCellDef="let g">{{ g.assessmentType?.name }}</td>
            </ng-container>
            <ng-container matColumnDef="marks">
              <th mat-header-cell *matHeaderCellDef>Marks</th>
              <td mat-cell *matCellDef="let g">{{ g.marksObtained }}/{{ g.totalMarks }}</td>
            </ng-container>
            <ng-container matColumnDef="percentage">
              <th mat-header-cell *matHeaderCellDef>%</th>
              <td mat-cell *matCellDef="let g">{{ g.percentage }}%</td>
            </ng-container>
            <ng-container matColumnDef="grade">
              <th mat-header-cell *matHeaderCellDef>Grade</th>
              <td mat-cell *matCellDef="let g">
                <mat-chip [class]="'grade-' + g.gradeLetter">{{ g.gradeLetter }}</mat-chip>
              </td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let g">
                <button mat-icon-button color="warn" (click)="deleteGrade(g)" *ngIf="isTeacherOrAdmin" matTooltip="Delete">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let row; columns: columns;"></tr>
          </table>
          <p *ngIf="!loading && grades.length === 0" class="empty-state">No grades recorded yet.</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; max-width: 1200px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .page-header h1 { margin: 0; font-size: 1.8rem; font-weight: 600; }
    .subtitle { color: #666; margin: 4px 0 0; }
    .header-actions { display: flex; gap: 12px; }
    .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
    .stat-card mat-card-content { padding: 16px; }
    .stat-value { font-size: 1.6rem; font-weight: 700; color: #1976d2; }
    .stat-label { font-size: 0.85rem; color: #666; margin-top: 4px; }
    .stat-sub { font-size: 0.75rem; color: #999; margin-top: 2px; }
    .pass .stat-value { color: #4caf50; }
    .fail .stat-value { color: #f44336; }
    .distribution-card { margin-bottom: 24px; }
    .distribution-row { display: flex; flex-wrap: wrap; gap: 12px; padding: 8px 0; }
    .grade-chip { display: flex; flex-direction: column; align-items: center; background: #f5f5f5; padding: 8px 16px; border-radius: 8px; min-width: 60px; }
    .grade-letter { font-size: 1.2rem; font-weight: 700; color: #1976d2; }
    .grade-count { font-size: 0.8rem; color: #666; }
    .form-card { margin-bottom: 24px; }
    .grade-form { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .full-width { grid-column: 1 / -1; }
    .form-actions { grid-column: 1 / -1; display: flex; justify-content: flex-end; }
    .loading-center { display: flex; justify-content: center; padding: 40px; }
    .empty-state { text-align: center; color: #999; padding: 32px; }
    @media (max-width: 768px) { .stats-row { grid-template-columns: repeat(2, 1fr); } .grade-form { grid-template-columns: 1fr; } }
  `]
})
export class GradeListComponent implements OnInit {
  grades: any[] = [];
  stats: any = null;
  loading = false;
  submitting = false;
  showForm = false;
  isTeacherOrAdmin = false;

  columns = ['student', 'subject', 'assessment', 'marks', 'percentage', 'grade', 'actions'];

  gradeForm: FormGroup;

  constructor(
    private gradeService: GradeService,
    private notificationService: NotificationService,
    private authService: AuthService,
    private fb: FormBuilder,
  ) {
    this.gradeForm = this.fb.group({
      studentId:        ['', Validators.required],
      subjectId:        ['', Validators.required],
      assessmentTypeId: ['', Validators.required],
      semesterId:       ['', Validators.required],
      marksObtained:    [0, [Validators.required, Validators.min(0)]],
      totalMarks:       [100, [Validators.required, Validators.min(1)]],
      remarks:          [''],
    });
  }

  ngOnInit() {
    this.isTeacherOrAdmin = this.authService.isAdmin() || this.authService.isTeacher() || this.authService.isStaff();
    this.loadAll();
  }

  loadAll() {
    this.loadGrades();
    this.loadStats();
  }

  loadGrades() {
    this.loading = true;
    this.gradeService.getGrades({ limit: 100 }).subscribe({
      next: (res) => {
        this.loading = false;
        this.grades = (res as any).data || [];
      },
      error: () => { this.loading = false; }
    });
  }

  loadStats() {
    this.gradeService.getGradeStats().subscribe({
      next: (res) => { if (res.success) this.stats = res.data; },
      error: () => {}
    });
  }

  submitGrade() {
    if (this.gradeForm.invalid) return;
    this.submitting = true;
    this.gradeService.createGrade(this.gradeForm.value).subscribe({
      next: (res) => {
        this.submitting = false;
        this.notificationService.success('Grade recorded successfully');
        this.gradeForm.reset({ totalMarks: 100, marksObtained: 0 });
        this.showForm = false;
        this.loadAll();
      },
      error: (err) => {
        this.submitting = false;
        this.notificationService.error(err?.error?.message || 'Failed to save grade', 'Error');
      }
    });
  }

  deleteGrade(grade: any) {
    if (!confirm('Delete this grade record?')) return;
    this.gradeService.deleteGrade(grade.id).subscribe({
      next: () => {
        this.notificationService.success('Grade deleted');
        this.loadAll();
      },
      error: () => this.notificationService.error('Failed to delete grade', 'Error')
    });
  }
}

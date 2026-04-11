import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { TimetableService } from '../../../../services/timetable.service';
import { Exam, EXAM_TYPES } from '../../../../models/timetable.model';

@Component({
  selector: 'app-exams',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatDatepickerModule, MatNativeDateModule,
    MatTableModule, MatChipsModule, MatProgressSpinnerModule, MatTooltipModule, MatSnackBarModule,
  ],
  templateUrl: './exams.component.html',
  styleUrl: './exams.component.scss'
})
export class ExamsComponent implements OnInit {
  exams: Exam[] = [];
  isLoading = false;
  isSubmitting = false;
  showForm = false;
  editingExam: Exam | null = null;
  form!: FormGroup;

  readonly examTypeOptions = EXAM_TYPES;
  readonly displayedColumns = ['name', 'type', 'dates', 'status', 'actions'];

  constructor(
    private fb: FormBuilder,
    private timetableService: TimetableService,
    private snack: MatSnackBar,
  ) {}

  ngOnInit() {
    this.buildForm();
    this.loadExams();
  }

  buildForm() {
    this.form = this.fb.group({
      name:        ['', [Validators.required, Validators.minLength(2)]],
      examType:    ['', Validators.required],
      startDate:   ['', Validators.required],
      endDate:     ['', Validators.required],
      instructions:[''],
    });
  }

  loadExams() {
    this.isLoading = true;
    this.timetableService.getExams().subscribe({
      next:  (res) => { this.exams = (res.data as any) || []; this.isLoading = false; },
      error: (err) => { this.snack.open(err.error?.message || 'Failed to load exams', 'Close', { duration: 4000 }); this.isLoading = false; }
    });
  }

  openAdd() {
    this.editingExam = null;
    this.form.reset();
    this.showForm = true;
  }

  openEdit(exam: Exam) {
    this.editingExam = exam;
    this.form.patchValue({
      name:         exam.name,
      examType:     exam.examType,
      startDate:    exam.startDate,
      endDate:      exam.endDate,
      instructions: exam.instructions || '',
    });
    this.showForm = true;
  }

  cancel() { this.showForm = false; this.editingExam = null; }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.isSubmitting = true;

    const v = this.form.value;
    const payload = {
      ...v,
      startDate: this.toDateString(v.startDate),
      endDate:   this.toDateString(v.endDate),
    };

    const req$ = this.editingExam
      ? this.timetableService.updateExam(this.editingExam.id, payload)
      : this.timetableService.createExam(payload);

    req$.subscribe({
      next: () => {
        this.snack.open(this.editingExam ? 'Exam updated' : 'Exam created', 'OK', { duration: 3000 });
        this.showForm = false; this.editingExam = null;
        this.loadExams(); this.isSubmitting = false;
      },
      error: (err) => {
        this.snack.open(err.error?.message || 'Failed to save exam', 'Close', { duration: 4000 });
        this.isSubmitting = false;
      }
    });
  }

  deleteExam(exam: Exam) {
    if (!confirm(`Delete exam "${exam.name}"?`)) return;
    this.timetableService.deleteExam(exam.id).subscribe({
      next: () => { this.snack.open('Exam deleted', 'OK', { duration: 2500 }); this.exams = this.exams.filter(e => e.id !== exam.id); },
      error: (err) => this.snack.open(err.error?.message || 'Failed to delete', 'Close', { duration: 4000 })
    });
  }

  formatExamType(t: string): string {
    return t?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || '';
  }

  private toDateString(v: any): string {
    if (!v) return '';
    if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
    const d = new Date(v);
    return d.toISOString().split('T')[0];
  }
}

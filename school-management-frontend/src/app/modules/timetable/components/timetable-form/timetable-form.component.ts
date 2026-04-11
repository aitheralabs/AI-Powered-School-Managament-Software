import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';

import { TimetableService } from '../../../../services/timetable.service';
import { ClassService } from '../../../../services/class.service';
import { AcademicService } from '../../../../services/academic.service';
import { TeacherService } from '../../../../services/teacher.service';
import { TimetableSlot, DAY_NAMES } from '../../../../models/timetable.model';

@Component({
  selector: 'app-timetable-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule, RouterModule,
    MatIconModule, MatButtonModule, MatFormFieldModule, MatSelectModule,
    MatInputModule, MatProgressSpinnerModule, MatTableModule, MatTooltipModule, MatSnackBarModule,
  ],
  templateUrl: './timetable-form.component.html',
  styleUrl: './timetable-form.component.scss'
})
export class TimetableFormComponent implements OnInit {
  slots: TimetableSlot[] = [];
  classes: any[] = [];
  subjects: any[] = [];
  teachers: any[] = [];

  selectedClassId = '';
  isLoadingSlots = false;
  isSubmitting = false;
  showForm = false;
  editingSlot: TimetableSlot | null = null;
  error = '';

  form!: FormGroup;

  readonly dayOptions = [
    { value: 1, label: 'Monday' }, { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' }, { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' }, { value: 6, label: 'Saturday' },
  ];

  readonly displayedColumns = ['day', 'time', 'subject', 'teacher', 'room', 'actions'];

  constructor(
    private fb: FormBuilder,
    private timetableService: TimetableService,
    private classService: ClassService,
    private academicService: AcademicService,
    private teacherService: TeacherService,
    private snack: MatSnackBar,
  ) {}

  ngOnInit() {
    this.buildForm();
    this.loadInitialData();
  }

  buildForm() {
    this.form = this.fb.group({
      classId:   ['', Validators.required],
      subjectId: ['', Validators.required],
      teacherId: [''],
      dayOfWeek: [null, [Validators.required, Validators.min(1), Validators.max(7)]],
      startTime: ['', [Validators.required, Validators.pattern(/^\d{2}:\d{2}$/)]],
      endTime:   ['', [Validators.required, Validators.pattern(/^\d{2}:\d{2}$/)]],
      room:      [''],
    });
  }

  loadInitialData() {
    forkJoin({
      classes:  this.classService.getClasses({ limit: 100 }),
      subjects: this.academicService.getSubjects({ limit: 200 }),
      teachers: this.teacherService.getTeachers({ limit: 200 }),
    }).subscribe({
      next: ({ classes, subjects, teachers }: any) => {
        this.classes  = classes.data?.items  || classes.data  || [];
        this.subjects = subjects.data?.items || subjects.data || [];
        this.teachers = (teachers.data?.items || teachers.data || []).map((t: any) => ({
          id: t.id,
          name: t.firstName && t.lastName ? `${t.firstName} ${t.lastName}` : (t.name || t.id),
        }));

        if (this.classes.length > 0) {
          this.selectedClassId = this.classes[0].id;
          this.form.patchValue({ classId: this.selectedClassId });
          this.loadSlots();
        }
      },
      error: () => {}
    });
  }

  loadSlots() {
    if (!this.selectedClassId) return;
    this.isLoadingSlots = true;
    this.error = '';
    this.timetableService.getSlots({ classId: this.selectedClassId }).subscribe({
      next: (res) => {
        this.slots = (res.data as any) || [];
        this.isLoadingSlots = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load slots';
        this.isLoadingSlots = false;
      }
    });
  }

  onClassChange() {
    this.form.patchValue({ classId: this.selectedClassId });
    this.loadSlots();
  }

  openAddForm() {
    this.editingSlot = null;
    this.form.reset({ classId: this.selectedClassId });
    this.showForm = true;
  }

  openEditForm(slot: TimetableSlot) {
    this.editingSlot = slot;
    this.form.patchValue({
      classId:   slot.class.id,
      subjectId: slot.subject.id,
      teacherId: slot.teacher?.id || '',
      dayOfWeek: slot.dayOfWeek,
      startTime: (slot.startTime || '').toString().slice(0, 5),
      endTime:   (slot.endTime   || '').toString().slice(0, 5),
      room:      slot.room || '',
    });
    this.showForm = true;
  }

  cancelForm() {
    this.showForm = false;
    this.editingSlot = null;
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.isSubmitting = true;

    const payload = {
      ...this.form.value,
      dayOfWeek: Number(this.form.value.dayOfWeek),
      teacherId: this.form.value.teacherId || undefined,
      room:      this.form.value.room      || undefined,
    };

    const req$ = this.editingSlot
      ? this.timetableService.updateSlot(this.editingSlot.id, payload)
      : this.timetableService.createSlot(payload);

    req$.subscribe({
      next: () => {
        this.snack.open(this.editingSlot ? 'Slot updated' : 'Slot created', 'OK', { duration: 3000 });
        this.showForm    = false;
        this.editingSlot = null;
        this.loadSlots();
        this.isSubmitting = false;
      },
      error: (err) => {
        this.snack.open(err.error?.message || 'Failed to save slot', 'Close', { duration: 4000 });
        this.isSubmitting = false;
      }
    });
  }

  deleteSlot(slot: TimetableSlot) {
    if (!confirm(`Delete ${slot.subject.name} on ${DAY_NAMES[slot.dayOfWeek]}?`)) return;
    this.timetableService.deleteSlot(slot.id).subscribe({
      next: () => {
        this.snack.open('Slot deleted', 'OK', { duration: 2500 });
        this.slots = this.slots.filter(s => s.id !== slot.id);
      },
      error: (err) => this.snack.open(err.error?.message || 'Failed to delete', 'Close', { duration: 4000 })
    });
  }

  getDayName(n: number): string { return DAY_NAMES[n] || `Day ${n}`; }
}

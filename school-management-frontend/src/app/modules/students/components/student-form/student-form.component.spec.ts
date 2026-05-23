import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { StudentFormComponent } from './student-form.component';
import { StudentService } from '../../../../services/student.service';
import { NotificationService } from '../../../../services/notification.service';
import { ApiService } from '../../../../services/api.service';

describe('StudentFormComponent', () => {
  let component: StudentFormComponent;
  let fixture: ComponentFixture<StudentFormComponent>;
  let studentServiceSpy: jasmine.SpyObj<StudentService>;
  let notificationSpy: jasmine.SpyObj<NotificationService>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<StudentFormComponent>>;

  function createComponent(dialogData: any = null) {
    studentServiceSpy = jasmine.createSpyObj('StudentService', ['createStudent', 'updateStudent']);
    notificationSpy = jasmine.createSpyObj('NotificationService', ['success', 'error']);
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['getPaginated']);
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    apiServiceSpy.getPaginated.and.returnValue(of({
      success: true, data: { items: [{ id: 'c1', name: 'Grade 5A' }] }
    } as any));

    TestBed.configureTestingModule({
      imports: [StudentFormComponent, NoopAnimationsModule],
      providers: [
        { provide: StudentService, useValue: studentServiceSpy },
        { provide: NotificationService, useValue: notificationSpy },
        { provide: ApiService, useValue: apiServiceSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: dialogData }
      ]
    });

    fixture = TestBed.createComponent(StudentFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  describe('create mode', () => {
    beforeEach(() => createComponent(null));

    it('should create in create mode', () => {
      expect(component).toBeTruthy();
      expect(component.isEditMode).toBe(false);
    });

    it('should load classes on init', () => {
      expect(apiServiceSpy.getPaginated).toHaveBeenCalledWith('classes');
      expect(component.classes.length).toBe(1);
    });

    it('should require password in create mode', () => {
      expect(component.studentForm.get('password')?.hasError('required')).toBe(true);
    });

    it('should require mandatory fields', () => {
      expect(component.studentForm.valid).toBe(false);
      expect(component.studentForm.get('firstName')?.hasError('required')).toBe(true);
      expect(component.studentForm.get('studentId')?.hasError('required')).toBe(true);
    });

    it('should call createStudent on valid submit', () => {
      studentServiceSpy.createStudent.and.returnValue(of({ success: true, data: {} } as any));
      fillValidForm();
      component.onSubmit();
      expect(studentServiceSpy.createStudent).toHaveBeenCalled();
      expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
    });

    it('should not submit when form is invalid', () => {
      component.onSubmit();
      expect(studentServiceSpy.createStudent).not.toHaveBeenCalled();
    });

    it('should handle create error', () => {
      studentServiceSpy.createStudent.and.returnValue(throwError(() => ({ error: { message: 'Failed' } })));
      fillValidForm();
      component.onSubmit();
      expect(notificationSpy.error).toHaveBeenCalled();
      expect(component.isLoading).toBe(false);
    });

    it('should close dialog on cancel', () => {
      component.onCancel();
      expect(dialogRefSpy.close).toHaveBeenCalledWith(false);
    });
  });

  describe('edit mode', () => {
    const mockStudent = {
      id: 's1',
      studentId: 'STU001',
      user: { firstName: 'John', lastName: 'Doe', email: 'john@test.com', phone: '1234567890', address: '123 St' },
      dateOfBirth: '2010-05-15',
      gender: 'male',
      enrollmentDate: '2026-04-01',
      classId: 'c1',
      guardianName: 'Mr. Doe',
      guardianPhone: '9876543210',
      emergencyContact: '5555555555',
      medicalInfo: ''
    };

    beforeEach(() => createComponent(mockStudent));

    it('should be in edit mode', () => {
      expect(component.isEditMode).toBe(true);
    });

    it('should populate form with student data', () => {
      expect(component.studentForm.get('firstName')?.value).toBe('John');
      expect(component.studentForm.get('studentId')?.value).toBe('STU001');
    });

    it('should disable email and password in edit mode', () => {
      expect(component.studentForm.get('email')?.disabled).toBe(true);
      expect(component.studentForm.get('password')?.disabled).toBe(true);
    });

    it('should call updateStudent on submit', () => {
      studentServiceSpy.updateStudent.and.returnValue(of({ success: true, data: {} } as any));
      component.onSubmit();
      expect(studentServiceSpy.updateStudent).toHaveBeenCalledWith('s1', jasmine.any(Object));
    });
  });

  function fillValidForm() {
    component.studentForm.patchValue({
      firstName: 'John', lastName: 'Doe', email: 'john@test.com', password: 'Password1',
      studentId: 'STU001', dateOfBirth: new Date('2010-01-01'), gender: 'male',
      enrollmentDate: new Date(), guardianName: 'Mr. Doe',
      guardianPhone: '9876543210', emergencyContact: '5555555555'
    });
  }
});

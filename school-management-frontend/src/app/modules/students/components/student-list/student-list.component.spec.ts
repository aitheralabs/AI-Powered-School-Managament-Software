import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

import { StudentListComponent } from './student-list.component';
import { StudentService } from '../../../../services/student.service';
import { NotificationService } from '../../../../services/notification.service';
import { ReportExportService } from '../../../../services/report-export.service';

describe('StudentListComponent', () => {
  let component: StudentListComponent;
  let fixture: ComponentFixture<StudentListComponent>;
  let studentServiceSpy: jasmine.SpyObj<StudentService>;
  let notificationSpy: jasmine.SpyObj<NotificationService>;
  let exportSpy: jasmine.SpyObj<ReportExportService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockResponse = {
    success: true,
    data: {
      items: [
        {
          id: '1', studentId: 'STU001',
          user: { firstName: 'John', lastName: 'Doe', email: 'john@test.com' },
          class: { name: 'Grade 5A' }, enrollmentDate: '2026-04-01', isActive: true
        },
        {
          id: '2', studentId: 'STU002',
          user: { firstName: 'Jane', lastName: 'Smith', email: 'jane@test.com' },
          class: null, enrollmentDate: '2026-04-01', isActive: true
        }
      ],
      pagination: { total: 2, page: 1, limit: 10, totalPages: 1, hasNext: false, hasPrev: false }
    }
  };

  beforeEach(async () => {
    studentServiceSpy = jasmine.createSpyObj('StudentService', ['getStudents', 'deleteStudent']);
    notificationSpy = jasmine.createSpyObj('NotificationService', ['success', 'error']);
    exportSpy = jasmine.createSpyObj('ReportExportService', ['exportStudentsCSV']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    studentServiceSpy.getStudents.and.returnValue(of(mockResponse as any));

    await TestBed.configureTestingModule({
      imports: [StudentListComponent, NoopAnimationsModule, HttpClientTestingModule],
      providers: [
        { provide: StudentService, useValue: studentServiceSpy },
        { provide: NotificationService, useValue: notificationSpy },
        { provide: ReportExportService, useValue: exportSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(StudentListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load students on init', () => {
    expect(studentServiceSpy.getStudents).toHaveBeenCalled();
    expect(component.students.length).toBe(2);
    expect(component.totalItems).toBe(2);
  });

  it('should handle error when loading students', () => {
    studentServiceSpy.getStudents.and.returnValue(throwError(() => new Error('fail')));
    component.loadStudents();
    expect(notificationSpy.error).toHaveBeenCalledWith('Failed to load students');
    expect(component.isLoading).toBe(false);
  });

  it('should reset page index on search', () => {
    component.pageIndex = 3;
    component.searchQuery = 'John';
    component.onSearch();
    expect(component.pageIndex).toBe(0);
    expect(studentServiceSpy.getStudents).toHaveBeenCalled();
  });

  it('should update pagination on page change', () => {
    component.onPageChange({ pageIndex: 2, pageSize: 25, length: 100 });
    expect(component.pageIndex).toBe(2);
    expect(component.pageSize).toBe(25);
  });

  it('should get student name', () => {
    const student = mockResponse.data.items[0] as any;
    expect(component.getStudentName(student)).toBe('John Doe');
  });

  it('should get class name or "Not Assigned"', () => {
    expect(component.getClassName(mockResponse.data.items[0] as any)).toBe('Grade 5A');
    expect(component.getClassName(mockResponse.data.items[1] as any)).toBe('Not Assigned');
  });

  it('should get student initials', () => {
    expect(component.getInitials(mockResponse.data.items[0] as any)).toBe('JD');
  });

  it('should navigate to student detail', () => {
    component.viewStudent({ id: '1' } as any);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/students', '1']);
  });

  it('should open create dialog and reload on close', () => {
    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    dialogRefSpy.afterClosed.and.returnValue(of(true));
    // Access the component's injected dialog to spy on it
    const dialog = (component as any).dialog as MatDialog;
    spyOn(dialog, 'open').and.returnValue(dialogRefSpy);

    studentServiceSpy.getStudents.calls.reset();
    component.openCreateDialog();
    expect(dialog.open).toHaveBeenCalled();
    expect(studentServiceSpy.getStudents).toHaveBeenCalled();
  });

  it('should delete student after confirmation', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    studentServiceSpy.deleteStudent.and.returnValue(of({ success: true } as any));
    const student = { id: '1', user: { firstName: 'John', lastName: 'Doe' } } as any;

    component.deleteStudent(student);
    expect(studentServiceSpy.deleteStudent).toHaveBeenCalledWith('1');
    expect(notificationSpy.success).toHaveBeenCalled();
  });

  it('should not delete when user cancels confirmation', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    component.deleteStudent({ id: '1', user: { firstName: 'J', lastName: 'D' } } as any);
    expect(studentServiceSpy.deleteStudent).not.toHaveBeenCalled();
  });

  it('should export CSV', () => {
    component.searchQuery = 'test';
    component.exportCSV();
    expect(exportSpy.exportStudentsCSV).toHaveBeenCalledWith({ search: 'test' });
  });
});

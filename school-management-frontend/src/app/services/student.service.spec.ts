import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { StudentService } from './student.service';
import { ApiService } from './api.service';

describe('StudentService', () => {
  let service: StudentService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ApiService', [
      'get', 'getPaginated', 'post', 'put', 'delete', 'uploadFile', 'downloadFile'
    ]);

    TestBed.configureTestingModule({
      providers: [
        StudentService,
        { provide: ApiService, useValue: spy }
      ]
    });

    service = TestBed.inject(StudentService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getStudents()', () => {
    it('should call getPaginated with students endpoint', () => {
      const mockResponse = { success: true, data: { items: [], pagination: {} } } as any;
      apiServiceSpy.getPaginated.and.returnValue(of(mockResponse));

      service.getStudents({ page: 1, limit: 10 }).subscribe(res => {
        expect(res).toEqual(mockResponse);
      });

      expect(apiServiceSpy.getPaginated).toHaveBeenCalledWith('students', { page: 1, limit: 10 });
    });
  });

  describe('getStudent()', () => {
    it('should call get with student id', () => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: { id: '1' } } as any));

      service.getStudent('1').subscribe();
      expect(apiServiceSpy.get).toHaveBeenCalledWith('students/1');
    });
  });

  describe('createStudent()', () => {
    it('should call post with student data', () => {
      const studentData = { firstName: 'John', lastName: 'Doe', email: 'john@test.com', password: 'pass123' } as any;
      apiServiceSpy.post.and.returnValue(of({ success: true, data: { id: '1', ...studentData } } as any));

      service.createStudent(studentData).subscribe();
      expect(apiServiceSpy.post).toHaveBeenCalledWith('students', studentData);
    });
  });

  describe('updateStudent()', () => {
    it('should call put with student id and data', () => {
      apiServiceSpy.put.and.returnValue(of({ success: true } as any));

      service.updateStudent('1', { firstName: 'Jane' } as any).subscribe();
      expect(apiServiceSpy.put).toHaveBeenCalledWith('students/1', { firstName: 'Jane' });
    });
  });

  describe('deleteStudent()', () => {
    it('should call delete with student id', () => {
      apiServiceSpy.delete.and.returnValue(of({ success: true } as any));

      service.deleteStudent('1').subscribe();
      expect(apiServiceSpy.delete).toHaveBeenCalledWith('students/1');
    });
  });

  describe('getStudentsByClass()', () => {
    it('should call get with class endpoint', () => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: [] } as any));

      service.getStudentsByClass('class-1').subscribe();
      expect(apiServiceSpy.get).toHaveBeenCalledWith('classes/class-1/students');
    });
  });

  describe('enrollStudent()', () => {
    it('should post enroll request', () => {
      apiServiceSpy.post.and.returnValue(of({ success: true } as any));

      service.enrollStudent('student-1', 'class-1').subscribe();
      expect(apiServiceSpy.post).toHaveBeenCalledWith('classes/class-1/enroll', { studentId: 'student-1' });
    });
  });

  describe('transferStudent()', () => {
    it('should post transfer request with correct body', () => {
      apiServiceSpy.post.and.returnValue(of({ success: true } as any));

      service.transferStudent('s1', 'from-class', 'to-class').subscribe();
      expect(apiServiceSpy.post).toHaveBeenCalledWith('classes/transfer', {
        studentId: 's1', fromClassId: 'from-class', toClassId: 'to-class'
      });
    });
  });

  describe('bulkImportStudents()', () => {
    it('should upload CSV file', () => {
      const file = new File([''], 'students.csv');
      apiServiceSpy.uploadFile.and.returnValue(of({ success: true } as any));

      service.bulkImportStudents(file).subscribe();
      expect(apiServiceSpy.uploadFile).toHaveBeenCalledWith('students/import-csv', file);
    });
  });

  describe('downloadStudentTemplate()', () => {
    it('should download CSV template', () => {
      apiServiceSpy.downloadFile.and.returnValue(of(new Blob()));

      service.downloadStudentTemplate().subscribe();
      expect(apiServiceSpy.downloadFile).toHaveBeenCalledWith('students/csv-template');
    });
  });

  describe('exportStudents()', () => {
    it('should export as CSV by default', () => {
      apiServiceSpy.downloadFile.and.returnValue(of(new Blob()));

      service.exportStudents().subscribe();
      expect(apiServiceSpy.downloadFile).toHaveBeenCalledWith('students/export?format=csv');
    });

    it('should export as excel when specified', () => {
      apiServiceSpy.downloadFile.and.returnValue(of(new Blob()));

      service.exportStudents('excel').subscribe();
      expect(apiServiceSpy.downloadFile).toHaveBeenCalledWith('students/export?format=excel');
    });
  });

  describe('getStudentStats()', () => {
    it('should call get with stats endpoint', () => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: {} } as any));

      service.getStudentStats().subscribe();
      expect(apiServiceSpy.get).toHaveBeenCalledWith('students/stats');
    });
  });

  describe('getStudentSummary()', () => {
    it('should call get with summary endpoint', () => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: {} } as any));

      service.getStudentSummary('s1').subscribe();
      expect(apiServiceSpy.get).toHaveBeenCalledWith('students/s1/summary');
    });
  });
});

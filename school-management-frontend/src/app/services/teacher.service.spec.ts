import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { TeacherService } from './teacher.service';
import { ApiService } from './api.service';

describe('TeacherService', () => {
  let service: TeacherService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ApiService', [
      'get', 'getPaginated', 'post', 'put', 'delete', 'uploadFile', 'downloadFile'
    ]);

    TestBed.configureTestingModule({
      providers: [
        TeacherService,
        { provide: ApiService, useValue: spy }
      ]
    });

    service = TestBed.inject(TeacherService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('CRUD operations', () => {
    it('should get paginated teachers', () => {
      apiServiceSpy.getPaginated.and.returnValue(of({ success: true, data: { items: [], pagination: {} } } as any));
      service.getTeachers({ page: 1 }).subscribe();
      expect(apiServiceSpy.getPaginated).toHaveBeenCalledWith('teachers', { page: 1 });
    });

    it('should get single teacher', () => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: {} } as any));
      service.getTeacher('t1').subscribe();
      expect(apiServiceSpy.get).toHaveBeenCalledWith('teachers/t1');
    });

    it('should create teacher', () => {
      const data = { firstName: 'Jane', lastName: 'Smith', email: 'jane@test.com', password: 'pass' } as any;
      apiServiceSpy.post.and.returnValue(of({ success: true } as any));
      service.createTeacher(data).subscribe();
      expect(apiServiceSpy.post).toHaveBeenCalledWith('teachers', data);
    });

    it('should update teacher', () => {
      apiServiceSpy.put.and.returnValue(of({ success: true } as any));
      service.updateTeacher('t1', { firstName: 'Updated' } as any).subscribe();
      expect(apiServiceSpy.put).toHaveBeenCalledWith('teachers/t1', { firstName: 'Updated' });
    });

    it('should delete teacher', () => {
      apiServiceSpy.delete.and.returnValue(of({ success: true } as any));
      service.deleteTeacher('t1').subscribe();
      expect(apiServiceSpy.delete).toHaveBeenCalledWith('teachers/t1');
    });
  });

  describe('assignments', () => {
    it('should assign teacher to class', () => {
      apiServiceSpy.post.and.returnValue(of({ success: true } as any));
      service.assignTeacherToClass('t1', 'c1').subscribe();
      expect(apiServiceSpy.post).toHaveBeenCalledWith('teachers/assign-class', { teacherId: 't1', classId: 'c1' });
    });

    it('should assign teacher to subject', () => {
      apiServiceSpy.post.and.returnValue(of({ success: true } as any));
      service.assignTeacherToSubject('t1', 's1').subscribe();
      expect(apiServiceSpy.post).toHaveBeenCalledWith('teachers/assign-subject', { teacherId: 't1', subjectId: 's1' });
    });

    it('should assign teacher to class-subject', () => {
      apiServiceSpy.post.and.returnValue(of({ success: true } as any));
      service.assignTeacherToClassSubject('t1', 'c1', 's1').subscribe();
      expect(apiServiceSpy.post).toHaveBeenCalledWith('teachers/assign-class-subject', {
        teacherId: 't1', classId: 'c1', subjectId: 's1'
      });
    });

    it('should remove teacher from class', () => {
      apiServiceSpy.delete.and.returnValue(of({ success: true } as any));
      service.removeTeacherFromClass('t1', 'c1').subscribe();
      expect(apiServiceSpy.delete).toHaveBeenCalledWith('teachers/classes/c1/teacher');
    });

    it('should remove teacher from subject', () => {
      apiServiceSpy.delete.and.returnValue(of({ success: true } as any));
      service.removeTeacherFromSubject('t1', 's1').subscribe();
      expect(apiServiceSpy.delete).toHaveBeenCalledWith('teachers/t1/subjects/s1');
    });

    it('should check conflicts', () => {
      apiServiceSpy.post.and.returnValue(of({ success: true } as any));
      service.checkConflicts('t1', 'c1', 's1').subscribe();
      expect(apiServiceSpy.post).toHaveBeenCalledWith('teachers/check-conflicts', {
        teacherId: 't1', classId: 'c1', subjectId: 's1'
      });
    });
  });

  describe('bulk operations', () => {
    it('should bulk import teachers', () => {
      const file = new File([''], 'teachers.csv');
      apiServiceSpy.uploadFile.and.returnValue(of({ success: true } as any));
      service.bulkImportTeachers(file).subscribe();
      expect(apiServiceSpy.uploadFile).toHaveBeenCalledWith('teachers/import-csv', file);
    });

    it('should download teacher template', () => {
      apiServiceSpy.downloadFile.and.returnValue(of(new Blob()));
      service.downloadTeacherTemplate().subscribe();
      expect(apiServiceSpy.downloadFile).toHaveBeenCalledWith('teachers/csv-template');
    });

    it('should export teachers', () => {
      apiServiceSpy.downloadFile.and.returnValue(of(new Blob()));
      service.exportTeachers('excel').subscribe();
      expect(apiServiceSpy.downloadFile).toHaveBeenCalledWith('teachers/export?format=excel');
    });
  });

  describe('stats and workload', () => {
    it('should get teacher stats', () => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: {} } as any));
      service.getTeacherStats().subscribe();
      expect(apiServiceSpy.get).toHaveBeenCalledWith('teachers/stats');
    });

    it('should get teacher workload', () => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: {} } as any));
      service.getTeacherWorkload('t1').subscribe();
      expect(apiServiceSpy.get).toHaveBeenCalledWith('teachers/t1/workload');
    });

    it('should get optimal suggestions', () => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: {} } as any));
      service.getOptimalSuggestions('c1', 's1').subscribe();
      expect(apiServiceSpy.get).toHaveBeenCalledWith('teachers/suggestions/c1/s1');
    });
  });
});

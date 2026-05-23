import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ClassService } from './class.service';
import { ApiService } from './api.service';

describe('ClassService', () => {
  let service: ClassService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ApiService', [
      'get', 'getPaginated', 'post', 'put', 'delete'
    ]);

    TestBed.configureTestingModule({
      providers: [
        ClassService,
        { provide: ApiService, useValue: spy }
      ]
    });

    service = TestBed.inject(ClassService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('CRUD operations', () => {
    it('should get paginated classes', () => {
      apiServiceSpy.getPaginated.and.returnValue(of({ success: true, data: { items: [] } } as any));
      service.getClasses({ search: 'Grade 5' }).subscribe();
      expect(apiServiceSpy.getPaginated).toHaveBeenCalledWith('classes', { search: 'Grade 5' });
    });

    it('should get single class', () => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: {} } as any));
      service.getClass('c1').subscribe();
      expect(apiServiceSpy.get).toHaveBeenCalledWith('classes/c1');
    });

    it('should create class', () => {
      const data = { name: 'Grade 5A', grade: '5', section: 'A', academicYearId: 'ay1', capacity: 30, isActive: true };
      apiServiceSpy.post.and.returnValue(of({ success: true } as any));
      service.createClass(data).subscribe();
      expect(apiServiceSpy.post).toHaveBeenCalledWith('classes', data);
    });

    it('should update class', () => {
      apiServiceSpy.put.and.returnValue(of({ success: true } as any));
      service.updateClass('c1', { capacity: 35 }).subscribe();
      expect(apiServiceSpy.put).toHaveBeenCalledWith('classes/c1', { capacity: 35 });
    });

    it('should delete class', () => {
      apiServiceSpy.delete.and.returnValue(of({ success: true } as any));
      service.deleteClass('c1').subscribe();
      expect(apiServiceSpy.delete).toHaveBeenCalledWith('classes/c1');
    });
  });

  describe('class students', () => {
    it('should get class students', () => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: [] } as any));
      service.getClassStudents('c1').subscribe();
      expect(apiServiceSpy.get).toHaveBeenCalledWith(jasmine.stringContaining('classes/c1/students'));
    });

    it('should assign student to class', () => {
      apiServiceSpy.post.and.returnValue(of({ success: true } as any));
      service.assignStudentToClass('c1', 's1').subscribe();
      expect(apiServiceSpy.post).toHaveBeenCalledWith('classes/c1/enroll', { studentId: 's1' });
    });

    it('should remove student from class', () => {
      apiServiceSpy.delete.and.returnValue(of({ success: true } as any));
      service.removeStudentFromClass('c1', 's1').subscribe();
      expect(apiServiceSpy.delete).toHaveBeenCalledWith('classes/c1/students/s1');
    });
  });

  describe('stats', () => {
    it('should get class stats', () => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: {} } as any));
      service.getClassStats().subscribe();
      expect(apiServiceSpy.get).toHaveBeenCalledWith('classes/stats');
    });
  });
});

import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AcademicService } from './academic.service';
import { ApiService } from './api.service';

describe('AcademicService', () => {
  let service: AcademicService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ApiService', [
      'get', 'getPaginated', 'post', 'put', 'delete', 'uploadFile', 'downloadFile'
    ]);

    TestBed.configureTestingModule({
      providers: [
        AcademicService,
        { provide: ApiService, useValue: spy }
      ]
    });

    service = TestBed.inject(AcademicService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('academic years', () => {
    it('should get academic years', () => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: [] } as any));
      service.getAcademicYears().subscribe();
      expect(apiServiceSpy.get).toHaveBeenCalledWith('academic-years', undefined);
    });

    it('should get single academic year', () => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: {} } as any));
      service.getAcademicYear('ay1').subscribe();
      expect(apiServiceSpy.get).toHaveBeenCalledWith('academic-years/ay1');
    });

    it('should create academic year', () => {
      const data = { name: '2026-27', startDate: '2026-04-01', endDate: '2027-03-31' } as any;
      apiServiceSpy.post.and.returnValue(of({ success: true } as any));
      service.createAcademicYear(data).subscribe();
      expect(apiServiceSpy.post).toHaveBeenCalledWith('academic-years', data);
    });

    it('should update academic year', () => {
      apiServiceSpy.put.and.returnValue(of({ success: true } as any));
      service.updateAcademicYear('ay1', { name: 'Updated' } as any).subscribe();
      expect(apiServiceSpy.put).toHaveBeenCalledWith('academic-years/ay1', { name: 'Updated' });
    });

    it('should delete academic year', () => {
      apiServiceSpy.delete.and.returnValue(of({ success: true } as any));
      service.deleteAcademicYear('ay1').subscribe();
      expect(apiServiceSpy.delete).toHaveBeenCalledWith('academic-years/ay1');
    });

    it('should set active academic year', () => {
      apiServiceSpy.post.and.returnValue(of({ success: true } as any));
      service.setActiveAcademicYear('ay1').subscribe();
      expect(apiServiceSpy.post).toHaveBeenCalledWith('academic-years/ay1/activate', {});
    });

    it('should get current academic year', () => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: {} } as any));
      service.getCurrentAcademicYear().subscribe();
      expect(apiServiceSpy.get).toHaveBeenCalledWith('academic-years/current');
    });
  });

  describe('semesters', () => {
    it('should get semesters', () => {
      apiServiceSpy.getPaginated.and.returnValue(of({ success: true, data: { items: [] } } as any));
      service.getSemesters({ academicYearId: 'ay1' } as any).subscribe();
      expect(apiServiceSpy.getPaginated).toHaveBeenCalledWith('semesters', jasmine.objectContaining({ academicYearId: 'ay1' }));
    });

    it('should create semester', () => {
      const data = { name: 'Semester 1', academicYearId: 'ay1', startDate: '2026-04-01', endDate: '2026-09-30' } as any;
      apiServiceSpy.post.and.returnValue(of({ success: true } as any));
      service.createSemester(data).subscribe();
      expect(apiServiceSpy.post).toHaveBeenCalledWith('semesters', data);
    });

    it('should set active semester', () => {
      apiServiceSpy.post.and.returnValue(of({ success: true } as any));
      service.setActiveSemester('sem1').subscribe();
      expect(apiServiceSpy.post).toHaveBeenCalledWith('semesters/sem1/activate', {});
    });
  });

  describe('subjects', () => {
    it('should get paginated subjects', () => {
      apiServiceSpy.getPaginated.and.returnValue(of({ success: true, data: { items: [] } } as any));
      service.getSubjects().subscribe();
      expect(apiServiceSpy.getPaginated).toHaveBeenCalledWith('subjects', undefined);
    });

    it('should create subject', () => {
      apiServiceSpy.post.and.returnValue(of({ success: true } as any));
      service.createSubject({ name: 'Math' } as any).subscribe();
      expect(apiServiceSpy.post).toHaveBeenCalledWith('subjects', { name: 'Math' });
    });
  });

  describe('classes', () => {
    it('should get paginated classes', () => {
      apiServiceSpy.getPaginated.and.returnValue(of({ success: true, data: { items: [] } } as any));
      service.getClasses({ grade: '5' } as any).subscribe();
      expect(apiServiceSpy.getPaginated).toHaveBeenCalledWith('classes', jasmine.objectContaining({ grade: '5' }));
    });

    it('should assign subject to class', () => {
      apiServiceSpy.post.and.returnValue(of({ success: true } as any));
      service.assignSubjectToClass('c1', 's1', 't1').subscribe();
      expect(apiServiceSpy.post).toHaveBeenCalledWith('classes/c1/subjects', { subjectId: 's1', teacherId: 't1' });
    });

    it('should remove subject from class', () => {
      apiServiceSpy.delete.and.returnValue(of({ success: true } as any));
      service.removeSubjectFromClass('c1', 's1').subscribe();
      expect(apiServiceSpy.delete).toHaveBeenCalledWith('classes/c1/subjects/s1');
    });
  });

  describe('bulk operations', () => {
    it('should bulk import subjects', () => {
      const file = new File([''], 'subjects.csv');
      apiServiceSpy.uploadFile.and.returnValue(of({ success: true } as any));
      service.bulkImportSubjects(file).subscribe();
      expect(apiServiceSpy.uploadFile).toHaveBeenCalledWith('subjects/bulk-import', file);
    });

    it('should export classes', () => {
      apiServiceSpy.downloadFile.and.returnValue(of(new Blob()));
      service.exportClasses('excel').subscribe();
      expect(apiServiceSpy.downloadFile).toHaveBeenCalledWith('classes/export?format=excel');
    });
  });
});

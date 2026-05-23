import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AttendanceService } from './attendance.service';
import { ApiService } from './api.service';

describe('AttendanceService', () => {
  let service: AttendanceService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ApiService', [
      'get', 'getPaginated', 'post', 'put', 'delete', 'downloadFile'
    ]);

    TestBed.configureTestingModule({
      providers: [
        AttendanceService,
        { provide: ApiService, useValue: spy }
      ]
    });

    service = TestBed.inject(AttendanceService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('attendance CRUD', () => {
    it('should get paginated attendance', () => {
      apiServiceSpy.getPaginated.and.returnValue(of({ success: true, data: { items: [] } } as any));
      service.getAttendance({ classId: 'c1', date: '2026-05-22' } as any).subscribe();
      expect(apiServiceSpy.getPaginated).toHaveBeenCalledWith('attendance', jasmine.objectContaining({ classId: 'c1', date: '2026-05-22' }));
    });

    it('should mark single attendance', () => {
      const attendance = { studentId: 's1', classId: 'c1', date: '2026-05-22', status: 'present' } as any;
      apiServiceSpy.post.and.returnValue(of({ success: true } as any));
      service.markAttendance(attendance).subscribe();
      expect(apiServiceSpy.post).toHaveBeenCalledWith('attendance', attendance);
    });

    it('should mark bulk attendance', () => {
      const bulk = { classId: 'c1', date: '2026-05-22', records: [] } as any;
      apiServiceSpy.post.and.returnValue(of({ success: true } as any));
      service.markBulkAttendance(bulk).subscribe();
      expect(apiServiceSpy.post).toHaveBeenCalledWith('attendance/bulk', bulk);
    });

    it('should update attendance', () => {
      apiServiceSpy.put.and.returnValue(of({ success: true } as any));
      service.updateAttendance('a1', { status: 'absent' } as any).subscribe();
      expect(apiServiceSpy.put).toHaveBeenCalledWith('attendance/a1', { status: 'absent' });
    });

    it('should delete attendance', () => {
      apiServiceSpy.delete.and.returnValue(of({ success: true } as any));
      service.deleteAttendance('a1').subscribe();
      expect(apiServiceSpy.delete).toHaveBeenCalledWith('attendance/a1');
    });
  });

  describe('attendance queries', () => {
    it('should get student attendance', () => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: [] } as any));
      service.getStudentAttendance('s1', { startDate: '2026-01-01' }).subscribe();
      expect(apiServiceSpy.get).toHaveBeenCalledWith('attendance/student/s1', { startDate: '2026-01-01' });
    });

    it('should get class attendance', () => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: [] } as any));
      service.getClassAttendance('c1', { date: '2026-05-22' }).subscribe();
      expect(apiServiceSpy.get).toHaveBeenCalledWith('attendance/class/c1', { date: '2026-05-22' });
    });

    it('should get attendance stats', () => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: {} } as any));
      service.getAttendanceStats({ classId: 'c1' }).subscribe();
      expect(apiServiceSpy.get).toHaveBeenCalledWith('attendance/stats', { classId: 'c1' });
    });
  });

  describe('reports', () => {
    it('should get attendance report', () => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: [] } as any));
      service.getAttendanceReport({ startDate: '2026-01-01', endDate: '2026-05-22' }).subscribe();
      expect(apiServiceSpy.get).toHaveBeenCalledWith('attendance-reports/report', {
        startDate: '2026-01-01', endDate: '2026-05-22'
      });
    });

    it('should export attendance report', () => {
      apiServiceSpy.downloadFile.and.returnValue(of(new Blob()));
      service.exportAttendanceReport({ startDate: '2026-01-01', endDate: '2026-05-22', format: 'csv' }).subscribe();
      expect(apiServiceSpy.downloadFile).toHaveBeenCalledWith(jasmine.stringContaining('attendance-reports/export'));
    });

    it('should get attendance analytics', () => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: {} } as any));
      service.getAttendanceAnalytics({ period: 'monthly' }).subscribe();
      expect(apiServiceSpy.get).toHaveBeenCalledWith('attendance-reports/trends', { period: 'monthly' });
    });
  });
});

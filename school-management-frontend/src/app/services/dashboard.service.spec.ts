import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DashboardService } from './dashboard.service';
import { environment } from '../../environments/environment';

describe('DashboardService', () => {
  let service: DashboardService;
  let httpMock: HttpTestingController;
  const API = `${environment.apiUrl}/dashboard`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DashboardService]
    });
    service = TestBed.inject(DashboardService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get admin dashboard', () => {
    const mockData = { success: true, data: { totalStudents: 100, totalTeachers: 20 } };
    service.getAdminDashboard().subscribe(res => {
      expect(res.data.totalStudents).toBe(100);
    });
    const req = httpMock.expectOne(`${API}/admin`);
    expect(req.request.method).toBe('GET');
    req.flush(mockData);
  });

  it('should get teacher dashboard', () => {
    service.getTeacherDashboard().subscribe();
    const req = httpMock.expectOne(`${API}/teacher`);
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: {} });
  });

  it('should get student dashboard', () => {
    service.getStudentDashboard().subscribe();
    const req = httpMock.expectOne(`${API}/student`);
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: {} });
  });

  it('should get parent dashboard', () => {
    service.getParentDashboard().subscribe();
    const req = httpMock.expectOne(`${API}/parent`);
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: {} });
  });

  it('should get super admin dashboard with custom token', () => {
    service.getSuperAdminDashboard('sa-token-123').subscribe();
    const req = httpMock.expectOne(`${API}/superadmin`);
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe('Bearer sa-token-123');
    req.flush({ success: true, data: {} });
  });
});

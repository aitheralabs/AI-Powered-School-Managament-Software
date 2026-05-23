import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ApiService, PaginationParams } from './api.service';
import { environment } from '../../environments/environment';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;
  const API_URL = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService]
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('get()', () => {
    it('should perform GET request to correct endpoint', () => {
      const mockResponse = { success: true, data: { id: '1', name: 'Test' } };
      service.get('students').subscribe(response => {
        expect(response).toEqual(mockResponse);
      });
      const req = httpMock.expectOne(`${API_URL}/students`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should pass query params filtering out null/undefined', () => {
      service.get('students', { search: 'John', status: null, grade: undefined, active: 'true' }).subscribe();
      const req = httpMock.expectOne(r => r.url === `${API_URL}/students`);
      expect(req.request.params.get('search')).toBe('John');
      expect(req.request.params.get('active')).toBe('true');
      expect(req.request.params.has('status')).toBe(false);
      expect(req.request.params.has('grade')).toBe(false);
      req.flush({});
    });

    it('should work without params', () => {
      service.get('health').subscribe();
      const req = httpMock.expectOne(`${API_URL}/health`);
      expect(req.request.params.keys().length).toBe(0);
      req.flush({});
    });
  });

  describe('getPaginated()', () => {
    it('should send pagination params', () => {
      const params: PaginationParams = { page: 2, limit: 10, search: 'test', sortBy: 'name', sortOrder: 'asc' };
      const mockResponse = {
        success: true,
        data: {
          items: [{ id: '1' }],
          pagination: { page: 2, limit: 10, total: 50, totalPages: 5, hasNext: true, hasPrev: true }
        }
      };

      service.getPaginated('students', params).subscribe(response => {
        expect(response.data.items.length).toBe(1);
        expect(response.data.pagination.total).toBe(50);
      });

      const req = httpMock.expectOne(r => r.url === `${API_URL}/students`);
      expect(req.request.params.get('page')).toBe('2');
      expect(req.request.params.get('limit')).toBe('10');
      expect(req.request.params.get('search')).toBe('test');
      req.flush(mockResponse);
    });
  });

  describe('post()', () => {
    it('should perform POST request with body', () => {
      const body = { firstName: 'John', lastName: 'Doe' };
      const mockResponse = { success: true, data: { id: '1', ...body } };

      service.post('students', body).subscribe(response => {
        expect(response.data).toEqual(jasmine.objectContaining(body));
      });

      const req = httpMock.expectOne(`${API_URL}/students`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(body);
      req.flush(mockResponse);
    });
  });

  describe('put()', () => {
    it('should perform PUT request with body', () => {
      const body = { firstName: 'Jane' };
      service.put('students/1', body).subscribe();

      const req = httpMock.expectOne(`${API_URL}/students/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(body);
      req.flush({ success: true });
    });
  });

  describe('patch()', () => {
    it('should perform PATCH request with body', () => {
      const body = { isActive: false };
      service.patch('students/1', body).subscribe();

      const req = httpMock.expectOne(`${API_URL}/students/1`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(body);
      req.flush({ success: true });
    });
  });

  describe('delete()', () => {
    it('should perform DELETE request', () => {
      service.delete('students/1').subscribe();

      const req = httpMock.expectOne(`${API_URL}/students/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true });
    });
  });

  describe('uploadFile()', () => {
    it('should upload file as FormData', () => {
      const file = new File(['content'], 'students.csv', { type: 'text/csv' });
      service.uploadFile('students/import-csv', file).subscribe();

      const req = httpMock.expectOne(`${API_URL}/students/import-csv`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body instanceof FormData).toBe(true);
      req.flush({ success: true });
    });

    it('should append additional data to FormData', () => {
      const file = new File(['content'], 'data.csv', { type: 'text/csv' });
      service.uploadFile('import', file, { classId: '123' }).subscribe();

      const req = httpMock.expectOne(`${API_URL}/import`);
      const formData = req.request.body as FormData;
      expect(formData.get('classId')).toBe('123');
      req.flush({ success: true });
    });
  });

  describe('downloadFile()', () => {
    it('should download file as Blob', () => {
      const mockBlob = new Blob(['csv,data'], { type: 'text/csv' });
      service.downloadFile('students/export').subscribe(blob => {
        expect(blob.size).toBeGreaterThan(0);
      });

      const req = httpMock.expectOne(`${API_URL}/students/export`);
      expect(req.request.responseType).toBe('blob');
      req.flush(mockBlob);
    });
  });
});

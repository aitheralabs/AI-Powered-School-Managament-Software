import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { loadingInterceptor } from './loading.interceptor';
import { LoadingService } from '../services/loading.service';

describe('loadingInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let loadingService: LoadingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([loadingInterceptor])),
        provideHttpClientTesting(),
        LoadingService
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    loadingService = TestBed.inject(LoadingService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should show loading when request starts', () => {
    spyOn(loadingService, 'show');
    httpClient.get('/api/test').subscribe();
    expect(loadingService.show).toHaveBeenCalled();
    httpMock.expectOne('/api/test').flush({});
  });

  it('should hide loading when request completes', () => {
    spyOn(loadingService, 'hide');
    httpClient.get('/api/test').subscribe();
    const req = httpMock.expectOne('/api/test');
    req.flush({});
    expect(loadingService.hide).toHaveBeenCalled();
  });

  it('should hide loading on error', () => {
    spyOn(loadingService, 'hide');
    httpClient.get('/api/test').subscribe({ error: () => {} });
    const req = httpMock.expectOne('/api/test');
    req.error(new ProgressEvent('error'));
    expect(loadingService.hide).toHaveBeenCalled();
  });
});

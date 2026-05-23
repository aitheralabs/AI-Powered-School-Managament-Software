import { TestBed } from '@angular/core/testing';
import { LoadingService } from './loading.service';

describe('LoadingService', () => {
  let service: LoadingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LoadingService]
    });
    service = TestBed.inject(LoadingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initially be not loading', (done) => {
    service.loading$.subscribe(loading => {
      expect(loading).toBe(false);
      done();
    });
  });

  it('should show loading on first show()', (done) => {
    service.show();
    service.loading$.subscribe(loading => {
      expect(loading).toBe(true);
      done();
    });
  });

  it('should hide loading when all requests complete', () => {
    const values: boolean[] = [];
    service.loading$.subscribe(v => values.push(v));

    service.show();
    service.show();
    service.hide(); // one request still pending
    expect(values[values.length - 1]).toBe(true);

    service.hide(); // all done
    expect(values[values.length - 1]).toBe(false);
  });

  it('should not go below zero request count', () => {
    const values: boolean[] = [];
    service.loading$.subscribe(v => values.push(v));

    service.hide();
    service.hide();
    expect(values[values.length - 1]).toBe(false);

    service.show();
    expect(values[values.length - 1]).toBe(true);

    service.hide();
    expect(values[values.length - 1]).toBe(false);
  });

  it('should forceHide() reset everything', () => {
    const values: boolean[] = [];
    service.loading$.subscribe(v => values.push(v));

    service.show();
    service.show();
    service.show();
    service.forceHide();
    expect(values[values.length - 1]).toBe(false);

    // After forceHide, a single show should work normally
    service.show();
    expect(values[values.length - 1]).toBe(true);
    service.hide();
    expect(values[values.length - 1]).toBe(false);
  });
});

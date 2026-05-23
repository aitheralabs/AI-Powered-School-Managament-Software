import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { FeeService } from './fee.service';
import { ApiService } from './api.service';

describe('FeeService', () => {
  let service: FeeService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ApiService', [
      'get', 'getPaginated', 'post', 'put', 'delete', 'downloadFile'
    ]);

    TestBed.configureTestingModule({
      providers: [
        FeeService,
        { provide: ApiService, useValue: spy }
      ]
    });

    service = TestBed.inject(FeeService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('fee categories', () => {
    it('should get fee categories', () => {
      apiServiceSpy.getPaginated.and.returnValue(of({ success: true, data: { items: [] } } as any));
      service.getFeeCategories().subscribe();
      expect(apiServiceSpy.getPaginated).toHaveBeenCalledWith('fees/categories', undefined);
    });

    it('should create fee category', () => {
      apiServiceSpy.post.and.returnValue(of({ success: true } as any));
      service.createFeeCategory({ name: 'Tuition' } as any).subscribe();
      expect(apiServiceSpy.post).toHaveBeenCalledWith('fees/categories', { name: 'Tuition' });
    });

    it('should update fee category', () => {
      apiServiceSpy.put.and.returnValue(of({ success: true } as any));
      service.updateFeeCategory('fc1', { name: 'Updated' } as any).subscribe();
      expect(apiServiceSpy.put).toHaveBeenCalledWith('fees/categories/fc1', { name: 'Updated' });
    });

    it('should delete fee category', () => {
      apiServiceSpy.delete.and.returnValue(of({ success: true } as any));
      service.deleteFeeCategory('fc1').subscribe();
      expect(apiServiceSpy.delete).toHaveBeenCalledWith('fees/categories/fc1');
    });
  });

  describe('student fees', () => {
    it('should get student fees', () => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: [] } as any));
      service.getStudentFees('s1').subscribe();
      expect(apiServiceSpy.get).toHaveBeenCalledWith('fees/student/s1');
    });

    it('should assign fee to student', () => {
      const data = { studentId: 's1', feeCategoryId: 'fc1', dueDate: '2026-06-01' };
      apiServiceSpy.post.and.returnValue(of({ success: true } as any));
      service.assignFeeToStudent(data).subscribe();
      expect(apiServiceSpy.post).toHaveBeenCalledWith('fees/assign-students', data);
    });

    it('should assign fee to class', () => {
      const data = { classId: 'c1', feeCategoryId: 'fc1', dueDate: '2026-06-01' };
      apiServiceSpy.post.and.returnValue(of({ success: true } as any));
      service.assignFeeToClass(data).subscribe();
      expect(apiServiceSpy.post).toHaveBeenCalledWith('fees/assign-class', data);
    });
  });

  describe('payments', () => {
    it('should get paginated payments', () => {
      apiServiceSpy.getPaginated.and.returnValue(of({ success: true, data: { items: [] } } as any));
      service.getPayments({ page: 1 }).subscribe();
      expect(apiServiceSpy.getPaginated).toHaveBeenCalledWith('payments', { page: 1 });
    });

    it('should create payment', () => {
      const payment = { studentFeeId: 'sf1', amount: 500, paymentMethod: 'cash' } as any;
      apiServiceSpy.post.and.returnValue(of({ success: true } as any));
      service.createPayment(payment).subscribe();
      expect(apiServiceSpy.post).toHaveBeenCalledWith('payments', payment);
    });

    it('should get payment receipt as blob', () => {
      apiServiceSpy.downloadFile.and.returnValue(of(new Blob()));
      service.getPaymentReceipt('p1').subscribe();
      expect(apiServiceSpy.downloadFile).toHaveBeenCalledWith('payments/p1/receipt');
    });
  });

  describe('reports and stats', () => {
    it('should get fee stats', () => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: {} } as any));
      service.getFeeStats().subscribe();
      expect(apiServiceSpy.get).toHaveBeenCalledWith('fees/stats');
    });

    it('should get fee collection report', () => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: {} } as any));
      service.getFeeCollectionReport({ startDate: '2026-01-01', endDate: '2026-05-22' }).subscribe();
      expect(apiServiceSpy.get).toHaveBeenCalledWith('fee-reports/collection', {
        startDate: '2026-01-01', endDate: '2026-05-22'
      });
    });

    it('should get defaulters report', () => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: {} } as any));
      service.getDefaultersReport({ classId: 'c1', days: 30 }).subscribe();
      expect(apiServiceSpy.get).toHaveBeenCalledWith('fee-reports/defaulters', { classId: 'c1', days: 30 });
    });

    it('should send fee reminder', () => {
      apiServiceSpy.post.and.returnValue(of({ success: true } as any));
      service.sendFeeReminder(['s1', 's2'], 'Pay your fees').subscribe();
      expect(apiServiceSpy.post).toHaveBeenCalledWith('fees/send-reminder', {
        studentIds: ['s1', 's2'], message: 'Pay your fees'
      });
    });
  });
});

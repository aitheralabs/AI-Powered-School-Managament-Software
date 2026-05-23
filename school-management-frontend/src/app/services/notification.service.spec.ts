import { TestBed } from '@angular/core/testing';
import { NotificationService } from './notification.service';
import { ToastrService } from 'ngx-toastr';

describe('NotificationService', () => {
  let service: NotificationService;
  let toastrSpy: jasmine.SpyObj<ToastrService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ToastrService', ['success', 'error', 'warning', 'info', 'clear']);

    TestBed.configureTestingModule({
      providers: [
        NotificationService,
        { provide: ToastrService, useValue: spy }
      ]
    });

    service = TestBed.inject(NotificationService);
    toastrSpy = TestBed.inject(ToastrService) as jasmine.SpyObj<ToastrService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call toastr.success with message and custom title', () => {
    service.success('Record saved', 'Done');
    expect(toastrSpy.success).toHaveBeenCalledWith('Record saved', 'Done');
  });

  it('should use default title "Success" when no title provided', () => {
    service.success('Saved');
    expect(toastrSpy.success).toHaveBeenCalledWith('Saved', 'Success');
  });

  it('should call toastr.error with message and custom title', () => {
    service.error('Something went wrong', 'Oops');
    expect(toastrSpy.error).toHaveBeenCalledWith('Something went wrong', 'Oops');
  });

  it('should use default title "Error" when no title provided', () => {
    service.error('Failed');
    expect(toastrSpy.error).toHaveBeenCalledWith('Failed', 'Error');
  });

  it('should call toastr.warning', () => {
    service.warning('Be careful', 'Heads up');
    expect(toastrSpy.warning).toHaveBeenCalledWith('Be careful', 'Heads up');
  });

  it('should call toastr.info', () => {
    service.info('FYI');
    expect(toastrSpy.info).toHaveBeenCalledWith('FYI', 'Info');
  });

  it('should call toastr.clear', () => {
    service.clear();
    expect(toastrSpy.clear).toHaveBeenCalled();
  });
});

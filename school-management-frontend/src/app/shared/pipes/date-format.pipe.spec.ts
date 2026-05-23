import { DateFormatPipe } from './date-format.pipe';

describe('DateFormatPipe', () => {
  let pipe: DateFormatPipe;

  beforeEach(() => {
    pipe = new DateFormatPipe();
  });

  it('should create', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return null for null/undefined input', () => {
    expect(pipe.transform(null)).toBeNull();
    expect(pipe.transform(undefined)).toBeNull();
    expect(pipe.transform('')).toBeNull();
  });

  it('should format date with default mediumDate format', () => {
    const result = pipe.transform('2026-05-22');
    expect(result).toBeTruthy();
    expect(result).toContain('2026');
  });

  it('should format date with custom format', () => {
    const result = pipe.transform('2026-05-22', 'yyyy-MM-dd');
    expect(result).toBe('2026-05-22');
  });

  it('should format date with shortDate format', () => {
    const result = pipe.transform('2026-01-15', 'shortDate');
    expect(result).toBeTruthy();
  });

  it('should handle Date object input', () => {
    const result = pipe.transform(new Date(2026, 0, 15), 'yyyy-MM-dd');
    expect(result).toBe('2026-01-15');
  });
});

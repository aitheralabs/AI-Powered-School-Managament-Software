import { TruncatePipe } from './truncate.pipe';

describe('TruncatePipe', () => {
  let pipe: TruncatePipe;

  beforeEach(() => {
    pipe = new TruncatePipe();
  });

  it('should create', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return empty string for falsy input', () => {
    expect(pipe.transform('')).toBe('');
    expect(pipe.transform(null as any)).toBe('');
    expect(pipe.transform(undefined as any)).toBe('');
  });

  it('should not truncate text shorter than limit', () => {
    expect(pipe.transform('Hello', 50)).toBe('Hello');
  });

  it('should not truncate text equal to limit', () => {
    expect(pipe.transform('12345', 5)).toBe('12345');
  });

  it('should truncate text longer than limit with default ellipsis', () => {
    expect(pipe.transform('Hello World', 5)).toBe('Hello...');
  });

  it('should use default limit of 50', () => {
    const longText = 'A'.repeat(60);
    const result = pipe.transform(longText);
    expect(result).toBe('A'.repeat(50) + '...');
  });

  it('should use custom ellipsis', () => {
    expect(pipe.transform('Hello World', 5, ' [more]')).toBe('Hello [more]');
  });
});

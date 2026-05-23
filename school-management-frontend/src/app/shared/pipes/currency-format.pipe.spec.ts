import { CurrencyFormatPipe } from './currency-format.pipe';

describe('CurrencyFormatPipe', () => {
  let pipe: CurrencyFormatPipe;

  beforeEach(() => {
    pipe = new CurrencyFormatPipe();
  });

  it('should create', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return null for null input', () => {
    expect(pipe.transform(null)).toBeNull();
  });

  it('should return null for undefined input', () => {
    expect(pipe.transform(undefined)).toBeNull();
  });

  it('should format number as USD by default', () => {
    const result = pipe.transform(1234.56);
    expect(result).toBeTruthy();
    expect(result).toContain('1,234.56');
  });

  it('should format with custom currency code', () => {
    const result = pipe.transform(100, 'EUR');
    expect(result).toBeTruthy();
  });

  it('should handle zero value', () => {
    const result = pipe.transform(0);
    expect(result).toBeTruthy();
    expect(result).toContain('0');
  });

  it('should handle negative values', () => {
    const result = pipe.transform(-50);
    expect(result).toBeTruthy();
  });
});

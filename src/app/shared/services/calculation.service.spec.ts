import { TestBed } from '@angular/core/testing';
import { CalculationService } from './calculation.service';

describe('CalculationService', () => {
  let service: CalculationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CalculationService]
    });
    service = TestBed.inject(CalculationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('round', () => {
    it('should round to specified decimal places', () => {
      expect(service.round(1.2345, 2)).toBe(1.23);
      expect(service.round(1.2367, 2)).toBe(1.24);
      expect(service.round(1.235, 2)).toBe(1.24);
    });

    it('should handle 0 decimal places', () => {
      expect(service.round(1.567, 0)).toBe(2);
      expect(service.round(1.234, 0)).toBe(1);
    });

    it('should handle negative numbers', () => {
      expect(service.round(-1.567, 2)).toBe(-1.57);
      expect(service.round(-1.234, 1)).toBe(-1.2);
    });

    it('should handle very large decimal places', () => {
      expect(service.round(1.123456789, 5)).toBe(1.12346);
      expect(service.round(1.123456789, 8)).toBe(1.12345679);
    });

    it('should handle zero', () => {
      expect(service.round(0, 2)).toBe(0);
      expect(service.round(0.001, 2)).toBe(0);
    });
  });

  describe('percentDifference', () => {
    it('should calculate percent difference correctly', () => {
      expect(service.percentDifference(100, 95)).toBe(5);
      expect(service.percentDifference(200, 180)).toBe(10);
    });

    it('should handle decimal values', () => {
      const result = service.percentDifference(1.13, 1.18);
      expect(result).toBeCloseTo(4.24, 2);
    });

    it('should return 0 when values are equal', () => {
      expect(service.percentDifference(100, 100)).toBe(0);
      expect(service.percentDifference(1.5, 1.5)).toBe(0);
    });

    it('should work regardless of which value is larger', () => {
      expect(service.percentDifference(100, 95)).toBe(5);
      expect(service.percentDifference(95, 100)).toBe(5);
    });

    it('should handle zero values', () => {
      expect(service.percentDifference(0, 0)).toBe(0);
      expect(service.percentDifference(100, 0)).toBe(100);
      expect(service.percentDifference(0, 100)).toBe(100);
    });

    it('should handle very small differences', () => {
      const result = service.percentDifference(1.0001, 1.0002);
      expect(result).toBeCloseTo(0.01, 2);
    });
  });

  describe('parseNumeric', () => {
    it('should parse valid numbers', () => {
      expect(service.parseNumeric('123')).toBe(123);
      expect(service.parseNumeric('123.45')).toBe(123.45);
      expect(service.parseNumeric('0.5')).toBe(0.5);
    });

    it('should handle single dot as zero', () => {
      expect(service.parseNumeric('.')).toBe(0);
    });

    it('should handle empty string as zero', () => {
      expect(service.parseNumeric('')).toBe(0);
    });

    it('should handle null/undefined as zero', () => {
      expect(service.parseNumeric(null as any)).toBe(0);
      expect(service.parseNumeric(undefined as any)).toBe(0);
    });

    it('should handle whitespace', () => {
      expect(service.parseNumeric('  123  ')).toBe(123);
      expect(service.parseNumeric(' 45.67 ')).toBe(45.67);
    });

    it('should handle negative numbers', () => {
      expect(service.parseNumeric('-123')).toBe(-123);
      expect(service.parseNumeric('-45.67')).toBe(-45.67);
    });

    it('should handle invalid strings as zero', () => {
      expect(service.parseNumeric('abc')).toBe(0);
      expect(service.parseNumeric('12abc')).toBe(0);
      expect(service.parseNumeric('NaN')).toBe(0);
    });

    it('should handle scientific notation', () => {
      expect(service.parseNumeric('1e3')).toBe(1000);
      expect(service.parseNumeric('1.5e2')).toBe(150);
    });
  });

  describe('extractPipedValue', () => {
    it('should extract value after pipe', () => {
      expect(service.extractPipedValue('Description|123')).toBe(123);
      expect(service.extractPipedValue('Tube A1|0.0045')).toBe(0.0045);
    });

    it('should handle multiple pipes (use first)', () => {
      expect(service.extractPipedValue('A|B|123')).toBe(0); // 'B|123' is not a valid number
      expect(service.extractPipedValue('Description|456|Extra')).toBe(456);
    });

    it('should return 0 when no pipe exists', () => {
      expect(service.extractPipedValue('NoSeparator')).toBe(0);
      expect(service.extractPipedValue('123')).toBe(123);
    });

    it('should handle empty string after pipe', () => {
      expect(service.extractPipedValue('Description|')).toBe(0);
    });

    it('should handle empty input', () => {
      expect(service.extractPipedValue('')).toBe(0);
      expect(service.extractPipedValue(null as any)).toBe(0);
      expect(service.extractPipedValue(undefined as any)).toBe(0);
    });

    it('should handle whitespace', () => {
      expect(service.extractPipedValue('Desc | 123')).toBe(123);
      expect(service.extractPipedValue('Desc|  456  ')).toBe(456);
    });

    it('should handle negative values after pipe', () => {
      expect(service.extractPipedValue('Desc|-123')).toBe(-123);
    });
  });

  describe('average', () => {
    it('should calculate average of numbers', () => {
      expect(service.average([1, 2, 3, 4, 5])).toBe(3);
      expect(service.average([10, 20, 30])).toBe(20);
    });

    it('should handle decimal values', () => {
      const result = service.average([1.1, 1.2, 1.3]);
      expect(result).toBeCloseTo(1.2, 2);
    });

    it('should return 0 for empty array', () => {
      expect(service.average([])).toBe(0);
    });

    it('should handle single value', () => {
      expect(service.average([5])).toBe(5);
    });

    it('should handle negative numbers', () => {
      expect(service.average([-10, 0, 10])).toBe(0);
      expect(service.average([-5, -10, -15])).toBe(-10);
    });

    it('should handle zeros', () => {
      expect(service.average([0, 0, 0])).toBe(0);
      expect(service.average([0, 5, 10])).toBeCloseTo(5, 2);
    });
  });

  describe('standardDeviation', () => {
    it('should calculate standard deviation', () => {
      const result = service.standardDeviation([2, 4, 4, 4, 5, 5, 7, 9]);
      expect(result).toBeCloseTo(2, 0); // SD ≈ 2.138
    });

    it('should return 0 for empty array', () => {
      expect(service.standardDeviation([])).toBe(0);
    });

    it('should return 0 for single value', () => {
      expect(service.standardDeviation([5])).toBe(0);
    });

    it('should return 0 when all values are the same', () => {
      expect(service.standardDeviation([5, 5, 5, 5])).toBe(0);
    });

    it('should handle decimal values', () => {
      const result = service.standardDeviation([1.1, 1.2, 1.3, 1.4]);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(1);
    });

    it('should handle negative numbers', () => {
      const result = service.standardDeviation([-5, -3, -1, 1, 3, 5]);
      expect(result).toBeGreaterThan(0);
    });
  });

  describe('coefficientOfVariation', () => {
    it('should calculate CV as percentage', () => {
      const result = service.coefficientOfVariation([2, 4, 6]);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(100);
    });

    it('should return 0 when standard deviation is 0', () => {
      expect(service.coefficientOfVariation([5, 5, 5])).toBe(0);
    });

    it('should return 0 for empty array', () => {
      expect(service.coefficientOfVariation([])).toBe(0);
    });

    it('should return 0 when average is 0', () => {
      expect(service.coefficientOfVariation([0, 0, 0])).toBe(0);
    });

    it('should handle typical viscosity values', () => {
      const result = service.coefficientOfVariation([1.13, 1.14, 1.15]);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(5); // Should be small for precise measurements
    });
  });

  describe('isInRange', () => {
    it('should return true when value is in range', () => {
      expect(service.isInRange(5, 1, 10)).toBe(true);
      expect(service.isInRange(1, 1, 10)).toBe(true);
      expect(service.isInRange(10, 1, 10)).toBe(true);
    });

    it('should return false when value is out of range', () => {
      expect(service.isInRange(0, 1, 10)).toBe(false);
      expect(service.isInRange(11, 1, 10)).toBe(false);
      expect(service.isInRange(-5, 1, 10)).toBe(false);
    });

    it('should handle decimal ranges', () => {
      expect(service.isInRange(0.5, 0.1, 1.0)).toBe(true);
      expect(service.isInRange(0.05, 0.1, 1.0)).toBe(false);
    });

    it('should handle negative ranges', () => {
      expect(service.isInRange(-5, -10, 0)).toBe(true);
      expect(service.isInRange(-15, -10, 0)).toBe(false);
    });
  });

  describe('validateRequiredValues', () => {
    it('should return true when all values are valid numbers', () => {
      const result = service.validateRequiredValues([1, 2, 3, 4, 5]);
      expect(result).toBe(true);
    });

    it('should return true for array with single valid value', () => {
      const result = service.validateRequiredValues([123]);
      expect(result).toBe(true);
    });

    it('should return false when array contains null', () => {
      const result = service.validateRequiredValues([1, 2, null, 4]);
      expect(result).toBe(false);
    });

    it('should return false when array contains undefined', () => {
      const result = service.validateRequiredValues([1, 2, undefined, 4]);
      expect(result).toBe(false);
    });

    it('should return false when array contains NaN', () => {
      const result = service.validateRequiredValues([1, 2, NaN, 4]);
      expect(result).toBe(false);
    });

    it('should allow zero as valid value', () => {
      const result = service.validateRequiredValues([0, 1, 2]);
      expect(result).toBe(true);
    });

    it('should allow negative numbers as valid values', () => {
      const result = service.validateRequiredValues([-5, -10, -15]);
      expect(result).toBe(true);
    });

    it('should handle empty array as valid', () => {
      const result = service.validateRequiredValues([]);
      expect(result).toBe(true);
    });

    it('should return false when all values are invalid', () => {
      const result = service.validateRequiredValues([null, undefined, NaN]);
      expect(result).toBe(false);
    });

    it('should handle decimal values', () => {
      const result = service.validateRequiredValues([1.5, 2.7, 3.9]);
      expect(result).toBe(true);
    });
  });

  describe('isValidNumber', () => {
    it('should return true for valid numbers', () => {
      expect(service.isValidNumber(123)).toBe(true);
      expect(service.isValidNumber(0)).toBe(true);
      expect(service.isValidNumber(-456)).toBe(true);
      expect(service.isValidNumber(1.23)).toBe(true);
    });

    it('should return false for NaN', () => {
      expect(service.isValidNumber(NaN)).toBe(false);
      expect(service.isValidNumber(Number.NaN)).toBe(false);
    });

    it('should return false for Infinity', () => {
      expect(service.isValidNumber(Infinity)).toBe(false);
      expect(service.isValidNumber(-Infinity)).toBe(false);
    });

    it('should return false for null/undefined', () => {
      expect(service.isValidNumber(null as any)).toBe(false);
      expect(service.isValidNumber(undefined as any)).toBe(false);
    });

    it('should return false for strings', () => {
      expect(service.isValidNumber('123' as any)).toBe(false);
      expect(service.isValidNumber('abc' as any)).toBe(false);
    });

    it('should return false for objects', () => {
      expect(service.isValidNumber({} as any)).toBe(false);
      expect(service.isValidNumber([] as any)).toBe(false);
    });

    it('should handle very large numbers', () => {
      expect(service.isValidNumber(Number.MAX_VALUE)).toBe(true);
      expect(service.isValidNumber(Number.MIN_VALUE)).toBe(true);
    });
  });
});

import { TestBed } from '@angular/core/testing';
import { ViscosityCalculationService } from './viscosity-calculation.service';
import { CalculationService } from './calculation.service';

describe('ViscosityCalculationService', () => {
  let service: ViscosityCalculationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ViscosityCalculationService, CalculationService]
    });
    service = TestBed.inject(ViscosityCalculationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('parseTimeFormat', () => {
    describe('MM.SS.HH format (3 dots)', () => {
      it('should parse MM.SS.HH format correctly', () => {
        const result = service.parseTimeFormat('3.45.67');
        expect(result.seconds).toBe(225.67); // (3 * 60) + 45 + (0.01 * 67)
        expect(result.isValid).toBe(true);
        expect(result.originalValue).toBe('3.45.67');
      });

      it('should handle zero minutes', () => {
        const result = service.parseTimeFormat('0.30.50');
        expect(result.seconds).toBe(30.50); // (0 * 60) + 30 + (0.01 * 50)
        expect(result.isValid).toBe(true);
      });

      it('should handle zero seconds', () => {
        const result = service.parseTimeFormat('5.0.25');
        expect(result.seconds).toBe(300.25); // (5 * 60) + 0 + (0.01 * 25)
        expect(result.isValid).toBe(true);
      });

      it('should handle zero hundredths', () => {
        const result = service.parseTimeFormat('4.20.0');
        expect(result.seconds).toBe(260); // (4 * 60) + 20 + 0
        expect(result.isValid).toBe(true);
      });

      it('should handle all zeros', () => {
        const result = service.parseTimeFormat('0.0.0');
        expect(result.seconds).toBe(0);
        expect(result.isValid).toBe(true);
      });

      it('should handle large minutes', () => {
        const result = service.parseTimeFormat('10.15.50');
        expect(result.seconds).toBe(615.50); // (10 * 60) + 15 + (0.01 * 50)
        expect(result.isValid).toBe(true);
      });

      it('should handle seconds over 59', () => {
        // Legacy behavior: doesn't validate seconds < 60
        const result = service.parseTimeFormat('3.75.50');
        expect(result.seconds).toBe(255.50); // (3 * 60) + 75 + (0.01 * 50)
        expect(result.isValid).toBe(true);
      });

      it('should handle hundredths over 99', () => {
        // Legacy behavior: doesn't validate hundredths < 100
        const result = service.parseTimeFormat('3.45.150');
        expect(result.seconds).toBe(226.50); // (3 * 60) + 45 + (0.01 * 150)
        expect(result.isValid).toBe(true);
      });
    });

    describe('Decimal format (1 or 2 dots)', () => {
      it('should parse simple decimal format', () => {
        const result = service.parseTimeFormat('250.25');
        expect(result.seconds).toBe(250.25);
        expect(result.isValid).toBe(true);
      });

      it('should parse integer format', () => {
        const result = service.parseTimeFormat('300');
        expect(result.seconds).toBe(300);
        expect(result.isValid).toBe(true);
      });

      it('should parse decimal without fractional part', () => {
        const result = service.parseTimeFormat('250.');
        expect(result.seconds).toBe(250);
        expect(result.isValid).toBe(true);
      });

      it('should parse decimal starting with dot', () => {
        const result = service.parseTimeFormat('.50');
        expect(result.seconds).toBe(0.50);
        expect(result.isValid).toBe(true);
      });

      it('should handle very small decimals', () => {
        const result = service.parseTimeFormat('0.01');
        expect(result.seconds).toBe(0.01);
        expect(result.isValid).toBe(true);
      });

      it('should handle very large numbers', () => {
        const result = service.parseTimeFormat('9999.99');
        expect(result.seconds).toBe(9999.99);
        expect(result.isValid).toBe(true);
      });
    });

    describe('Edge cases and invalid inputs', () => {
      it('should handle empty string', () => {
        const result = service.parseTimeFormat('');
        expect(result.seconds).toBe(0);
        expect(result.isValid).toBe(true);
        expect(result.originalValue).toBe('');
      });

      it('should handle single dot', () => {
        const result = service.parseTimeFormat('.');
        expect(result.seconds).toBe(0);
        expect(result.isValid).toBe(true);
      });

      it('should handle null', () => {
        const result = service.parseTimeFormat(null as any);
        expect(result.seconds).toBe(0);
        expect(result.isValid).toBe(true);
      });

      it('should handle undefined', () => {
        const result = service.parseTimeFormat(undefined as any);
        expect(result.seconds).toBe(0);
        expect(result.isValid).toBe(true);
      });

      it('should handle whitespace', () => {
        const result = service.parseTimeFormat('  250.25  ');
        expect(result.seconds).toBe(250.25);
        expect(result.isValid).toBe(true);
      });

      it('should handle non-numeric strings gracefully', () => {
        const result = service.parseTimeFormat('abc');
        expect(result.seconds).toBe(0);
        expect(result.isValid).toBe(true);
      });

      it('should handle mixed alphanumeric', () => {
        const result = service.parseTimeFormat('12abc34');
        expect(result.seconds).toBe(0);
        expect(result.isValid).toBe(true);
      });

      it('should handle negative numbers', () => {
        const result = service.parseTimeFormat('-250');
        expect(result.seconds).toBe(0); // Negative times don't make sense
        expect(result.isValid).toBe(true);
      });

      it('should handle four dots', () => {
        const result = service.parseTimeFormat('1.2.3.4');
        // Should parse as 1.2.3 (MM.SS.HH) with leftover .4
        expect(result.isValid).toBe(true);
      });
    });

    describe('Real-world viscosity timing examples', () => {
      it('should parse typical Vis40 time (3-4 minutes)', () => {
        const result = service.parseTimeFormat('3.45.67');
        expect(result.seconds).toBeCloseTo(225.67, 2);
      });

      it('should parse typical Vis100 time (4-5 minutes)', () => {
        const result = service.parseTimeFormat('4.30.25');
        expect(result.seconds).toBeCloseTo(270.25, 2);
      });

      it('should parse minimum required time (>200 seconds)', () => {
        const result = service.parseTimeFormat('3.20.0');
        expect(result.seconds).toBe(200);
        expect(result.seconds).toBeGreaterThan(200);
      });

      it('should parse long test times', () => {
        const result = service.parseTimeFormat('10.0.0');
        expect(result.seconds).toBe(600);
      });
    });
  });

  describe('calculateViscosity', () => {
    it('should calculate viscosity correctly', () => {
      const result = service.calculateViscosity(250, 'Tube A1|0.0045');
      expect(result.result).toBe(1.13); // 250 * 0.0045 = 1.125, rounded to 1.13
      expect(result.stopwatchTime).toBe(250);
      expect(result.calibrationValue).toBe(0.0045);
      expect(result.isValid).toBe(true);
    });

    it('should extract calibration from piped format', () => {
      const result = service.calculateViscosity(300, 'My Tube Description|0.0052');
      expect(result.result).toBe(1.56); // 300 * 0.0052 = 1.56
      expect(result.calibrationValue).toBe(0.0052);
    });

    it('should handle calibration without pipe', () => {
      const result = service.calculateViscosity(250, '0.0045');
      expect(result.result).toBe(1.13);
      expect(result.calibrationValue).toBe(0.0045);
    });

    it('should round result to 2 decimal places', () => {
      const result = service.calculateViscosity(250.123, 0.0045678);
      expect(result.result).toBeCloseTo(1.14, 2);
      // Should have exactly 2 decimal places
      expect(result.result.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(2);
    });

    it('should handle zero stopwatch time', () => {
      const result = service.calculateViscosity(0, 'Tube|0.0045');
      expect(result.result).toBe(0);
      expect(result.isValid).toBe(true);
    });

    it('should handle zero calibration', () => {
      const result = service.calculateViscosity(250, 'Tube|0');
      expect(result.result).toBe(0);
      expect(result.calibrationValue).toBe(0);
    });

    it('should handle empty calibration string', () => {
      const result = service.calculateViscosity(250, '');
      expect(result.result).toBe(0);
      expect(result.isValid).toBe(true);
    });

    it('should handle null calibration', () => {
      const result = service.calculateViscosity(250, null as any);
      expect(result.result).toBe(0);
      expect(result.isValid).toBe(true);
    });

    it('should handle typical Vis40 calculation', () => {
      // Tube A1, calibration 0.0045, time 250 seconds
      const result = service.calculateViscosity(250, 'Tube A1|0.0045');
      expect(result.result).toBe(1.13);
    });

    it('should handle typical Vis100 calculation', () => {
      // Tube B2, calibration 0.0052, time 300 seconds
      const result = service.calculateViscosity(300, 'Tube B2|0.0052');
      expect(result.result).toBe(1.56);
    });

    it('should handle high viscosity values', () => {
      const result = service.calculateViscosity(500, 'Tube C|0.01');
      expect(result.result).toBe(5.00);
    });

    it('should handle low viscosity values', () => {
      const result = service.calculateViscosity(200, 'Tube D|0.001');
      expect(result.result).toBe(0.20);
    });

    it('should handle very small calibration values', () => {
      const result = service.calculateViscosity(250, 'Tube E|0.00001');
      expect(result.result).toBe(0.00);
    });
  });

  describe('checkRepeatability', () => {
    it('should pass repeatability within 0.35% limit', () => {
      const result = service.checkRepeatability([1.13, 1.14], 0.35);
      expect(result.isWithinLimit).toBe(true);
      expect(result.percentDifference).toBeCloseTo(0.88, 2);
      expect(result.limit).toBe(0.35);
      expect(result.warning).toBe('');
    });

    it('should fail repeatability over 0.35% limit', () => {
      const result = service.checkRepeatability([1.13, 1.18], 0.35);
      expect(result.isWithinLimit).toBe(false);
      expect(result.percentDifference).toBeCloseTo(4.24, 2);
      expect(result.warning).toContain('4.24%');
      expect(result.warning).toContain('0.35%');
    });

    it('should handle single value (no comparison)', () => {
      const result = service.checkRepeatability([1.13], 0.35);
      expect(result.isWithinLimit).toBe(true);
      expect(result.percentDifference).toBe(0);
      expect(result.warning).toBe('');
    });

    it('should handle empty array', () => {
      const result = service.checkRepeatability([], 0.35);
      expect(result.isWithinLimit).toBe(true);
      expect(result.percentDifference).toBe(0);
    });

    it('should ignore zero values', () => {
      const result = service.checkRepeatability([1.13, 0, 1.14], 0.35);
      expect(result.isWithinLimit).toBe(true);
      expect(result.percentDifference).toBeCloseTo(0.88, 2);
      // Should only compare 1.13 and 1.14, ignoring the 0
    });

    it('should handle multiple trials', () => {
      const result = service.checkRepeatability([1.13, 1.14, 1.15, 1.14], 0.35);
      expect(result.isWithinLimit).toBe(true);
      // Should compare highest (1.15) and lowest (1.13)
      expect(result.percentDifference).toBeCloseTo(1.74, 2);
    });

    it('should handle exactly at limit', () => {
      // Need to calculate values that result in exactly 0.35%
      const high = 1.00;
      const low = 0.9965; // (1.00 - 0.9965) / 1.00 = 0.0035 = 0.35%
      const result = service.checkRepeatability([high, low], 0.35);
      expect(result.percentDifference).toBeCloseTo(0.35, 2);
      expect(result.isWithinLimit).toBe(true); // Should be <= limit
    });

    it('should handle very close values', () => {
      const result = service.checkRepeatability([1.1234, 1.1235], 0.35);
      expect(result.isWithinLimit).toBe(true);
      expect(result.percentDifference).toBeLessThan(0.01);
    });

    it('should handle large differences', () => {
      const result = service.checkRepeatability([1.0, 2.0], 0.35);
      expect(result.isWithinLimit).toBe(false);
      expect(result.percentDifference).toBe(50);
    });

    it('should use custom limit', () => {
      const result = service.checkRepeatability([1.0, 1.05], 1.0); // 1% limit
      expect(result.isWithinLimit).toBe(false);
      expect(result.percentDifference).toBeCloseTo(4.76, 1);
      expect(result.limit).toBe(1.0);
    });

    it('should handle negative values (invalid for viscosity)', () => {
      const result = service.checkRepeatability([-1.0, 1.0], 0.35);
      // Behavior with negatives should still calculate
      expect(result.percentDifference).toBeGreaterThan(0);
    });
  });

  describe('formatTimeDisplay', () => {
    it('should format seconds to MM.SS.HH', () => {
      expect(service.formatTimeDisplay(225.67)).toBe('3.45.67');
      expect(service.formatTimeDisplay(270.25)).toBe('4.30.25');
    });

    it('should handle zero', () => {
      expect(service.formatTimeDisplay(0)).toBe('0.0.0');
    });

    it('should handle less than one minute', () => {
      expect(service.formatTimeDisplay(45.50)).toBe('0.45.50');
    });

    it('should handle exactly one minute', () => {
      expect(service.formatTimeDisplay(60)).toBe('1.0.0');
    });

    it('should pad seconds and hundredths', () => {
      expect(service.formatTimeDisplay(65.05)).toBe('1.5.5');
    });

    it('should handle large values', () => {
      expect(service.formatTimeDisplay(3661.99)).toBe('61.1.99');
    });

    it('should handle decimal seconds correctly', () => {
      expect(service.formatTimeDisplay(125.75)).toBe('2.5.75');
    });
  });

  describe('validateStopwatchTime', () => {
    it('should validate positive times', () => {
      expect(service.validateStopwatchTime(250)).toBe(true);
      expect(service.validateStopwatchTime(0.01)).toBe(true);
    });

    it('should invalidate zero', () => {
      expect(service.validateStopwatchTime(0)).toBe(false);
    });

    it('should invalidate negative times', () => {
      expect(service.validateStopwatchTime(-100)).toBe(false);
    });

    it('should invalidate NaN', () => {
      expect(service.validateStopwatchTime(NaN)).toBe(false);
    });

    it('should invalidate Infinity', () => {
      expect(service.validateStopwatchTime(Infinity)).toBe(false);
      expect(service.validateStopwatchTime(-Infinity)).toBe(false);
    });

    it('should validate typical viscosity times', () => {
      expect(service.validateStopwatchTime(200)).toBe(true); // Minimum
      expect(service.validateStopwatchTime(300)).toBe(true); // Typical
      expect(service.validateStopwatchTime(600)).toBe(true); // Long test
    });
  });

  describe('getSelectedTrialResults', () => {
    const mockTrials = [
      { selected: true, stopwatchTime: '250', tubeCalibration: 'T1|0.0045', calculatedResult: 1.13 },
      { selected: false, stopwatchTime: '260', tubeCalibration: 'T2|0.0045', calculatedResult: 1.17 },
      { selected: true, stopwatchTime: '255', tubeCalibration: 'T1|0.0045', calculatedResult: 1.15 },
      { selected: false, stopwatchTime: '', tubeCalibration: '', calculatedResult: 0 }
    ];

    it('should return only selected trials', () => {
      const results = service.getSelectedTrialResults(mockTrials);
      expect(results.length).toBe(2);
      expect(results).toEqual([1.13, 1.15]);
    });

    it('should handle no selected trials', () => {
      const trials = mockTrials.map(t => ({ ...t, selected: false }));
      const results = service.getSelectedTrialResults(trials);
      expect(results).toEqual([]);
    });

    it('should handle all selected trials', () => {
      const trials = mockTrials.map(t => ({ ...t, selected: true }));
      const results = service.getSelectedTrialResults(trials);
      expect(results.length).toBe(4);
    });

    it('should handle empty array', () => {
      const results = service.getSelectedTrialResults([]);
      expect(results).toEqual([]);
    });

    it('should include zero results if selected', () => {
      const trials = [
        { selected: true, stopwatchTime: '0', tubeCalibration: '', calculatedResult: 0 },
        { selected: true, stopwatchTime: '250', tubeCalibration: 'T1|0.0045', calculatedResult: 1.13 }
      ];
      const results = service.getSelectedTrialResults(trials);
      expect(results).toEqual([0, 1.13]);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete viscosity calculation workflow', () => {
      // 1. Parse time input
      const timeResult = service.parseTimeFormat('3.45.67');
      expect(timeResult.seconds).toBe(225.67);

      // 2. Calculate viscosity
      const calcResult = service.calculateViscosity(timeResult.seconds, 'Tube A1|0.0045');
      expect(calcResult.result).toBeCloseTo(1.02, 2);

      // 3. Validate time
      expect(service.validateStopwatchTime(timeResult.seconds)).toBe(true);
    });

    it('should handle multiple trial repeatability check', () => {
      const trial1 = service.calculateViscosity(250, 'Tube A1|0.0045');
      const trial2 = service.calculateViscosity(252, 'Tube A1|0.0045');
      const trial3 = service.calculateViscosity(251, 'Tube A1|0.0045');

      const repeatability = service.checkRepeatability(
        [trial1.result, trial2.result, trial3.result],
        0.35
      );

      expect(repeatability.isWithinLimit).toBe(true);
    });

    it('should handle failed repeatability scenario', () => {
      const trial1 = service.calculateViscosity(250, 'Tube A1|0.0045');
      const trial2 = service.calculateViscosity(300, 'Tube A1|0.0045'); // Very different

      const repeatability = service.checkRepeatability(
        [trial1.result, trial2.result],
        0.35
      );

      expect(repeatability.isWithinLimit).toBe(false);
      expect(repeatability.warning).toBeTruthy();
    });
  });
});

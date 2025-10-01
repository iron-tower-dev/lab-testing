import { TestBed } from '@angular/core/testing';
import { GreaseCalculationService } from './grease-calculation.service';
import { CalculationService } from './calculation.service';

describe('GreaseCalculationService', () => {
  let service: GreaseCalculationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GreaseCalculationService, CalculationService]
    });
    service = TestBed.inject(GreaseCalculationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('calculatePenetration', () => {
    it('should calculate average penetration correctly', () => {
      const result = service.calculatePenetration([265, 270, 268]);
      expect(result.result).toBe(268); // (265 + 270 + 268) / 3 = 267.67 → 268
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.metadata?.nlgiGrade).toBe('2');
    });

    it('should determine NLGI grade 2 correctly', () => {
      const result = service.calculatePenetration([265, 270, 268]);
      expect(result.metadata?.nlgiGrade).toBe('2');
    });

    it('should determine NLGI grade 1 correctly', () => {
      const result = service.calculatePenetration([310, 315, 320]);
      expect(result.metadata?.nlgiGrade).toBe('1');
    });

    it('should determine NLGI grade 3 correctly', () => {
      const result = service.calculatePenetration([220, 225, 230]);
      expect(result.metadata?.nlgiGrade).toBe('3');
    });

    it('should round result to whole number', () => {
      const result = service.calculatePenetration([265.4, 270.8, 268.1]);
      expect(result.result).toBe(268); // Should be integer
      expect(Number.isInteger(result.result)).toBe(true);
    });

    it('should warn about high penetration variation', () => {
      const result = service.calculatePenetration([265, 280, 268]); // 15 unit variation
      expect(result.isValid).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings![0]).toContain('High penetration variation');
      expect(result.warnings![0]).toContain('15');
    });

    it('should not warn about acceptable penetration variation', () => {
      const result = service.calculatePenetration([265, 270, 268]); // 5 unit variation
      expect(result.warnings).toBeUndefined();
    });

    it('should warn about penetration below NLGI 6 range', () => {
      const result = service.calculatePenetration([80, 82, 81]); // Below 85 (NLGI 6 min)
      expect(result.warnings).toBeDefined();
      expect(result.warnings![0]).toContain('below NLGI 6');
    });

    it('should warn about penetration above NLGI 000 range', () => {
      const result = service.calculatePenetration([480, 485, 490]); // Above 475 (NLGI 000 max)
      expect(result.warnings).toBeDefined();
      expect(result.warnings![0]).toContain('above NLGI 000');
    });

    it('should handle single penetration reading', () => {
      const result = service.calculatePenetration([268]);
      expect(result.result).toBe(268);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should recommend three readings for ASTM compliance', () => {
      const result = service.calculatePenetration([265, 270]);
      expect(result.isValid).toBe(true);
      expect(result.errors).toContain('Three penetration readings are recommended for ASTM D217 compliance');
    });

    it('should validate minimum penetration range', () => {
      const result = service.calculatePenetration([30, 35, 40]); // Below 50 min
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('between 50 and 500');
    });

    it('should validate maximum penetration range', () => {
      const result = service.calculatePenetration([510, 520, 530]); // Above 500 max
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('between 50 and 500');
    });

    it('should handle empty array', () => {
      const result = service.calculatePenetration([]);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('At least one penetration reading is required');
    });

    it('should filter invalid numbers', () => {
      const result = service.calculatePenetration([265, NaN, 270, Infinity, 268]);
      expect(result.result).toBe(268); // Average of 265, 270, 268
      expect(result.isValid).toBe(true);
    });

    it('should include metadata about number of readings', () => {
      const result = service.calculatePenetration([265, 270, 268]);
      expect(result.metadata?.numberOfReadings).toBe(3);
    });

    it('should include metadata about penetration variation', () => {
      const result = service.calculatePenetration([265, 275, 268]);
      expect(result.metadata?.penetrationVariation).toBe(10);
    });
  });

  describe('getNLGIGrade', () => {
    it('should return correct NLGI grades for each range', () => {
      expect(service.getNLGIGrade(460)).toBe('000'); // 445-475
      expect(service.getNLGIGrade(415)).toBe('00');  // 400-430
      expect(service.getNLGIGrade(370)).toBe('0');   // 355-385
      expect(service.getNLGIGrade(325)).toBe('1');   // 310-340
      expect(service.getNLGIGrade(280)).toBe('2');   // 265-295
      expect(service.getNLGIGrade(235)).toBe('3');   // 220-250
      expect(service.getNLGIGrade(190)).toBe('4');   // 175-205
      expect(service.getNLGIGrade(145)).toBe('5');   // 130-160
      expect(service.getNLGIGrade(100)).toBe('6');   // 85-115
    });

    it('should handle boundary values', () => {
      expect(service.getNLGIGrade(265)).toBe('2'); // Min of NLGI 2
      expect(service.getNLGIGrade(295)).toBe('2'); // Max of NLGI 2
    });

    it('should return null for values outside NLGI range', () => {
      expect(service.getNLGIGrade(80)).toBeNull();  // Below NLGI 6
      expect(service.getNLGIGrade(500)).toBeNull(); // Above NLGI 000
    });

    it('should handle invalid numbers', () => {
      expect(service.getNLGIGrade(NaN)).toBeNull();
      expect(service.getNLGIGrade(Infinity)).toBeNull();
    });
  });

  describe('calculateDroppingPoint', () => {
    it('should calculate corrected dropping point correctly (ASTM D566)', () => {
      const result = service.calculateDroppingPoint(210, 230);
      // Temp diff = 230 - 210 = 20°C
      // Correction = 20 / 3 = 6.67°C
      // Corrected = 210 + 6.67 = 216.67 → 217°C
      expect(result.result).toBe(217);
      expect(result.isValid).toBe(true);
      expect(result.metadata?.temperatureDifference).toBe(20);
      expect(result.metadata?.correction).toBeCloseTo(6.7, 1);
    });

    it('should round result to whole number', () => {
      const result = service.calculateDroppingPoint(210.5, 230.5);
      expect(Number.isInteger(result.result)).toBe(true);
    });

    it('should handle small temperature differences', () => {
      const result = service.calculateDroppingPoint(200, 206);
      // Temp diff = 6°C
      // Correction = 2°C
      // Corrected = 202°C
      expect(result.result).toBe(202);
      expect(result.warnings).toBeUndefined();
    });

    it('should warn about large temperature differences', () => {
      const result = service.calculateDroppingPoint(150, 220);
      // Temp diff = 70°C (exceeds 50°C limit)
      expect(result.isValid).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings![0]).toContain('Large temperature difference');
      expect(result.warnings![0]).toContain('70');
    });

    it('should warn about unusually low dropping point', () => {
      const result = service.calculateDroppingPoint(80, 100);
      // Corrected = 80 + (20/3) = 86.67 → 87°C
      expect(result.warnings).toBeDefined();
      expect(result.warnings!.some(w => w.includes('unusually low'))).toBe(true);
    });

    it('should warn about unusually high dropping point', () => {
      const result = service.calculateDroppingPoint(300, 320);
      // Corrected = 300 + (20/3) = 306.67 → 307°C
      expect(result.warnings).toBeDefined();
      expect(result.warnings!.some(w => w.includes('unusually high'))).toBe(true);
    });

    it('should validate minimum dropping point temperature', () => {
      const result = service.calculateDroppingPoint(40, 100);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('between 50 and 350');
    });

    it('should validate maximum dropping point temperature', () => {
      const result = service.calculateDroppingPoint(360, 380);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('between 50 and 350');
    });

    it('should validate minimum block temperature', () => {
      const result = service.calculateDroppingPoint(150, 40);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Block temperature must be between 50 and 400');
    });

    it('should validate maximum block temperature', () => {
      const result = service.calculateDroppingPoint(150, 450);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Block temperature must be between 50 and 400');
    });

    it('should require block temp higher than dropping point', () => {
      const result = service.calculateDroppingPoint(230, 210);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Block temperature must be higher than dropping point temperature');
    });

    it('should reject equal temperatures', () => {
      const result = service.calculateDroppingPoint(200, 200);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Block temperature must be higher than dropping point temperature');
    });

    it('should handle invalid dropping point temperature', () => {
      const result = service.calculateDroppingPoint(NaN, 230);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Dropping point temperature is required');
    });

    it('should handle invalid block temperature', () => {
      const result = service.calculateDroppingPoint(210, NaN);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Block temperature is required');
    });

    it('should include metadata about uncorrected dropping point', () => {
      const result = service.calculateDroppingPoint(210, 230);
      expect(result.metadata?.uncorrectedDroppingPoint).toBe(210);
      expect(result.metadata?.blockTemperature).toBe(230);
    });

    it('should handle typical grease dropping points', () => {
      // Low drop point grease (e.g., calcium-based)
      const lowResult = service.calculateDroppingPoint(180, 195);
      expect(lowResult.isValid).toBe(true);
      expect(lowResult.result).toBeGreaterThan(180);

      // Medium drop point grease (e.g., lithium-based)
      const medResult = service.calculateDroppingPoint(200, 218);
      expect(medResult.isValid).toBe(true);
      expect(medResult.result).toBeGreaterThan(200);

      // High drop point grease (e.g., aluminum complex)
      const highResult = service.calculateDroppingPoint(250, 270);
      expect(highResult.isValid).toBe(true);
      expect(highResult.result).toBeGreaterThan(250);
    });
  });

  describe('checkPenetrationRepeatability', () => {
    it('should pass repeatability within 10 units', () => {
      const result = service.checkPenetrationRepeatability([265, 270, 268]);
      expect(result.isRepeatable).toBe(true);
      expect(result.variation).toBe(5); // 270 - 265
      expect(result.limit).toBe(10);
    });

    it('should fail repeatability over 10 units', () => {
      const result = service.checkPenetrationRepeatability([265, 280, 268]);
      expect(result.isRepeatable).toBe(false);
      expect(result.variation).toBe(15); // 280 - 265
      expect(result.limit).toBe(10);
    });

    it('should handle exactly at limit', () => {
      const result = service.checkPenetrationRepeatability([260, 270]);
      expect(result.isRepeatable).toBe(true); // <= 10
      expect(result.variation).toBe(10);
    });

    it('should handle single reading', () => {
      const result = service.checkPenetrationRepeatability([268]);
      expect(result.isRepeatable).toBe(false);
      expect(result.variation).toBe(0);
    });

    it('should handle empty array', () => {
      const result = service.checkPenetrationRepeatability([]);
      expect(result.isRepeatable).toBe(false);
      expect(result.variation).toBe(0);
    });

    it('should filter invalid numbers', () => {
      const result = service.checkPenetrationRepeatability([265, NaN, 270, Infinity]);
      expect(result.isRepeatable).toBe(true);
      expect(result.variation).toBe(5);
    });
  });

  describe('getConsistencyDescriptions', () => {
    it('should return all NLGI grade descriptions', () => {
      const descriptions = service.getConsistencyDescriptions();
      expect(descriptions['000']).toBe('Semi-fluid (very soft)');
      expect(descriptions['00']).toBe('Very soft');
      expect(descriptions['0']).toBe('Soft');
      expect(descriptions['1']).toBe('Soft to medium');
      expect(descriptions['2']).toBe('Medium (most common)');
      expect(descriptions['3']).toBe('Medium to firm');
      expect(descriptions['4']).toBe('Firm');
      expect(descriptions['5']).toBe('Very firm');
      expect(descriptions['6']).toBe('Extremely firm (block grease)');
    });

    it('should return object with all 9 NLGI grades', () => {
      const descriptions = service.getConsistencyDescriptions();
      expect(Object.keys(descriptions).length).toBe(9);
    });
  });

  describe('getNLGIGrades', () => {
    it('should return all NLGI grade ranges', () => {
      const grades = service.getNLGIGrades();
      expect(grades.length).toBe(9);
      expect(grades[0]).toEqual({ grade: '000', min: 445, max: 475 });
      expect(grades[8]).toEqual({ grade: '6', min: 85, max: 115 });
    });

    it('should have non-overlapping ranges', () => {
      const grades = service.getNLGIGrades();
      for (let i = 0; i < grades.length - 1; i++) {
        expect(grades[i].min).toBeGreaterThan(grades[i + 1].max);
      }
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete penetration workflow', () => {
      // Calculate penetration
      const result = service.calculatePenetration([265, 270, 268]);
      expect(result.isValid).toBe(true);

      // Get NLGI grade
      const grade = service.getNLGIGrade(result.result);
      expect(grade).toBe('2');

      // Get description
      const descriptions = service.getConsistencyDescriptions();
      expect(descriptions[grade!]).toBe('Medium (most common)');

      // Check repeatability
      const repeatability = service.checkPenetrationRepeatability([265, 270, 268]);
      expect(repeatability.isRepeatable).toBe(true);
    });

    it('should handle complete dropping point workflow', () => {
      // Calculate corrected dropping point
      const result = service.calculateDroppingPoint(210, 230);
      expect(result.isValid).toBe(true);
      expect(result.result).toBe(217);

      // Verify metadata
      expect(result.metadata?.uncorrectedDroppingPoint).toBe(210);
      expect(result.metadata?.temperatureDifference).toBe(20);
      expect(result.metadata?.correction).toBeCloseTo(6.7, 1);
    });

    it('should handle edge case with minimal correction', () => {
      const result = service.calculateDroppingPoint(200, 203);
      // Temp diff = 3°C, Correction = 1°C, Corrected = 201°C
      expect(result.result).toBe(201);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toBeUndefined();
    });

    it('should detect out-of-spec grease', () => {
      // Penetration outside NLGI range
      const penResult = service.calculatePenetration([500, 505, 510]);
      expect(penResult.warnings).toBeDefined();
      expect(penResult.warnings!.some(w => w.includes('above NLGI 000'))).toBe(true);

      // Dropping point unusually high
      const dropResult = service.calculateDroppingPoint(305, 325);
      expect(dropResult.warnings).toBeDefined();
      expect(dropResult.warnings!.some(w => w.includes('unusually high'))).toBe(true);
    });
  });
});

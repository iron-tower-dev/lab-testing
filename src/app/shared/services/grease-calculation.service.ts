import { Injectable } from '@angular/core';
import { CalculationService, CalculationResult } from './calculation.service';

/**
 * Grease Calculation Service
 * 
 * Implements calculations for grease tests:
 * 1. Grease Penetration Worked (ASTM D217, D1403)
 * 2. Grease Dropping Point (ASTM D566, D2265)
 */
@Injectable({
  providedIn: 'root'
})
export class GreaseCalculationService extends CalculationService {
  
  // NLGI Grade Lookup Table
  private readonly NLGI_GRADES = [
    { grade: '000', min: 445, max: 475 },
    { grade: '00', min: 400, max: 430 },
    { grade: '0', min: 355, max: 385 },
    { grade: '1', min: 310, max: 340 },
    { grade: '2', min: 265, max: 295 },
    { grade: '3', min: 220, max: 250 },
    { grade: '4', min: 175, max: 205 },
    { grade: '5', min: 130, max: 160 },
    { grade: '6', min: 85, max: 115 }
  ];
  
  // Validation ranges for Penetration
  private readonly MIN_PENETRATION = 50; // 0.1mm units
  private readonly MAX_PENETRATION = 500; // 0.1mm units
  private readonly MAX_PENETRATION_VARIATION = 10; // 0.1mm units
  
  // Validation ranges for Dropping Point
  private readonly MIN_DROPPING_POINT = 50; // °C
  private readonly MAX_DROPPING_POINT = 350; // °C
  private readonly MIN_BLOCK_TEMP = 50; // °C
  private readonly MAX_BLOCK_TEMP = 400; // °C
  private readonly MAX_TEMP_DIFFERENCE = 50; // °C
  
  /**
   * Calculate grease penetration average and NLGI grade
   * 
   * @param penetrations - Array of penetration readings in 0.1mm units
   * @returns CalculationResult with average penetration and NLGI grade
   */
  calculatePenetration(penetrations: number[]): CalculationResult {
    const errors: string[] = [];
    
    // Validate penetrations
    if (!penetrations || penetrations.length === 0) {
      errors.push('At least one penetration reading is required');
    } else {
      const validPenetrations = penetrations.filter(p => this.isValidNumber(p));
      
      if (validPenetrations.length === 0) {
        errors.push('No valid penetration readings provided');
      } else if (validPenetrations.length < 3) {
        errors.push('Three penetration readings are recommended for ASTM D217 compliance');
      }
      
      // Validate penetration ranges
      validPenetrations.forEach((pen, index) => {
        if (pen < this.MIN_PENETRATION || pen > this.MAX_PENETRATION) {
          errors.push(`Penetration ${index + 1} must be between ${this.MIN_PENETRATION} and ${this.MAX_PENETRATION}`);
        }
      });
    }
    
    // Return early if validation failed
    if (errors.length > 0) {
      return {
        result: 0,
        isValid: false,
        errors
      };
    }
    
    // Filter valid penetrations
    const validPenetrations = penetrations.filter(p => this.isValidNumber(p));
    
    // Calculate average
    const avgPenetration = this.average(validPenetrations);
    const roundedResult = Math.round(avgPenetration); // Penetration is reported as whole number
    
    // Determine NLGI grade
    const nlgiGrade = this.getNLGIGrade(roundedResult);
    
    // Generate warnings
    const warnings: string[] = [];
    
    // Check penetration variation
    if (validPenetrations.length >= 2) {
      const maxPen = Math.max(...validPenetrations);
      const minPen = Math.min(...validPenetrations);
      const variation = maxPen - minPen;
      
      if (variation > this.MAX_PENETRATION_VARIATION) {
        warnings.push(`High penetration variation (${variation} units) - verify test consistency`);
      }
    }
    
    // Check if penetration is outside typical ranges
    if (roundedResult < this.NLGI_GRADES[this.NLGI_GRADES.length - 1].min) {
      warnings.push('Penetration is below NLGI 6 range - verify sample type');
    } else if (roundedResult > this.NLGI_GRADES[0].max) {
      warnings.push('Penetration is above NLGI 000 range - verify sample type');
    }
    
    return {
      result: roundedResult,
      isValid: true,
      errors: [],
      warnings: warnings.length > 0 ? warnings : undefined,
      metadata: {
        numberOfReadings: validPenetrations.length,
        nlgiGrade: nlgiGrade || 'Unknown',
        penetrationVariation: validPenetrations.length >= 2 
          ? Math.round(Math.max(...validPenetrations) - Math.min(...validPenetrations))
          : 0
      }
    };
  }
  
  /**
   * Get NLGI grade for a penetration value
   * 
   * @param penetration - Penetration value in 0.1mm units
   * @returns NLGI grade or null if outside range
   */
  getNLGIGrade(penetration: number): string | null {
    if (!this.isValidNumber(penetration)) {
      return null;
    }
    
    for (const grade of this.NLGI_GRADES) {
      if (penetration >= grade.min && penetration <= grade.max) {
        return grade.grade;
      }
    }
    
    return null; // Outside NLGI range
  }
  
  /**
   * Get all NLGI grade ranges
   */
  getNLGIGrades(): { grade: string; min: number; max: number }[] {
    return this.NLGI_GRADES;
  }
  
  /**
   * Calculate corrected dropping point
   * 
   * @param droppingPointTemp - Observed dropping point temperature in °C
   * @param blockTemp - Heating block temperature in °C
   * @returns CalculationResult with corrected dropping point in °C
   */
  calculateDroppingPoint(
    droppingPointTemp: number,
    blockTemp: number
  ): CalculationResult {
    const errors: string[] = [];
    
    // Validate dropping point temperature
    if (!this.isValidNumber(droppingPointTemp)) {
      errors.push('Dropping point temperature is required');
    } else if (droppingPointTemp < this.MIN_DROPPING_POINT || droppingPointTemp > this.MAX_DROPPING_POINT) {
      errors.push(`Dropping point temperature must be between ${this.MIN_DROPPING_POINT} and ${this.MAX_DROPPING_POINT}°C`);
    }
    
    // Validate block temperature
    if (!this.isValidNumber(blockTemp)) {
      errors.push('Block temperature is required');
    } else if (blockTemp < this.MIN_BLOCK_TEMP || blockTemp > this.MAX_BLOCK_TEMP) {
      errors.push(`Block temperature must be between ${this.MIN_BLOCK_TEMP} and ${this.MAX_BLOCK_TEMP}°C`);
    }
    
    // Return early if validation failed
    if (errors.length > 0) {
      return {
        result: 0,
        isValid: false,
        errors
      };
    }
    
    // Check that block temp is higher than dropping point
    if (blockTemp <= droppingPointTemp) {
      return {
        result: 0,
        isValid: false,
        errors: ['Block temperature must be higher than dropping point temperature']
      };
    }
    
    // Calculate temperature difference
    const tempDifference = blockTemp - droppingPointTemp;
    
    // Calculate correction: (Block Temp - Dropping Point Temp) / 3
    const correction = tempDifference / 3;
    
    // Calculate corrected dropping point
    const correctedDroppingPoint = droppingPointTemp + correction;
    
    // Round to whole number
    const roundedResult = Math.round(correctedDroppingPoint);
    
    // Generate warnings
    const warnings: string[] = [];
    
    if (tempDifference > this.MAX_TEMP_DIFFERENCE) {
      warnings.push(`Large temperature difference (${this.roundTo(tempDifference, 1)}°C) - verify test procedure`);
    }
    
    if (roundedResult < 100) {
      warnings.push('Dropping point is unusually low - verify grease type');
    } else if (roundedResult > 300) {
      warnings.push('Dropping point is unusually high - verify grease type');
    }
    
    return {
      result: roundedResult,
      isValid: true,
      errors: [],
      warnings: warnings.length > 0 ? warnings : undefined,
      metadata: {
        uncorrectedDroppingPoint: droppingPointTemp,
        blockTemperature: blockTemp,
        temperatureDifference: this.roundTo(tempDifference, 1),
        correction: this.roundTo(correction, 1)
      }
    };
  }
  
  /**
   * Check if penetration readings are within repeatability limits
   * ASTM D217: Repeatability = 10 units (0.1mm)
   * 
   * @param penetrations - Array of penetration readings
   * @returns Repeatability check result
   */
  checkPenetrationRepeatability(penetrations: number[]): {
    isRepeatable: boolean;
    variation: number;
    limit: number;
  } {
    const validPenetrations = penetrations.filter(p => this.isValidNumber(p));
    
    if (validPenetrations.length < 2) {
      return {
        isRepeatable: false,
        variation: 0,
        limit: this.MAX_PENETRATION_VARIATION
      };
    }
    
    const maxPen = Math.max(...validPenetrations);
    const minPen = Math.min(...validPenetrations);
    const variation = maxPen - minPen;
    
    return {
      isRepeatable: variation <= this.MAX_PENETRATION_VARIATION,
      variation: Math.round(variation),
      limit: this.MAX_PENETRATION_VARIATION
    };
  }
  
  /**
   * Get grease consistency classifications
   */
  getConsistencyDescriptions(): { [key: string]: string } {
    return {
      '000': 'Semi-fluid (very soft)',
      '00': 'Very soft',
      '0': 'Soft',
      '1': 'Soft to medium',
      '2': 'Medium (most common)',
      '3': 'Medium to firm',
      '4': 'Firm',
      '5': 'Very firm',
      '6': 'Extremely firm (block grease)'
    };
  }
}

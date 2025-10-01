import { Injectable } from '@angular/core';
import { CalculationService, CalculationResult } from './calculation.service';

/**
 * TAN (Total Acid Number) Calculation Service
 * 
 * Implements calculations for TAN by Color Indication test (ASTM D664, D974, IP 139, ISO 6618)
 * 
 * Formula: TAN (mg KOH/g) = (Net Buret Volume × 56.1 × KOH Normality) / Sample Weight
 * 
 * Where:
 * - Net Buret Volume = Final Buret Reading - Initial Buret Reading (mL)
 * - 56.1 = Molecular weight of KOH (g/mol)
 * - KOH Normality = typically 0.1000 N
 * - Sample Weight = typically 1.0 - 5.0 grams
 */
@Injectable({
  providedIn: 'root'
})
export class TANCalculationService extends CalculationService {
  
  // Constants
  private readonly KOH_MOLECULAR_WEIGHT = 56.1; // g/mol
  
  // Validation ranges
  private readonly MIN_SAMPLE_WEIGHT = 0.01; // grams
  private readonly MAX_SAMPLE_WEIGHT = 20.0; // grams
  private readonly MIN_NORMALITY = 0.0001; // N
  private readonly MAX_NORMALITY = 1.0; // N
  private readonly MIN_BURET_READING = 0.0; // mL
  private readonly MAX_BURET_READING = 50.0; // mL
  private readonly MIN_TAN = 0.0; // mg KOH/g
  private readonly MAX_TAN = 50.0; // mg KOH/g (typical max)
  
  /**
   * Calculate TAN (Total Acid Number)
   * 
   * @param finalBuret - Final buret reading in mL
   * @param initialBuret - Initial buret reading in mL
   * @param kohNormality - KOH solution normality
   * @param sampleWeight - Sample weight in grams
   * @returns CalculationResult with TAN value in mg KOH/g
   */
  calculateTAN(
    finalBuret: number,
    initialBuret: number,
    kohNormality: number,
    sampleWeight: number
  ): CalculationResult {
    const errors: string[] = [];
    
    // Validate inputs
    if (!this.isValidNumber(finalBuret)) {
      errors.push('Final buret reading is required');
    } else if (finalBuret < this.MIN_BURET_READING || finalBuret > this.MAX_BURET_READING) {
      errors.push(`Final buret reading must be between ${this.MIN_BURET_READING} and ${this.MAX_BURET_READING} mL`);
    }
    
    if (!this.isValidNumber(initialBuret)) {
      errors.push('Initial buret reading is required');
    } else if (initialBuret < this.MIN_BURET_READING || initialBuret > this.MAX_BURET_READING) {
      errors.push(`Initial buret reading must be between ${this.MIN_BURET_READING} and ${this.MAX_BURET_READING} mL`);
    }
    
    if (!this.isValidNumber(kohNormality)) {
      errors.push('KOH normality is required');
    } else if (kohNormality < this.MIN_NORMALITY || kohNormality > this.MAX_NORMALITY) {
      errors.push(`KOH normality must be between ${this.MIN_NORMALITY} and ${this.MAX_NORMALITY} N`);
    }
    
    if (!this.isValidNumber(sampleWeight)) {
      errors.push('Sample weight is required');
    } else if (sampleWeight <= 0) {
      errors.push('Sample weight must be greater than 0');
    } else if (sampleWeight < this.MIN_SAMPLE_WEIGHT || sampleWeight > this.MAX_SAMPLE_WEIGHT) {
      errors.push(`Sample weight must be between ${this.MIN_SAMPLE_WEIGHT} and ${this.MAX_SAMPLE_WEIGHT} g`);
    }
    
    // Return early if validation failed
    if (errors.length > 0) {
      return {
        result: 0,
        isValid: false,
        errors
      };
    }
    
    // Calculate net buret volume
    const netVolume = finalBuret - initialBuret;
    
    // Check for negative volume
    if (netVolume <= 0) {
      return {
        result: 0,
        isValid: false,
        errors: ['Net buret volume must be positive (final reading should be greater than initial reading)']
      };
    }
    
    // Perform TAN calculation
    // Formula: TAN = (Net Volume × 56.1 × Normality) / Sample Weight
    const tanResult = (netVolume * this.KOH_MOLECULAR_WEIGHT * kohNormality) / sampleWeight;
    
    // Round to 2 decimal places
    const roundedResult = this.roundTo(tanResult, 2);
    
    // Validate result range
    const warnings: string[] = [];
    if (roundedResult < this.MIN_TAN) {
      warnings.push('TAN result is negative or zero - verify inputs');
    } else if (roundedResult > this.MAX_TAN) {
      warnings.push('TAN result is unusually high - verify sample type and calculations');
    }
    
    return {
      result: roundedResult,
      isValid: true,
      errors: [],
      warnings: warnings.length > 0 ? warnings : undefined,
      metadata: {
        netVolume,
        kohMolecularWeight: this.KOH_MOLECULAR_WEIGHT
      }
    };
  }
  
  /**
   * Calculate net buret volume
   * 
   * @param finalBuret - Final buret reading in mL
   * @param initialBuret - Initial buret reading in mL
   * @returns Net volume in mL
   */
  calculateNetVolume(finalBuret: number, initialBuret: number): number {
    if (!this.isValidNumber(finalBuret) || !this.isValidNumber(initialBuret)) {
      return 0;
    }
    return this.roundTo(finalBuret - initialBuret, 2);
  }
  
  /**
   * Validate TAN result range
   * 
   * @param tanValue - TAN value in mg KOH/g
   * @returns Validation result with warnings
   */
  validateTANRange(tanValue: number): { isValid: boolean; warnings: string[] } {
    const warnings: string[] = [];
    
    if (!this.isValidNumber(tanValue)) {
      return { isValid: false, warnings: ['Invalid TAN value'] };
    }
    
    if (tanValue < 0) {
      warnings.push('TAN value is negative - check calculations');
    } else if (tanValue > this.MAX_TAN) {
      warnings.push('TAN value exceeds typical range - verify sample and inputs');
    } else if (tanValue > 10.0) {
      warnings.push('High TAN value - typical oils have TAN < 10 mg KOH/g');
    }
    
    return {
      isValid: tanValue >= 0,
      warnings
    };
  }
  
  /**
   * Check if two TAN trials are within repeatability limits
   * For TAN, typical repeatability is ±0.2 mg KOH/g for values < 2.0
   * and ±10% for values >= 2.0
   * 
   * @param trial1 - First TAN value
   * @param trial2 - Second TAN value
   * @returns Repeatability check result
   */
  checkTANRepeatability(trial1: number, trial2: number): {
    isRepeatable: boolean;
    difference: number;
    percentDifference: number;
    limit: number;
  } {
    if (!this.isValidNumber(trial1) || !this.isValidNumber(trial2)) {
      return {
        isRepeatable: false,
        difference: 0,
        percentDifference: 0,
        limit: 0
      };
    }
    
    const difference = Math.abs(trial1 - trial2);
    const average = (trial1 + trial2) / 2;
    const percentDifference = average > 0 ? (difference / average) * 100 : 0;
    
    let limit: number;
    let isRepeatable: boolean;
    
    // ASTM D664 repeatability criteria
    if (average < 2.0) {
      limit = 0.2; // ±0.2 mg KOH/g
      isRepeatable = difference <= limit;
    } else {
      limit = 10; // ±10%
      isRepeatable = percentDifference <= limit;
    }
    
    return {
      isRepeatable,
      difference: this.roundTo(difference, 3),
      percentDifference: this.roundTo(percentDifference, 2),
      limit
    };
  }
  
  /**
   * Get typical TAN ranges for different oil types
   */
  getTANRanges(): { [key: string]: { min: number; max: number; description: string } } {
    return {
      'fresh': { min: 0.0, max: 0.5, description: 'Fresh/New Oil' },
      'good': { min: 0.5, max: 2.0, description: 'Good Condition' },
      'caution': { min: 2.0, max: 4.0, description: 'Caution - Monitor' },
      'critical': { min: 4.0, max: 10.0, description: 'Critical - Action Required' },
      'severe': { min: 10.0, max: 50.0, description: 'Severe Oxidation' }
    };
  }
}

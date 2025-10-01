import { Injectable } from '@angular/core';

/**
 * Result of a calculation with validation
 */
export interface CalculationResult {
  result: number;
  isValid: boolean;
  errors?: string[];
  warnings?: string[];
  metadata?: { [key: string]: any };
}

/**
 * Calculation Service
 * Phase 3: Test-Specific Calculations
 * 
 * Base service providing common calculation utilities and patterns
 * for all test-specific calculation services to extend.
 */
@Injectable({
  providedIn: 'root'
})
export class CalculationService {

  /**
   * Round a number to specified decimal places
   */
  round(value: number, decimals: number = 2): number {
    const multiplier = Math.pow(10, decimals);
    return Math.round(value * multiplier) / multiplier;
  }

  /**
   * Alias for round() - round a number to specified decimal places
   */
  roundTo(value: number, decimals: number = 2): number {
    return this.round(value, decimals);
  }

  /**
   * Calculate percentage difference between two values
   * Used for repeatability checks
   */
  percentDifference(value1: number, value2: number): number {
    const high = Math.max(value1, value2);
    const low = Math.min(value1, value2);
    
    if (high === 0) {
      return 0;
    }
    
    const percent = ((high - low) / high) * 100;
    return this.round(percent, 2);
  }

  /**
   * Check if a value is within acceptable range
   */
  isInRange(value: number, min: number, max: number): boolean {
    return value >= min && value <= max;
  }

  /**
   * Parse numeric value from string, handling various formats
   */
  parseNumeric(value: string | number | null | undefined): number {
    if (value === null || value === undefined || value === '') {
      return 0;
    }
    
    if (typeof value === 'number') {
      return value;
    }
    
    // Handle '.' as 0.0
    if (value === '.') {
      return 0;
    }
    
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }

  /**
   * Validate that all required values are present
   */
  validateRequiredValues(values: (number | null | undefined)[]): boolean {
    return values.every(v => v !== null && v !== undefined && !isNaN(v as number));
  }

  /**
   * Calculate average of an array of numbers
   */
  average(values: number[]): number {
    if (values.length === 0) {
      return 0;
    }
    
    const sum = values.reduce((acc, val) => acc + val, 0);
    return this.round(sum / values.length, 2);
  }

  /**
   * Calculate standard deviation
   */
  standardDeviation(values: number[]): number {
    if (values.length === 0) {
      return 0;
    }
    
    const avg = this.average(values);
    const squaredDiffs = values.map(v => Math.pow(v - avg, 2));
    const variance = this.average(squaredDiffs);
    
    return this.round(Math.sqrt(variance), 4);
  }

  /**
   * Calculate coefficient of variation (CV) as percentage
   */
  coefficientOfVariation(values: number[]): number {
    const avg = this.average(values);
    
    if (avg === 0) {
      return 0;
    }
    
    const stdDev = this.standardDeviation(values);
    return this.round((stdDev / avg) * 100, 2);
  }

  /**
   * Extract numeric value from string with pipe separator
   * Format: "Description|Value"
   * Used for tube calibration values and similar lookups
   */
  extractPipedValue(input: string): number {
    if (!input) {
      return 0;
    }
    
    const pos = input.indexOf('|');
    if (pos === -1) {
      return this.parseNumeric(input);
    }
    
    const valueStr = input.substring(pos + 1);
    return this.parseNumeric(valueStr);
  }

  /**
   * Format number for display with specified decimals
   */
  formatNumber(value: number, decimals: number = 2): string {
    return value.toFixed(decimals);
  }

  /**
   * Check if value is a valid number (not NaN, not Infinity)
   */
  isValidNumber(value: number): boolean {
    return typeof value === 'number' && 
           !isNaN(value) && 
           isFinite(value);
  }
}

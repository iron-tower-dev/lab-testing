import { Injectable, inject } from '@angular/core';
import { CalculationService } from './calculation.service';

/**
 * Viscosity time format result
 */
export interface ViscosityTimeParseResult {
  seconds: number;
  isValid: boolean;
  originalValue: string;
}

/**
 * Viscosity calculation result
 */
export interface ViscosityCalculationResult {
  result: number;
  stopwatchTime: number;
  calibrationValue: number;
  isValid: boolean;
}

/**
 * Repeatability check result
 */
export interface RepeatabilityResult {
  percentDifference: number;
  isWithinLimit: boolean;
  limit: number;
  warning?: string;
}

/**
 * Viscosity Calculation Service
 * Phase 3: Test-Specific Calculations
 * 
 * Handles viscosity-specific calculations including:
 * - Time format parsing (MM.SS.HH → seconds)
 * - Viscosity result calculation (time × tube constant)
 * - Repeatability checking
 */
@Injectable({
  providedIn: 'root'
})
export class ViscosityCalculationService {
  private calcService = inject(CalculationService);

  /**
   * Parse viscosity time format MM.SS.HH to seconds
   * 
   * VB.NET Logic (lines 734-759):
   * - Format: Minutes.Seconds.Hundredths
   * - First dot separates minutes from seconds
   * - Second dot separates seconds from hundredths
   * - Example: "3.45.67" = (3 * 60) + 45 + (0.01 * 67) = 225.67 seconds
   */
  parseTimeFormat(input: string): ViscosityTimeParseResult {
    const result: ViscosityTimeParseResult = {
      seconds: 0,
      isValid: false,
      originalValue: input
    };

    if (!input || input.trim() === '') {
      return result;
    }

    const entry = input.trim();
    const firstDot = entry.indexOf('.');
    
    // No dots - treat as plain seconds
    if (firstDot === -1) {
      const seconds = this.calcService.parseNumeric(entry);
      result.seconds = seconds;
      result.isValid = this.calcService.isValidNumber(seconds);
      return result;
    }

    // Find second dot
    const afterFirst = entry.substring(firstDot + 1);
    const secondDot = afterFirst.indexOf('.');
    
    // Only one dot - treat as decimal seconds
    if (secondDot === -1) {
      const seconds = this.calcService.parseNumeric(entry);
      result.seconds = seconds;
      result.isValid = this.calcService.isValidNumber(seconds);
      return result;
    }

    // Two dots - parse as MM.SS.HH
    let seconds = 0;
    
    // Parse minutes (before first dot)
    if (firstDot > 0) {
      const minutes = this.calcService.parseNumeric(entry.substring(0, firstDot));
      seconds = minutes * 60;
    }
    
    // Parse seconds (between dots)
    if (secondDot > 0) {
      const secs = this.calcService.parseNumeric(afterFirst.substring(0, secondDot));
      seconds += secs;
    }
    
    // Parse hundredths (after second dot)
    const hundredthsStart = firstDot + secondDot + 2;
    if (hundredthsStart < entry.length) {
      const hundredths = this.calcService.parseNumeric(entry.substring(hundredthsStart));
      seconds += hundredths * 0.01;
    }
    
    // Check for NaN
    if (isNaN(seconds) || seconds.toString() === 'NaN') {
      result.seconds = 0;
      result.isValid = false;
      return result;
    }
    
    result.seconds = this.calcService.round(seconds, 2);
    result.isValid = true;
    return result;
  }

  /**
   * Calculate viscosity result
   * 
   * Formula: Stopwatch Time × Tube Calibration Value
   * 
   * VB.NET Logic (lines 782-799):
   * - Extract calibration value from piped format
   * - Multiply time by calibration
   * - Round to 2 decimal places
   */
  calculateViscosity(
    stopwatchTime: number | string,
    tubeCalibration: number | string
  ): ViscosityCalculationResult {
    const result: ViscosityCalculationResult = {
      result: 0,
      stopwatchTime: 0,
      calibrationValue: 0,
      isValid: false
    };

    // Parse stopwatch time
    let time: number;
    if (typeof stopwatchTime === 'string') {
      const parsed = this.parseTimeFormat(stopwatchTime);
      time = parsed.seconds;
    } else {
      time = this.calcService.parseNumeric(stopwatchTime);
    }
    
    // Handle '.' as 0.0
    if (stopwatchTime === '.') {
      time = 0;
    }

    // Parse calibration value (may be piped format "Description|Value")
    let calibration: number;
    if (typeof tubeCalibration === 'string') {
      calibration = this.calcService.extractPipedValue(tubeCalibration);
    } else {
      calibration = this.calcService.parseNumeric(tubeCalibration);
    }

    result.stopwatchTime = time;
    result.calibrationValue = calibration;

    // Calculate result
    if (time !== 0 && calibration !== 0) {
      const calculated = calibration * time;
      result.result = this.calcService.round(calculated, 2);
      result.isValid = true;
    }

    return result;
  }

  /**
   * Check repeatability between trials
   * 
   * VB.NET Logic (lines 811-832):
   * - Find highest and lowest values
   * - Calculate % difference: ((high - low) / high) × 100
   * - Limit: 0.35%
   * - For Q/QAG users, this is enforced (blocks save)
   * - For TRAIN users, this is a warning only
   */
  checkRepeatability(
    values: number[],
    limit: number = 0.35
  ): RepeatabilityResult {
    const result: RepeatabilityResult = {
      percentDifference: 0,
      isWithinLimit: true,
      limit
    };

    // Need at least 2 values to check repeatability
    if (values.length < 2) {
      return result;
    }

    // Filter out zero values
    const nonZeroValues = values.filter(v => v !== 0);
    
    if (nonZeroValues.length < 2) {
      return result;
    }

    // Calculate percentage difference between highest and lowest
    const high = Math.max(...nonZeroValues);
    const low = Math.min(...nonZeroValues);
    
    if (high === 0) {
      return result;
    }

    const percentDiff = ((high - low) / high) * 100;
    result.percentDifference = this.calcService.round(percentDiff, 2);
    result.isWithinLimit = percentDiff <= limit;

    if (!result.isWithinLimit) {
      result.warning = `Repeatability percent is ${result.percentDifference}% which is above ${limit}%`;
    }

    return result;
  }

  /**
   * Validate viscosity time entry
   * Optional: check if time is within reasonable range
   */
  validateStopwatchTime(seconds: number, minTime: number = 200): boolean {
    // VB.NET had a commented-out check for > 200 seconds
    // We'll make it optional
    if (seconds === 0) {
      return false; // No entry
    }
    
    // Optional: enforce minimum time
    // return seconds > minTime;
    
    return true;
  }

  /**
   * Format seconds back to MM.SS.HH for display
   */
  formatTimeDisplay(seconds: number): string {
    if (seconds === 0) {
      return '0.00';
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const secs = Math.floor(remainingSeconds);
    const hundredths = Math.round((remainingSeconds - secs) * 100);

    if (minutes > 0) {
      return `${minutes}.${secs.toString().padStart(2, '0')}.${hundredths.toString().padStart(2, '0')}`;
    } else if (secs > 0) {
      return `${secs}.${hundredths.toString().padStart(2, '0')}`;
    } else {
      return seconds.toFixed(2);
    }
  }

  /**
   * Get selected trial results for repeatability check
   * Used when user has checkboxes to select which trials to include
   */
  getSelectedTrialResults(
    trials: Array<{ selected: boolean; result: number }>
  ): number[] {
    return trials
      .filter(t => t.selected && t.result !== 0)
      .map(t => t.result);
  }
}

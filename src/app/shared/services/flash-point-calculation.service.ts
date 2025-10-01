import { Injectable } from '@angular/core';
import { CalculationService, CalculationResult } from './calculation.service';

/**
 * Flash Point Calculation Service
 * 
 * Implements calculations for Flash Point test (ASTM D92, D93)
 * 
 * Formula: Corrected Flash Point (°C) = Average Temperature + Pressure Correction
 * 
 * Where:
 * - Average Temperature = (Trial1 + Trial2 + Trial3) / number of trials
 * - Pressure Correction = 0.06 × (760 - Atmospheric Pressure in mmHg)
 * - Standard atmospheric pressure = 760 mmHg
 */
@Injectable({
  providedIn: 'root'
})
export class FlashPointCalculationService extends CalculationService {
  
  // Constants
  private readonly STANDARD_PRESSURE = 760; // mmHg
  private readonly PRESSURE_CORRECTION_FACTOR = 0.06; // °C per mmHg
  
  // Validation ranges
  private readonly MIN_PRESSURE = 600; // mmHg (extreme low)
  private readonly MAX_PRESSURE = 800; // mmHg (extreme high)
  private readonly MIN_TEMPERATURE = 0; // °C
  private readonly MAX_TEMPERATURE = 400; // °C
  private readonly MAX_TRIAL_VARIATION = 5; // °C (warning threshold)
  private readonly MIN_FLASH_POINT = 30; // °C (typical minimum)
  private readonly MAX_FLASH_POINT = 350; // °C (typical maximum)
  
  /**
   * Calculate corrected flash point
   * 
   * @param temperatures - Array of temperature trials in °C
   * @param atmosphericPressure - Atmospheric pressure in mmHg
   * @returns CalculationResult with corrected flash point in °C
   */
  calculateFlashPoint(
    temperatures: number[],
    atmosphericPressure: number
  ): CalculationResult {
    const errors: string[] = [];
    
    // Validate pressure
    if (!this.isValidNumber(atmosphericPressure)) {
      errors.push('Atmospheric pressure is required');
    } else if (atmosphericPressure < this.MIN_PRESSURE || atmosphericPressure > this.MAX_PRESSURE) {
      errors.push(`Atmospheric pressure must be between ${this.MIN_PRESSURE} and ${this.MAX_PRESSURE} mmHg`);
    }
    
    // Validate temperatures
    if (!temperatures || temperatures.length === 0) {
      errors.push('At least one temperature reading is required');
    } else {
      const validTemps = temperatures.filter(t => this.isValidNumber(t));
      
      if (validTemps.length === 0) {
        errors.push('No valid temperature readings provided');
      } else if (validTemps.length < 2) {
        errors.push('At least two temperature readings are recommended for accuracy');
      }
      
      // Validate temperature ranges
      validTemps.forEach((temp, index) => {
        if (temp < this.MIN_TEMPERATURE || temp > this.MAX_TEMPERATURE) {
          errors.push(`Temperature ${index + 1} must be between ${this.MIN_TEMPERATURE} and ${this.MAX_TEMPERATURE}°C`);
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
    
    // Filter valid temperatures
    const validTemps = temperatures.filter(t => this.isValidNumber(t));
    
    // Calculate average temperature
    const avgTemp = this.average(validTemps);
    
    // Calculate pressure correction
    const pressureCorrection = this.calculatePressureCorrection(atmosphericPressure);
    
    // Calculate corrected flash point
    const correctedFlashPoint = avgTemp + pressureCorrection;
    
    // Round to 1 decimal place
    const roundedResult = this.roundTo(correctedFlashPoint, 1);
    
    // Generate warnings
    const warnings: string[] = [];
    
    // Check trial variation
    if (validTemps.length >= 2) {
      const maxTemp = Math.max(...validTemps);
      const minTemp = Math.min(...validTemps);
      const variation = maxTemp - minTemp;
      
      if (variation > this.MAX_TRIAL_VARIATION) {
        warnings.push(`High temperature variation (${this.roundTo(variation, 1)}°C) - verify test consistency`);
      }
    }
    
    // Check pressure deviation
    const pressureDeviation = Math.abs(atmosphericPressure - this.STANDARD_PRESSURE);
    if (pressureDeviation > 50) {
      warnings.push(`Large pressure deviation (${this.roundTo(pressureDeviation, 0)} mmHg from standard) - verify correction`);
    }
    
    // Check result range
    if (roundedResult < this.MIN_FLASH_POINT) {
      warnings.push('Flash point is unusually low - verify sample and procedure');
    } else if (roundedResult > this.MAX_FLASH_POINT) {
      warnings.push('Flash point is unusually high - verify sample type');
    }
    
    return {
      result: roundedResult,
      isValid: true,
      errors: [],
      warnings: warnings.length > 0 ? warnings : undefined,
      metadata: {
        averageTemperature: this.roundTo(avgTemp, 1),
        pressureCorrection: this.roundTo(pressureCorrection, 2),
        numberOfTrials: validTemps.length,
        atmosphericPressure
      }
    };
  }
  
  /**
   * Calculate pressure correction factor
   * 
   * @param atmosphericPressure - Atmospheric pressure in mmHg
   * @returns Pressure correction in °C
   */
  calculatePressureCorrection(atmosphericPressure: number): number {
    if (!this.isValidNumber(atmosphericPressure)) {
      return 0;
    }
    
    // Formula: 0.06 × (760 - Pressure)
    const correction = this.PRESSURE_CORRECTION_FACTOR * (this.STANDARD_PRESSURE - atmosphericPressure);
    return this.roundTo(correction, 2);
  }
  
  /**
   * Calculate average temperature from trials
   * 
   * @param temperatures - Array of temperature readings
   * @returns Average temperature
   */
  calculateAverageTemperature(temperatures: number[]): number {
    const validTemps = temperatures.filter(t => this.isValidNumber(t));
    
    if (validTemps.length === 0) {
      return 0;
    }
    
    return this.roundTo(this.average(validTemps), 1);
  }
  
  /**
   * Calculate temperature variation (max - min)
   * 
   * @param temperatures - Array of temperature readings
   * @returns Temperature variation in °C
   */
  calculateTemperatureVariation(temperatures: number[]): number {
    const validTemps = temperatures.filter(t => this.isValidNumber(t));
    
    if (validTemps.length < 2) {
      return 0;
    }
    
    const maxTemp = Math.max(...validTemps);
    const minTemp = Math.min(...validTemps);
    
    return this.roundTo(maxTemp - minTemp, 1);
  }
  
  /**
   * Check if temperature trials are within acceptable repeatability
   * ASTM D92: Repeatability = 8°C for open cup
   * ASTM D93: Repeatability = 5-6°C for closed cup
   * 
   * @param temperatures - Array of temperature readings
   * @param method - Test method ('open' or 'closed' cup)
   * @returns Repeatability check result
   */
  checkRepeatability(
    temperatures: number[],
    method: 'open' | 'closed' = 'open'
  ): {
    isRepeatable: boolean;
    variation: number;
    limit: number;
  } {
    const validTemps = temperatures.filter(t => this.isValidNumber(t));
    
    if (validTemps.length < 2) {
      return {
        isRepeatable: false,
        variation: 0,
        limit: 0
      };
    }
    
    const variation = this.calculateTemperatureVariation(validTemps);
    
    // ASTM repeatability limits
    const limit = method === 'open' ? 8 : 6; // °C
    
    return {
      isRepeatable: variation <= limit,
      variation,
      limit
    };
  }
  
  /**
   * Get flash point classification ranges
   */
  getFlashPointClassifications(): { [key: string]: { min: number; max: number; description: string; hazard: string } } {
    return {
      'extremely_flammable': {
        min: 0,
        max: 23,
        description: 'Extremely Flammable',
        hazard: 'Category 1'
      },
      'highly_flammable': {
        min: 23,
        max: 60,
        description: 'Highly Flammable',
        hazard: 'Category 2-3'
      },
      'flammable': {
        min: 60,
        max: 93,
        description: 'Flammable',
        hazard: 'Category 4'
      },
      'combustible': {
        min: 93,
        max: 200,
        description: 'Combustible',
        hazard: 'Low Risk'
      },
      'low_hazard': {
        min: 200,
        max: 400,
        description: 'Low Fire Hazard',
        hazard: 'Minimal Risk'
      }
    };
  }
  
  /**
   * Get flash point classification for a given value
   * 
   * @param flashPoint - Flash point value in °C
   * @returns Classification information
   */
  classifyFlashPoint(flashPoint: number): {
    classification: string;
    description: string;
    hazard: string;
  } | null {
    if (!this.isValidNumber(flashPoint)) {
      return null;
    }
    
    const classifications = this.getFlashPointClassifications();
    
    for (const [key, value] of Object.entries(classifications)) {
      if (flashPoint >= value.min && flashPoint < value.max) {
        return {
          classification: key,
          description: value.description,
          hazard: value.hazard
        };
      }
    }
    
    // If above all ranges
    return {
      classification: 'low_hazard',
      description: 'Low Fire Hazard',
      hazard: 'Minimal Risk'
    };
  }
}

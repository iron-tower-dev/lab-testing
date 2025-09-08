import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, ApiResponse } from './api.service';

export interface TestReading {
  sampleId: number;
  testId: number;
  trialNumber: number;
  value1?: number | null;
  value2?: number | null;
  value3?: number | null;
  trialCalc?: number | null;
  id1?: string | null;
  id2?: string | null;
  id3?: string | null;
  trialComplete: boolean;
  status?: string | null;
  schedType?: string | null;
  entryId?: string | null;
  validateId?: string | null;
  entryDate?: Date | null;
  valiDate?: Date | null;
  mainComments?: string | null;
}

export interface TestReadingCreate {
  sampleId: number;
  testId: number;
  trialNumber: number;
  value1?: number | null;
  value2?: number | null;
  value3?: number | null;
  trialCalc?: number | null;
  id1?: string | null;
  id2?: string | null;
  id3?: string | null;
  trialComplete?: boolean;
  status?: string | null;
  schedType?: string | null;
  mainComments?: string | null;
}

export interface TestReadingFilter {
  sampleId?: number;
  testId?: number;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable({
  providedIn: 'root'
})
export class TestReadingsService {
  private readonly apiService = inject(ApiService);

  /**
   * Get all test readings with optional filtering
   */
  getTestReadings(filter?: TestReadingFilter): Observable<ApiResponse<TestReading[]>> {
    const params: Record<string, string> = {};
    
    if (filter?.sampleId) params['sampleId'] = filter.sampleId.toString();
    if (filter?.testId) params['testId'] = filter.testId.toString();
    if (filter?.status) params['status'] = filter.status;
    if (filter?.dateFrom) params['dateFrom'] = filter.dateFrom.toISOString();
    if (filter?.dateTo) params['dateTo'] = filter.dateTo.toISOString();
    if (filter?.sortBy) params['sortBy'] = filter.sortBy;
    if (filter?.sortOrder) params['sortOrder'] = filter.sortOrder;

    return this.apiService.get<TestReading[]>('test-readings', params);
  }

  /**
   * Get a specific test reading
   */
  getTestReading(sampleId: number, testId: number, trialNumber: number): Observable<ApiResponse<TestReading>> {
    return this.apiService.get<TestReading>(`test-readings/${sampleId}/${testId}/${trialNumber}`);
  }

  /**
   * Create a new test reading
   */
  createTestReading(reading: TestReadingCreate): Observable<ApiResponse<TestReading>> {
    return this.apiService.post<TestReading>('test-readings', reading);
  }

  /**
   * Update an existing test reading
   */
  updateTestReading(
    sampleId: number, 
    testId: number, 
    trialNumber: number, 
    reading: Partial<TestReadingCreate>
  ): Observable<ApiResponse<TestReading>> {
    return this.apiService.put<TestReading>(`test-readings/${sampleId}/${testId}/${trialNumber}`, reading);
  }

  /**
   * Delete a test reading
   */
  deleteTestReading(sampleId: number, testId: number, trialNumber: number): Observable<ApiResponse<void>> {
    return this.apiService.delete<void>(`test-readings/${sampleId}/${testId}/${trialNumber}`);
  }

  /**
   * Get test readings for a specific sample
   */
  getReadingsForSample(sampleId: number): Observable<ApiResponse<TestReading[]>> {
    return this.getTestReadings({ sampleId });
  }

  /**
   * Get test readings for a specific test type
   */
  getReadingsForTest(testId: number): Observable<ApiResponse<TestReading[]>> {
    return this.getTestReadings({ testId });
  }

  /**
   * Save multiple test readings (batch operation)
   */
  saveMultipleReadings(readings: TestReadingCreate[]): Observable<ApiResponse<TestReading[]>> {
    return this.apiService.post<TestReading[]>('test-readings/batch', { readings });
  }

  /**
   * Mark test reading as complete
   */
  markComplete(sampleId: number, testId: number, trialNumber: number): Observable<ApiResponse<TestReading>> {
    return this.updateTestReading(sampleId, testId, trialNumber, { trialComplete: true, status: 'S' });
  }

  /**
   * Validate calculation based on test type
   */
  validateCalculation(testId: number, values: Record<string, number>): { isValid: boolean; result?: number; error?: string } {
    switch (testId) {
      case 10: // TAN
        return this.calculateTAN(values);
      case 80: // Flash Point
        return this.calculateFlashPoint(values);
      case 130: // Grease Penetration
        return this.calculateGreasePenetration(values);
      case 140: // Grease Drop Point
        return this.calculateGreaseDropPoint(values);
      case 180: // Filter Residue
        return this.calculateFilterResidue(values);
      default:
        return { isValid: true };
    }
  }

  /**
   * Calculate TAN result: (Final Buret * 5.61) / Sample Weight
   */
  private calculateTAN(values: Record<string, number>): { isValid: boolean; result?: number; error?: string } {
    const { sampleWeight, finalBuret } = values;
    
    if (!sampleWeight || sampleWeight === 0) {
      return { isValid: false, error: 'Sample weight must be greater than 0' };
    }
    
    if (finalBuret === undefined || finalBuret === null) {
      return { isValid: false, error: 'Final buret reading is required' };
    }

    const result = Math.round(((finalBuret * 5.61) / sampleWeight) * 100) / 100;
    return { isValid: true, result: result < 0.01 ? 0.01 : result };
  }

  /**
   * Calculate Flash Point result: Flash Point Temperature + (0.06 * (760 - Barometric Pressure))
   */
  private calculateFlashPoint(values: Record<string, number>): { isValid: boolean; result?: number; error?: string } {
    const { pressure, temperature } = values;
    
    if (pressure === undefined || temperature === undefined) {
      return { isValid: false, error: 'Both pressure and temperature are required' };
    }

    const result = temperature + (0.06 * (760 - pressure));
    return { isValid: true, result: Math.round(result / 2) * 2 }; // Round to nearest even number
  }

  /**
   * Calculate Grease Penetration average and result
   */
  private calculateGreasePenetration(values: Record<string, number>): { isValid: boolean; result?: number; error?: string } {
    const { cone1, cone2, cone3 } = values;
    
    if (cone1 === undefined || cone2 === undefined || cone3 === undefined) {
      return { isValid: false, error: 'All three cone readings are required' };
    }

    const average = Math.round((cone1 + cone2 + cone3) / 3);
    const result = Math.round((average * 3.75) + 24);
    return { isValid: true, result };
  }

  /**
   * Calculate Grease Drop Point result
   */
  private calculateGreaseDropPoint(values: Record<string, number>): { isValid: boolean; result?: number; error?: string } {
    const { droppingPoint, blockTemp } = values;
    
    if (droppingPoint === undefined || blockTemp === undefined) {
      return { isValid: false, error: 'Both dropping point and block temperature are required' };
    }

    const result = droppingPoint + ((blockTemp - droppingPoint) / 3);
    return { isValid: true, result: Math.round(result) };
  }

  /**
   * Calculate Filter Residue result: (100 / Sample Size) * Residue Weight
   */
  private calculateFilterResidue(values: Record<string, number>): { isValid: boolean; result?: number; error?: string } {
    const { sampleSize, residueWeight } = values;
    
    if (!sampleSize || sampleSize === 0) {
      return { isValid: false, error: 'Sample size must be greater than 0' };
    }

    if (residueWeight === undefined) {
      return { isValid: false, error: 'Residue weight is required' };
    }

    if (residueWeight === 0) {
      return { isValid: true, result: 0 };
    }

    const result = (100 / sampleSize) * residueWeight;
    return { isValid: true, result: Math.round(result * 10) / 10 };
  }
}

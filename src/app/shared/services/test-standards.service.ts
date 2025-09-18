import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService, ApiResponse } from './api.service';

export interface TestStandard {
  id: number;
  testId: number;
  standardCode: string;
  standardName: string;
  description?: string;
  isDefault: boolean;
  active: boolean;
  sortOrder: number;
}

export interface CreateTestStandardRequest {
  testId: number;
  standardCode: string;
  standardName: string;
  description?: string;
  isDefault?: boolean;
  active?: boolean;
  sortOrder?: number;
}

export interface UpdateTestStandardRequest extends Partial<CreateTestStandardRequest> {
  id?: never; // Prevent passing ID in update request body
}

@Injectable({
  providedIn: 'root'
})
export class TestStandardsService {
  private readonly apiService = inject(ApiService);

  /**
   * Get all test standards with optional filtering
   */
  getAllStandards(testId?: number): Observable<ApiResponse<TestStandard[]>> {
    const params = testId ? { testId: testId.toString() } : undefined;
    return this.apiService.get<TestStandard[]>('test-standards', params);
  }

  /**
   * Get standards for a specific test
   */
  getStandardsForTest(testId: number): Observable<ApiResponse<TestStandard[]>> {
    return this.apiService.get<TestStandard[]>(`test-standards/${testId}`);
  }

  /**
   * Get standards formatted for dropdown options
   */
  getStandardOptions(testId: number): Observable<{value: string; label: string}[]> {
    return this.getStandardsForTest(testId).pipe(
      map(response => 
        response.success && response.data 
          ? response.data.map(s => ({ 
              value: s.standardCode, 
              label: s.standardName 
            }))
          : []
      ),
      catchError(() => of([]))
    );
  }

  /**
   * Create a new test standard
   */
  createStandard(standard: CreateTestStandardRequest): Observable<ApiResponse<TestStandard>> {
    return this.apiService.post<TestStandard>('test-standards', standard);
  }

  /**
   * Update an existing test standard
   */
  updateStandard(id: number, standard: UpdateTestStandardRequest): Observable<ApiResponse<TestStandard>> {
    return this.apiService.put<TestStandard>(`test-standards/${id}`, standard);
  }

  /**
   * Delete (deactivate) a test standard
   */
  deleteStandard(id: number): Observable<ApiResponse<any>> {
    return this.apiService.delete(`test-standards/${id}`);
  }

  /**
   * Helper method to create common standards for a test
   */
  createCommonStandardsForTest(testId: number, testName: string): Observable<ApiResponse<TestStandard>[]> {
    const commonStandards = this.getCommonStandardsForTestType(testName);
    
    return new Observable(observer => {
      const results: ApiResponse<TestStandard>[] = [];
      let completed = 0;
      
      if (commonStandards.length === 0) {
        observer.next([]);
        observer.complete();
        return;
      }
      
      commonStandards.forEach((standard, index) => {
        this.createStandard({
          testId,
          standardCode: standard.code,
          standardName: standard.name,
          description: standard.description,
          isDefault: index === 0,
          sortOrder: index
        }).subscribe({
          next: (response) => {
            results.push(response);
            completed++;
            if (completed === commonStandards.length) {
              observer.next(results);
              observer.complete();
            }
          },
          error: (error) => {
            console.error(`Failed to create standard ${standard.code}:`, error);
            completed++;
            if (completed === commonStandards.length) {
              observer.next(results);
              observer.complete();
            }
          }
        });
      });
    });
  }

  /**
   * Get common standards based on test type name
   */
  private getCommonStandardsForTestType(testName: string): Array<{code: string; name: string; description?: string}> {
    const testType = testName.toLowerCase();
    
    if (testType.includes('tan')) {
      return [
        { code: 'ASTM-D664', name: 'ASTM D664 - Potentiometric', description: 'Standard test method for acid number of petroleum products by potentiometric titration' },
        { code: 'ASTM-D974', name: 'ASTM D974 - Color Indicator', description: 'Standard test method for acid and base number by color-indicator titration' },
        { code: 'IP-139', name: 'IP 139', description: 'Determination of acid value - Color-indicator titration method' },
        { code: 'ISO-6618', name: 'ISO 6618', description: 'Petroleum products and lubricants - Determination of acid or base number' }
      ];
    }
    
    if (testType.includes('rust')) {
      return [
        { code: 'ASTM-D665A', name: 'ASTM D665A - Method A', description: 'Standard test method for rust-preventing characteristics - Method A (distilled water)' },
        { code: 'ASTM-D665B', name: 'ASTM D665B - Method B', description: 'Standard test method for rust-preventing characteristics - Method B (synthetic seawater)' },
        { code: 'IP-135', name: 'IP 135', description: 'Determination of rust-preventing characteristics' }
      ];
    }
    
    if (testType.includes('viscosity')) {
      return [
        { code: 'ASTM-D445', name: 'ASTM D445', description: 'Standard test method for kinematic viscosity of transparent and opaque liquids' },
        { code: 'ISO-3104', name: 'ISO 3104', description: 'Petroleum products - Transparent and opaque liquids - Determination of kinematic viscosity' }
      ];
    }
    
    if (testType.includes('particle') || testType.includes('pcnt')) {
      return [
        { code: 'ISO-4406', name: 'ISO 4406', description: 'Hydraulic fluid power - Fluids - Method for coding the level of contamination by solid particles' },
        { code: 'NAS-1638', name: 'NAS 1638', description: 'Cleanliness requirements of parts used in hydraulic systems' },
        { code: 'SAE-AS4059', name: 'SAE AS4059', description: 'Aerospace fluid power - Cleanliness classification for hydraulic fluids' }
      ];
    }
    
    // Default standards for unknown test types
    return [
      { code: 'Other', name: 'Other', description: 'Other or custom test standard' }
    ];
  }
}

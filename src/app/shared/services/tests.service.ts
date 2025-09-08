import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService, ApiResponse } from './api.service';
import { TestDefinition, TestReference, TestIdentifierUtils } from '../../enter-results/enter-results.types';

@Injectable({
  providedIn: 'root'
})
export class TestsService {
  private readonly apiService = inject(ApiService);

  /**
   * Get all tests from the database
   */
  getAllTests(): Observable<ApiResponse<TestDefinition[]>> {
    return this.apiService.get<TestDefinition[]>('tests');
  }

  /**
   * Get all test references for component selection
   */
  getAllTestReferences(): Observable<TestReference[]> {
    return this.getAllTests().pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data.map(test => TestIdentifierUtils.toTestReference(test));
        }
        return [];
      })
    );
  }

  /**
   * Get all test options formatted for dropdowns/selects
   */
  getAllTestOptions(): Observable<Array<{ reference: TestReference; label: string }>> {
    return this.getAllTestReferences().pipe(
      map(references => 
        references.map(reference => ({
          reference,
          label: TestIdentifierUtils.getDisplayName(reference)
        }))
      )
    );
  }

  /**
   * Get a specific test by ID
   */
  getTestById(testId: number): Observable<ApiResponse<TestDefinition>> {
    return this.apiService.get<TestDefinition>(`tests/${testId}`);
  }

  /**
   * Get tests by group name
   */
  getTestsByGroup(groupName: string): Observable<TestReference[]> {
    return this.getAllTestReferences().pipe(
      map(references => 
        references.filter(ref => 
          ref.groupName?.toLowerCase().includes(groupName.toLowerCase())
        )
      )
    );
  }
}

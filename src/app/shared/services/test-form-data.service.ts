import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, ApiResponse } from './api.service';

export interface TestFormDataEntry {
  id: number;
  sampleId: number;
  testId: number;
  formData: any; // Parsed JSON form data
  status: 'draft' | 'submitted' | 'validated';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

export interface CreateTestFormDataRequest {
  sampleId: number;
  testId: number;
  formData: any;
  status?: 'draft' | 'submitted' | 'validated';
  createdBy?: string;
}

export interface UpdateTestFormDataRequest {
  formData?: any;
  status?: 'draft' | 'submitted' | 'validated';
}

@Injectable({
  providedIn: 'root'
})
export class TestFormDataService {
  private readonly apiService = inject(ApiService);

  /**
   * Get all test form data with optional filtering
   */
  getAllFormData(sampleId?: number, testId?: number, status?: string): Observable<ApiResponse<TestFormDataEntry[]>> {
    const params: any = {};
    if (sampleId) params.sampleId = sampleId.toString();
    if (testId) params.testId = testId.toString();
    if (status) params.status = status;
    
    return this.apiService.get<TestFormDataEntry[]>('test-form-data', Object.keys(params).length > 0 ? params : undefined);
  }

  /**
   * Get latest form data for a specific sample/test
   */
  getFormData(sampleId: number, testId: number): Observable<ApiResponse<TestFormDataEntry>> {
    return this.apiService.get<TestFormDataEntry>(`test-form-data/${sampleId}/${testId}`);
  }

  /**
   * Get form data history for a sample/test
   */
  getFormDataHistory(sampleId: number, testId: number): Observable<ApiResponse<TestFormDataEntry[]>> {
    return this.apiService.get<TestFormDataEntry[]>(`test-form-data/${sampleId}/${testId}/history`);
  }

  /**
   * Save (create or update) form data
   */
  saveFormData(data: CreateTestFormDataRequest): Observable<ApiResponse<TestFormDataEntry>> {
    return this.apiService.post<TestFormDataEntry>('test-form-data', data);
  }

  /**
   * Update existing form data
   */
  updateFormData(id: number, data: UpdateTestFormDataRequest): Observable<ApiResponse<TestFormDataEntry>> {
    return this.apiService.put<TestFormDataEntry>(`test-form-data/${id}`, data);
  }

  /**
   * Delete form data
   */
  deleteFormData(id: number): Observable<ApiResponse<any>> {
    return this.apiService.delete(`test-form-data/${id}`);
  }

  /**
   * Auto-save form data (creates new version if data has changed significantly)
   */
  autoSaveFormData(sampleId: number, testId: number, formData: any, currentUser: string = 'system'): Observable<ApiResponse<TestFormDataEntry>> {
    return new Observable(observer => {
      // First check if there's existing data
      this.getFormData(sampleId, testId).subscribe({
        next: (existingResponse) => {
          if (existingResponse.success && existingResponse.data) {
            // Update existing data
            const hasSignificantChanges = this.hasSignificantChanges(existingResponse.data.formData, formData);
            
            if (hasSignificantChanges) {
              // Create new version
              this.saveFormData({
                sampleId,
                testId,
                formData,
                status: 'draft',
                createdBy: currentUser
              }).subscribe({
                next: (response) => observer.next(response),
                error: (error) => observer.error(error),
                complete: () => observer.complete()
              });
            } else {
              // Update existing version
              this.updateFormData(existingResponse.data.id, {
                formData,
                status: 'draft'
              }).subscribe({
                next: (response) => observer.next(response),
                error: (error) => observer.error(error),
                complete: () => observer.complete()
              });
            }
          } else {
            // Create new data
            this.saveFormData({
              sampleId,
              testId,
              formData,
              status: 'draft',
              createdBy: currentUser
            }).subscribe({
              next: (response) => observer.next(response),
              error: (error) => observer.error(error),
              complete: () => observer.complete()
            });
          }
        },
        error: (error) => {
          // If getting existing data fails, assume no existing data and create new
          this.saveFormData({
            sampleId,
            testId,
            formData,
            status: 'draft',
            createdBy: currentUser
          }).subscribe({
            next: (response) => observer.next(response),
            error: (error) => observer.error(error),
            complete: () => observer.complete()
          });
        }
      });
    });
  }

  /**
   * Submit form data (change status to submitted)
   */
  submitFormData(sampleId: number, testId: number, formData: any, currentUser: string = 'system'): Observable<ApiResponse<TestFormDataEntry>> {
    return this.saveFormData({
      sampleId,
      testId,
      formData,
      status: 'submitted',
      createdBy: currentUser
    });
  }

  /**
   * Validate form data (change status to validated)
   */
  validateFormData(id: number): Observable<ApiResponse<TestFormDataEntry>> {
    return this.updateFormData(id, { status: 'validated' });
  }

  /**
   * Load initial form data for a component
   */
  loadInitialFormData<T>(sampleId: number, testId: number): Observable<T | null> {
    return new Observable(observer => {
      this.getFormData(sampleId, testId).subscribe({
        next: (response) => {
          if (response.success && response.data && response.data.formData) {
            observer.next(response.data.formData as T);
          } else {
            observer.next(null);
          }
          observer.complete();
        },
        error: (error) => {
          console.warn(`Failed to load initial form data for sample ${sampleId}, test ${testId}:`, error);
          observer.next(null);
          observer.complete();
        }
      });
    });
  }

  /**
   * Clear all draft data for a sample/test (keeping only submitted/validated versions)
   */
  clearDraftData(sampleId: number, testId: number): Observable<ApiResponse<any>[]> {
    return new Observable(observer => {
      this.getFormDataHistory(sampleId, testId).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            const draftEntries = response.data.filter(entry => entry.status === 'draft');
            
            if (draftEntries.length === 0) {
              observer.next([]);
              observer.complete();
              return;
            }
            
            const deletePromises = draftEntries.map(entry => 
              this.deleteFormData(entry.id).toPromise()
            );
            
            Promise.all(deletePromises).then((results) => {
              observer.next(results.filter(Boolean) as ApiResponse<any>[]);
              observer.complete();
            }).catch((error) => {
              observer.error(error);
            });
          } else {
            observer.next([]);
            observer.complete();
          }
        },
        error: (error) => {
          observer.error(error);
        }
      });
    });
  }

  /**
   * Check if form data has significant changes that warrant a new version
   */
  private hasSignificantChanges(oldData: any, newData: any): boolean {
    // Simple comparison for now - in production, you might want more sophisticated comparison
    const oldStr = JSON.stringify(oldData);
    const newStr = JSON.stringify(newData);
    
    // Consider it significant if more than 5% of the content changed
    const similarity = this.calculateSimilarity(oldStr, newStr);
    return similarity < 0.95;
  }

  /**
   * Calculate similarity between two strings (simple implementation)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1.0;
    
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(shorter, longer);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }
}

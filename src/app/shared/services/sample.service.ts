import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, ApiResponse } from './api.service';

export interface Sample {
  sampleId: number;
  sampleNumber: string;
  description?: string;
  customerName?: string;
  customerId?: number;
  dateReceived?: Date;
  sampleTypeCode?: string;
  status?: string;
  comments?: string;
  priority?: number;
  testTemplateId?: number;
  location?: string;
}

export interface SampleCreate {
  sampleNumber: string;
  description?: string;
  customerId?: number;
  dateReceived?: Date;
  sampleTypeCode?: string;
  status?: string;
  comments?: string;
  priority?: number;
  testTemplateId?: number;
  location?: string;
}

export interface SampleFilter {
  sampleNumber?: string;
  customerId?: number;
  customerName?: string;
  status?: string;
  dateReceivedFrom?: Date;
  dateReceivedTo?: Date;
  sampleTypeCode?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface TestAssignment {
  sampleId: number;
  testId: number;
  testCode: string;
  testDescription?: string;
  priority?: number;
  status?: string;
  assignedDate?: Date;
  completedDate?: Date;
  notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SampleService {
  private readonly apiService = inject(ApiService);

  /**
   * Get all samples with optional filtering
   */
  getSamples(filter?: SampleFilter): Observable<ApiResponse<Sample[]>> {
    const params: Record<string, string> = {};
    
    if (filter?.sampleNumber) params['sampleNumber'] = filter.sampleNumber;
    if (filter?.customerId) params['customerId'] = filter.customerId.toString();
    if (filter?.customerName) params['customerName'] = filter.customerName;
    if (filter?.status) params['status'] = filter.status;
    if (filter?.dateReceivedFrom) params['dateReceivedFrom'] = filter.dateReceivedFrom.toISOString();
    if (filter?.dateReceivedTo) params['dateReceivedTo'] = filter.dateReceivedTo.toISOString();
    if (filter?.sampleTypeCode) params['sampleTypeCode'] = filter.sampleTypeCode;
    if (filter?.sortBy) params['sortBy'] = filter.sortBy;
    if (filter?.sortOrder) params['sortOrder'] = filter.sortOrder;

    return this.apiService.get<Sample[]>('samples', params);
  }

  /**
   * Get a specific sample by ID
   */
  getSample(sampleId: number): Observable<ApiResponse<Sample>> {
    return this.apiService.get<Sample>(`samples/${sampleId}`);
  }

  /**
   * Search samples by sample number (for autocomplete/lookup)
   */
  searchSamples(query: string, limit = 10): Observable<ApiResponse<Sample[]>> {
    const params = {
      q: query,
      limit: limit.toString()
    };
    return this.apiService.get<Sample[]>('samples/search', params);
  }

  /**
   * Create a new sample
   */
  createSample(sample: SampleCreate): Observable<ApiResponse<Sample>> {
    return this.apiService.post<Sample>('samples', sample);
  }

  /**
   * Update an existing sample
   */
  updateSample(sampleId: number, sample: Partial<SampleCreate>): Observable<ApiResponse<Sample>> {
    return this.apiService.put<Sample>(`samples/${sampleId}`, sample);
  }

  /**
   * Delete a sample
   */
  deleteSample(sampleId: number): Observable<ApiResponse<void>> {
    return this.apiService.delete<void>(`samples/${sampleId}`);
  }

  /**
   * Get tests assigned to a sample
   */
  getSampleTests(sampleId: number): Observable<ApiResponse<TestAssignment[]>> {
    return this.apiService.get<TestAssignment[]>(`samples/${sampleId}/tests`);
  }

  /**
   * Assign a test to a sample
   */
  assignTest(sampleId: number, testId: number, priority?: number, notes?: string): Observable<ApiResponse<TestAssignment>> {
    const data = {
      testId,
      priority: priority ?? 1,
      notes,
      status: 'assigned'
    };
    return this.apiService.post<TestAssignment>(`samples/${sampleId}/tests`, data);
  }

  /**
   * Remove a test assignment from a sample
   */
  unassignTest(sampleId: number, testId: number): Observable<ApiResponse<void>> {
    return this.apiService.delete<void>(`samples/${sampleId}/tests/${testId}`);
  }

  /**
   * Update test assignment status
   */
  updateTestAssignment(
    sampleId: number, 
    testId: number, 
    update: Partial<TestAssignment>
  ): Observable<ApiResponse<TestAssignment>> {
    return this.apiService.put<TestAssignment>(`samples/${sampleId}/tests/${testId}`, update);
  }

  /**
   * Mark a test as complete for a sample
   */
  completeTest(sampleId: number, testId: number, notes?: string): Observable<ApiResponse<TestAssignment>> {
    return this.updateTestAssignment(sampleId, testId, {
      status: 'completed',
      completedDate: new Date(),
      notes
    });
  }

  /**
   * Get sample status counts for dashboard/summary views
   */
  getSampleStatusCounts(): Observable<ApiResponse<Record<string, number>>> {
    return this.apiService.get<Record<string, number>>('samples/status-counts');
  }

  /**
   * Get samples pending test entry (have assigned tests but no readings)
   */
  getSamplesPendingEntry(): Observable<ApiResponse<Sample[]>> {
    return this.apiService.get<Sample[]>('samples/pending-entry');
  }

  /**
   * Get samples ready for validation (have complete test readings)
   */
  getSamplesReadyForValidation(): Observable<ApiResponse<Sample[]>> {
    return this.apiService.get<Sample[]>('samples/ready-for-validation');
  }

  /**
   * Validate sample number format and availability
   */
  validateSampleNumber(sampleNumber: string): Observable<ApiResponse<{ isValid: boolean; message?: string; suggestion?: string }>> {
    return this.apiService.get<{ isValid: boolean; message?: string; suggestion?: string }>(
      `samples/validate-number/${encodeURIComponent(sampleNumber)}`
    );
  }

  /**
   * Get recent samples for quick access/history
   */
  getRecentSamples(limit = 20): Observable<ApiResponse<Sample[]>> {
    const params = { limit: limit.toString() };
    return this.apiService.get<Sample[]>('samples/recent', params);
  }

  /**
   * Duplicate a sample (copy with new sample number)
   */
  duplicateSample(sampleId: number, newSampleNumber: string): Observable<ApiResponse<Sample>> {
    const data = { newSampleNumber };
    return this.apiService.post<Sample>(`samples/${sampleId}/duplicate`, data);
  }

  /**
   * Get samples assigned to a specific test type
   */
  getSamplesByTest(testId: number): Observable<ApiResponse<any[]>> {
    return this.apiService.get<any[]>(`samples/by-test/${testId}`);
  }

  /**
   * Get detailed sample information for entry form header
   */
  getSampleDetails(sampleId: number): Observable<ApiResponse<any>> {
    return this.apiService.get<any>(`samples/${sampleId}/details`);
  }
}

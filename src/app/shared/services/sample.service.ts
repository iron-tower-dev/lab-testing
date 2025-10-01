import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, ApiResponse } from './api.service';

/**
 * Sample status codes used in the database
 * Based on the usedLubeSamplesTable.status field
 */
export enum SampleStatus {
  RECEIVED = 10,      // Sample received, pending assignment
  ASSIGNED = 20,      // Sample assigned to technician
  IN_PROGRESS = 30,   // Testing in progress
  COMPLETED = 90,     // All tests completed
  RETURNED = 95       // Sample returned to customer
}

/**
 * Sample type flag values
 */
export enum SampleTypeFlag {
  NEW = 0,           // New lubricant sample
  USED = 1           // Used lubricant sample
}

/**
 * Sample priority levels
 */
export enum SamplePriority {
  NORMAL = 0,        // Standard processing
  HIGH = 1,          // High priority
  URGENT = 2         // Urgent/rush processing
}

/**
 * Sample interface matching usedLubeSamplesTable from database schema
 * Represents a lubricant sample submitted for testing
 */
export interface Sample {
  id: number;                          // Primary key
  tagNumber: string | null;            // Equipment tag number
  component: string | null;            // Component code (FK to componentTable)
  location: string | null;             // Location code (FK to locationTable)
  lubeType: string | null;             // Lubricant type/specification
  newUsedFlag: number | null;          // 0 = new, 1 = used
  sampleDate: number | null;           // Timestamp when sample was taken
  status: number | null;               // Sample status code (10=Received, 20=Assigned, 90=Complete, etc.)
  returnedDate: number | null;         // Timestamp when sample was returned/completed
  priority: number | null;             // Sample priority (0=normal, 1=high, 2=urgent)
  assignedDate: number | null;         // Timestamp when sample was assigned
  assignedTo: string | null;           // Employee ID sample is assigned to
  receivedDate: number | null;         // Timestamp when lab received sample
  oilAdded: number | null;             // Amount of oil added (real/float)
  comments: string | null;             // General comments about sample
}

/**
 * Sample creation interface - fields needed to create a new sample
 */
export interface SampleCreate {
  tagNumber: string;                   // Required - Equipment tag number
  component?: string | null;           // Component code
  location?: string | null;            // Location code
  lubeType?: string | null;            // Lubricant type
  newUsedFlag?: number | null;         // 0 = new, 1 = used
  sampleDate?: number | null;          // Sample collection timestamp
  status?: number;                     // Status code (defaults to 10)
  returnedDate?: number | null;        // Completion timestamp
  priority?: number;                   // Priority level (defaults to 0)
  assignedDate?: number | null;        // Assignment timestamp
  assignedTo?: string | null;          // Assignee employee ID
  receivedDate?: number | null;        // Lab receipt timestamp
  oilAdded?: number | null;            // Oil added amount
  comments?: string | null;            // Comments
}

/**
 * Sample filter interface for querying samples
 */
export interface SampleFilter {
  status?: number | string;            // Sample status code
  assignedTo?: string;                 // Employee ID or 'unassigned'
  component?: string;                  // Component code
  location?: string;                   // Location code
  tagNumber?: string;                  // Tag number (partial match)
  lubeType?: string;                   // Lube type (partial match)
  priority?: number | string;          // Priority level
  withDetails?: boolean;               // Include joined component/location details
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Component lookup data from componentTable
 */
export interface ComponentInfo {
  code: string;                        // Primary key
  name: string;                        // Component display name
  description: string | null;          // Additional details
  active: number | null;               // 0 or 1 (boolean as integer)
  sortOrder: number | null;            // Display order
}

/**
 * Location lookup data from locationTable
 */
export interface LocationInfo {
  code: string;                        // Primary key
  name: string;                        // Location display name
  description: string | null;          // Additional details
  active: number | null;               // 0 or 1 (boolean as integer)
  sortOrder: number | null;            // Display order
}

/**
 * Sample with full details including joined component and location info
 */
export interface SampleWithDetails {
  sample: Sample;
  componentInfo: ComponentInfo | null;
  locationInfo: LocationInfo | null;
}

/**
 * Test assignment interface - links samples to tests
 * Note: This may be stored in testReadingsTable or a separate junction table
 */
export interface TestAssignment {
  sampleId: number;
  testId: number;
  testCode?: string;
  testDescription?: string;
  priority?: number;
  status?: string;                     // Test status (not sample status)
  assignedDate?: number | null;        // Timestamp
  completedDate?: number | null;       // Timestamp
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
  getSamples(filter?: SampleFilter): Observable<ApiResponse<Sample[] | SampleWithDetails[]>> {
    const params: Record<string, string> = {};
    
    if (filter?.status !== undefined) {
      params['status'] = typeof filter.status === 'number' ? filter.status.toString() : filter.status;
    }
    if (filter?.assignedTo) params['assignedTo'] = filter.assignedTo;
    if (filter?.component) params['component'] = filter.component;
    if (filter?.location) params['location'] = filter.location;
    if (filter?.tagNumber) params['tagNumber'] = filter.tagNumber;
    if (filter?.lubeType) params['lubeType'] = filter.lubeType;
    if (filter?.priority !== undefined) {
      params['priority'] = typeof filter.priority === 'number' ? filter.priority.toString() : filter.priority;
    }
    if (filter?.withDetails) params['withDetails'] = 'true';
    if (filter?.sortBy) params['sortBy'] = filter.sortBy;
    if (filter?.sortOrder) params['sortOrder'] = filter.sortOrder;

    return this.apiService.get<Sample[] | SampleWithDetails[]>('samples', params);
  }

  /**
   * Get a specific sample by ID with full details (joined component/location)
   */
  getSample(sampleId: number): Observable<ApiResponse<SampleWithDetails>> {
    return this.apiService.get<SampleWithDetails>(`samples/${sampleId}`);
  }

  /**
   * Search samples by tag number (for autocomplete/lookup)
   */
  searchSamples(query: string, limit = 10): Observable<ApiResponse<Sample[]>> {
    const params = {
      tagNumber: query,
      limit: limit.toString()
    };
    return this.apiService.get<Sample[]>('samples', params);
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
   * Update sample status
   */
  updateSampleStatus(sampleId: number, status: number): Observable<ApiResponse<Sample>> {
    return this.apiService.patch<Sample>(`samples/${sampleId}/status`, { status });
  }

  /**
   * Assign sample to user
   */
  assignSample(sampleId: number, assignedTo: string): Observable<ApiResponse<Sample>> {
    return this.apiService.patch<Sample>(`samples/${sampleId}/assign`, { assignedTo });
  }

  // Note: Test assignment methods would be implemented through test-readings API
  // The testReadingsTable stores the relationship between samples and tests
  // Use test-readings.service.ts for test-related operations

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Get human-readable status label
   */
  getStatusLabel(statusCode: number | null): string {
    if (statusCode === null) return 'Unknown';
    
    switch (statusCode) {
      case SampleStatus.RECEIVED:
        return 'Received';
      case SampleStatus.ASSIGNED:
        return 'Assigned';
      case SampleStatus.IN_PROGRESS:
        return 'In Progress';
      case SampleStatus.COMPLETED:
        return 'Completed';
      case SampleStatus.RETURNED:
        return 'Returned';
      default:
        return `Status ${statusCode}`;
    }
  }

  /**
   * Get priority label
   */
  getPriorityLabel(priority: number | null): string {
    if (priority === null) return 'Normal';
    
    switch (priority) {
      case SamplePriority.NORMAL:
        return 'Normal';
      case SamplePriority.HIGH:
        return 'High';
      case SamplePriority.URGENT:
        return 'Urgent';
      default:
        return 'Normal';
    }
  }

  /**
   * Get sample type label (new/used)
   */
  getSampleTypeLabel(flag: number | null): string {
    if (flag === null) return 'Unknown';
    return flag === SampleTypeFlag.NEW ? 'New' : 'Used';
  }

  /**
   * Format timestamp to Date object
   */
  formatTimestamp(timestamp: number | null): Date | null {
    return timestamp ? new Date(timestamp) : null;
  }

  /**
   * Get sample display name (uses tagNumber as primary identifier)
   */
  getSampleDisplayName(sample: Sample): string {
    return sample.tagNumber || `Sample #${sample.id}`;
  }

  /**
   * Check if sample is assigned to anyone
   */
  isAssigned(sample: Sample): boolean {
    return !!sample.assignedTo;
  }

  /**
   * Check if sample is completed
   */
  isCompleted(sample: Sample): boolean {
    return sample.status === SampleStatus.COMPLETED || sample.status === SampleStatus.RETURNED;
  }

  /**
   * Check if sample is in progress
   */
  isInProgress(sample: Sample): boolean {
    return sample.status === SampleStatus.ASSIGNED || sample.status === SampleStatus.IN_PROGRESS;
  }
}

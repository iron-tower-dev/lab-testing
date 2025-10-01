import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { 
  TestStatus, 
  StatusInfoResponse, 
  StatusTransitionRequest,
  StatusTransitionResult 
} from '../types/status-workflow.types';

/**
 * Status Transition Service
 * Handles HTTP communication with status transition API
 */
@Injectable({
  providedIn: 'root'
})
export class StatusTransitionService {
  private http = inject(HttpClient);
  private readonly baseUrl = '/api/status-transitions';
  
  // Subject to track the latest status for reactive updates
  private currentStatusSubject = new BehaviorSubject<TestStatus | null>(null);
  currentStatus$ = this.currentStatusSubject.asObservable();

  /**
   * Get current status for a test
   */
  getCurrentStatus(sampleId: number, testId: number): Observable<StatusInfoResponse> {
    return this.http.get<StatusInfoResponse>(
      `${this.baseUrl}/current/${sampleId}/${testId}`
    ).pipe(
      tap(response => {
        if (response.success && response.status) {
          this.currentStatusSubject.next(response.status);
        }
      }),
      catchError(error => {
        console.error('Error fetching current status:', error);
        throw error;
      })
    );
  }

  /**
   * Perform a status transition
   */
  transitionStatus(request: StatusTransitionRequest): Observable<StatusTransitionResult> {
    return this.http.post<StatusTransitionResult>(
      `${this.baseUrl}/transition`,
      request
    ).pipe(
      tap(result => {
        if (result.success) {
          this.currentStatusSubject.next(result.newStatus);
        }
      }),
      catchError(error => {
        console.error('Error transitioning status:', error);
        throw error;
      })
    );
  }

  /**
   * Save results (standard save action)
   */
  saveResults(
    sampleId: number, 
    testId: number, 
    newStatus: TestStatus, 
    userId: string
  ): Observable<StatusTransitionResult> {
    return this.transitionStatus({
      sampleId,
      testId,
      newStatus,
      userId,
      action: 'save'
    });
  }

  /**
   * Partial save (for Ferrography, Viscosity)
   */
  partialSave(
    sampleId: number, 
    testId: number, 
    newStatus: TestStatus, 
    userId: string
  ): Observable<StatusTransitionResult> {
    return this.transitionStatus({
      sampleId,
      testId,
      newStatus,
      userId,
      action: 'partial-save'
    });
  }

  /**
   * Accept results (reviewer acceptance)
   */
  acceptResults(
    sampleId: number, 
    testId: number, 
    newStatus: TestStatus, 
    userId: string
  ): Observable<StatusTransitionResult> {
    return this.transitionStatus({
      sampleId,
      testId,
      newStatus,
      userId,
      action: 'accept'
    });
  }

  /**
   * Reject results (reviewer rejection)
   */
  rejectResults(
    sampleId: number, 
    testId: number, 
    userId: string
  ): Observable<StatusTransitionResult> {
    // Rejection deletes and recreates, so newStatus is determined by backend
    return this.transitionStatus({
      sampleId,
      testId,
      newStatus: TestStatus.AWAITING, // Will be overridden by backend logic
      userId,
      action: 'reject'
    });
  }

  /**
   * Delete test results
   */
  deleteResults(
    sampleId: number, 
    testId: number, 
    userId: string
  ): Observable<StatusTransitionResult> {
    return this.transitionStatus({
      sampleId,
      testId,
      newStatus: TestStatus.AWAITING, // Not used for delete
      userId,
      action: 'delete'
    });
  }

  /**
   * Mark media ready (for microscope tests)
   */
  markMediaReady(
    sampleId: number, 
    testId: number, 
    userId: string
  ): Observable<StatusTransitionResult> {
    return this.transitionStatus({
      sampleId,
      testId,
      newStatus: TestStatus.ENTRY_COMPLETE,
      userId,
      action: 'media-ready'
    });
  }

  /**
   * Clear the current status (for local state management)
   */
  clearCurrentStatus(): void {
    this.currentStatusSubject.next(null);
  }

  /**
   * Set current status manually (for initial load)
   */
  setCurrentStatus(status: TestStatus): void {
    this.currentStatusSubject.next(status);
  }
}

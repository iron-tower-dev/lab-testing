import { Component, input, effect, signal, computed, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EntryForm } from './components/entry-form/entry-form';
import { EntryFormHeader } from './components/entry-form-header/entry-form-header';
import { ActionButtons } from '../components/action-buttons/action-buttons';
import { FormControl } from '@angular/forms';
import { TestReference } from '../enter-results.types';
import { ActionContext, TestStatus } from '../../shared/types/status-workflow.types';
import { StatusTransitionService } from '../../shared/services/status-transition.service';
import { StatusWorkflowService } from '../../shared/services/status-workflow.service';
import { QualificationService } from '../../shared/services/qualification.service';

@Component({
  selector: 'app-entry-form-area',
  imports: [EntryFormHeader, EntryForm, ActionButtons],
  templateUrl: './entry-form-area.html',
  styleUrl: './entry-form-area.css'
})
export class EntryFormArea {
  private readonly statusTransitionService = inject(StatusTransitionService);
  private readonly statusWorkflowService = inject(StatusWorkflowService);
  private readonly qualService = inject(QualificationService);
  private readonly destroyRef = inject(DestroyRef);
  
  // Shared lab comments control for forms that support it
  labCommentsControl = new FormControl('');
  
  // Current status signal
  readonly currentStatus = signal<TestStatus>(TestStatus.AWAITING);
  
  // Mode signal (entry or review)
  readonly mode = signal<'entry' | 'review' | 'view'>('entry');
  
  selectedSample = input<{ testReference: TestReference; sampleId: string; sampleDetails?: any } | null>(null);
  
  // Action context for determining available buttons
  readonly actionContext = computed<ActionContext>(() => {
    const sample = this.selectedSample();
    if (!sample) {
      return {
        testId: 0,
        sampleId: 0,
        currentStatus: TestStatus.AWAITING,
        userQualification: null,
        enteredBy: null,
        currentUser: this.getCurrentUserId(),
        mode: this.mode(),
        isPartialSave: false,
        isTraining: false
      };
    }
    
    const sampleIdMatch = sample.sampleId.match(/-(\d+)$/);
    const numericSampleId = sampleIdMatch ? parseInt(sampleIdMatch[1], 10) : 0;
    const userQual = this.qualService.getQualificationLevel(sample.testReference.testStandId);
    
    return {
      testId: sample.testReference.id,
      sampleId: numericSampleId,
      currentStatus: this.currentStatus(),
      userQualification: userQual,
      enteredBy: null, // TODO: Get from test reading data
      currentUser: this.getCurrentUserId(),
      mode: this.mode(),
      isPartialSave: false,
      isTraining: userQual === 'TRAIN'
    };
  });
  
  constructor() {
    // Initialize lab comments from sample data when available
    effect(() => {
      const sample = this.selectedSample() as any; // Type assertion for expanded sample data
      if (sample?.sampleDetails?.labComments && Array.isArray(sample.sampleDetails.labComments)) {
        // Join existing lab comments with line breaks for editing
        const commentsText = sample.sampleDetails.labComments.join('\n');
        this.labCommentsControl.setValue(commentsText);
      } else {
        this.labCommentsControl.setValue('');
      }
    });
    
    // Subscribe to status updates from the service with proper cleanup
    this.statusTransitionService.currentStatus$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(status => {
        if (status) {
          this.currentStatus.set(status);
        }
      });
  }
  
  handleAction(action: string) {
    const sample = this.selectedSample();
    if (!sample) return;
    
    const sampleIdMatch = sample.sampleId.match(/-(\d+)$/);
    const numericSampleId = sampleIdMatch ? parseInt(sampleIdMatch[1], 10) : 0;
    const testId = sample.testReference.id;
    const userId = this.getCurrentUserId();
    
    switch (action) {
      case 'save':
        this.handleSave(numericSampleId, testId, userId);
        break;
      case 'partial-save':
        this.handlePartialSave(numericSampleId, testId, userId);
        break;
      case 'accept':
        this.handleAccept(numericSampleId, testId, userId);
        break;
      case 'reject':
        this.handleReject(numericSampleId, testId, userId);
        break;
      case 'delete':
        this.handleDelete(numericSampleId, testId, userId);
        break;
      case 'media-ready':
        this.handleMediaReady(numericSampleId, testId, userId);
        break;
      case 'clear':
        this.handleClear();
        break;
    }
  }
  
  private handleSave(sampleId: number, testId: number, userId: string) {
    const newStatus = this.statusWorkflowService.determineEntryStatus(this.actionContext());
    this.statusTransitionService.saveResults(sampleId, testId, newStatus, userId).subscribe({
      next: (result) => {
        if (result.success) {
          console.log('Results saved successfully', result);
          // TODO: Show success message to user
        }
      },
      error: (error) => {
        console.error('Error saving results:', error);
        // TODO: Show error message to user
      }
    });
  }
  
  private handlePartialSave(sampleId: number, testId: number, userId: string) {
    const context = { ...this.actionContext(), isPartialSave: true };
    const newStatus = this.statusWorkflowService.determineEntryStatus(context);
    this.statusTransitionService.partialSave(sampleId, testId, newStatus, userId).subscribe({
      next: (result) => {
        if (result.success) {
          console.log('Partial save successful', result);
          // TODO: Show success message to user
        }
      },
      error: (error) => {
        console.error('Error with partial save:', error);
        // TODO: Show error message to user
      }
    });
  }
  
  private handleAccept(sampleId: number, testId: number, userId: string) {
    const newStatus = this.statusWorkflowService.determineReviewStatus(this.actionContext(), 'accept');
    this.statusTransitionService.acceptResults(sampleId, testId, newStatus, userId).subscribe({
      next: (result) => {
        if (result.success) {
          console.log('Results accepted', result);
          // TODO: Show success message to user
        }
      },
      error: (error) => {
        console.error('Error accepting results:', error);
        // TODO: Show error message to user
      }
    });
  }
  
  private handleReject(sampleId: number, testId: number, userId: string) {
    // Confirm before rejecting
    if (confirm('Are you sure you want to reject these results? This will delete all data.')) {
      this.statusTransitionService.rejectResults(sampleId, testId, userId).subscribe({
        next: (result) => {
          if (result.success) {
            console.log('Results rejected', result);
            // TODO: Show success message to user
            // TODO: Clear form data
          }
        },
        error: (error) => {
          console.error('Error rejecting results:', error);
          // TODO: Show error message to user
        }
      });
    }
  }
  
  private handleDelete(sampleId: number, testId: number, userId: string) {
    // Confirm before deleting
    if (confirm('Are you sure you want to delete these results? This cannot be undone.')) {
      this.statusTransitionService.deleteResults(sampleId, testId, userId).subscribe({
        next: (result) => {
          if (result.success) {
            console.log('Results deleted', result);
            // TODO: Show success message to user
            // TODO: Clear form data
          }
        },
        error: (error) => {
          console.error('Error deleting results:', error);
          // TODO: Show error message to user
        }
      });
    }
  }
  
  private handleMediaReady(sampleId: number, testId: number, userId: string) {
    this.statusTransitionService.markMediaReady(sampleId, testId, userId).subscribe({
      next: (result) => {
        if (result.success) {
          console.log('Marked as media ready', result);
          // TODO: Show success message to user
        }
      },
      error: (error) => {
        console.error('Error marking media ready:', error);
        // TODO: Show error message to user
      }
    });
  }
  
  private handleClear() {
    // Clear form data (Ferrography training only)
    if (confirm('Are you sure you want to clear the form?')) {
      // TODO: Implement form clearing logic
      console.log('Form cleared');
    }
  }
  
  private getCurrentUserId(): string {
    // Get current user from localStorage or session
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        return user.employeeId || 'UNKNOWN';
      } catch (e) {
        console.error('Failed to parse stored user:', e);
      }
    }
    return 'UNKNOWN';
  }
}

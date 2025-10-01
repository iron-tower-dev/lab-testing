import { Injectable } from '@angular/core';
import { 
  TestStatus, 
  StatusInfo, 
  StatusTransition, 
  StatusAction, 
  ActionContext 
} from '../types/status-workflow.types';

/**
 * Status Workflow Service
 * Phase 2: Status Workflow System Implementation
 * 
 * Manages the complete 8-state workflow for test result entry,
 * determines available actions based on context, and validates
 * status transitions according to VB.NET legacy business rules.
 */
@Injectable({
  providedIn: 'root'
})
export class StatusWorkflowService {
  
  /**
   * Status display information
   */
  private readonly statusInfo: Record<TestStatus, StatusInfo> = {
    [TestStatus.NOT_STARTED]: {
      code: TestStatus.NOT_STARTED,
      label: 'Not Started',
      description: 'Sample has been created but no work has begun',
      color: '#9ca3af',
      icon: '○',
      isFinal: false
    },
    [TestStatus.AWAITING]: {
      code: TestStatus.AWAITING,
      label: 'Awaiting Entry',
      description: 'Ready for data entry or has been rejected',
      color: '#f59e0b',
      icon: '⏳',
      isFinal: false
    },
    [TestStatus.TRAINING]: {
      code: TestStatus.TRAINING,
      label: 'Training',
      description: 'Entered by trainee, needs review',
      color: '#fbbf24',
      icon: '🎓',
      isFinal: false
    },
    [TestStatus.PARTIAL]: {
      code: TestStatus.PARTIAL,
      label: 'Partial Entry',
      description: 'Partially entered, awaiting microscope work',
      color: '#60a5fa',
      icon: '◐',
      isFinal: false
    },
    [TestStatus.ENTRY_COMPLETE]: {
      code: TestStatus.ENTRY_COMPLETE,
      label: 'Entry Complete',
      description: 'Data entry complete, awaiting validation',
      color: '#3b82f6',
      icon: '✓',
      isFinal: false
    },
    [TestStatus.SAVED]: {
      code: TestStatus.SAVED,
      label: 'Saved',
      description: 'Validated and saved',
      color: '#10b981',
      icon: '✓✓',
      isFinal: false
    },
    [TestStatus.DONE]: {
      code: TestStatus.DONE,
      label: 'Done',
      description: 'Final validation complete',
      color: '#059669',
      icon: '✓✓✓',
      isFinal: true
    },
    [TestStatus.COMPLETE]: {
      code: TestStatus.COMPLETE,
      label: 'Complete',
      description: 'Microscope work complete',
      color: '#8b5cf6',
      icon: '🔬',
      isFinal: true
    }
  };

  /**
   * Valid status transitions
   */
  private readonly transitions: StatusTransition[] = [
    // From NOT_STARTED
    { from: TestStatus.NOT_STARTED, to: TestStatus.AWAITING, action: 'assign' },
    
    // From AWAITING
    { from: TestStatus.AWAITING, to: TestStatus.TRAINING, action: 'enter', requiresQualification: ['TRAIN'] },
    { from: TestStatus.AWAITING, to: TestStatus.PARTIAL, action: 'partial-save', requiresQualification: ['Q', 'QAG', 'MicrE'] },
    { from: TestStatus.AWAITING, to: TestStatus.ENTRY_COMPLETE, action: 'complete-entry', requiresQualification: ['Q', 'QAG', 'MicrE'] },
    { from: TestStatus.AWAITING, to: TestStatus.SAVED, action: 'save-and-validate', requiresQualification: ['Q', 'QAG', 'MicrE'] },
    
    // From TRAINING
    { from: TestStatus.TRAINING, to: TestStatus.AWAITING, action: 'reject', requiresQualification: ['Q', 'QAG', 'MicrE'] },
    { from: TestStatus.TRAINING, to: TestStatus.SAVED, action: 'accept', requiresQualification: ['Q', 'QAG', 'MicrE'] },
    { from: TestStatus.TRAINING, to: TestStatus.ENTRY_COMPLETE, action: 'accept-microscope', requiresQualification: ['Q', 'QAG', 'MicrE'], conditions: ['microscope-test'] },
    
    // From PARTIAL
    { from: TestStatus.PARTIAL, to: TestStatus.AWAITING, action: 'reject', requiresQualification: ['Q', 'QAG', 'MicrE'] },
    { from: TestStatus.PARTIAL, to: TestStatus.ENTRY_COMPLETE, action: 'complete-microscope', requiresQualification: ['MicrE'] },
    
    // From ENTRY_COMPLETE
    { from: TestStatus.ENTRY_COMPLETE, to: TestStatus.AWAITING, action: 'reject', requiresQualification: ['Q', 'QAG', 'MicrE'] },
    { from: TestStatus.ENTRY_COMPLETE, to: TestStatus.SAVED, action: 'validate', requiresQualification: ['Q', 'QAG', 'MicrE'] },
    { from: TestStatus.ENTRY_COMPLETE, to: TestStatus.COMPLETE, action: 'complete-microscope', requiresQualification: ['MicrE'], conditions: ['microscope-test'] },
    
    // From SAVED
    { from: TestStatus.SAVED, to: TestStatus.DONE, action: 'final-validate', requiresQualification: ['QAG', 'MicrE'] }
  ];

  /**
   * Microscope-requiring test IDs
   */
  private readonly microscopeTests = [120, 180, 210, 240];

  /**
   * Get display information for a status
   */
  getStatusInfo(status: TestStatus): StatusInfo {
    return this.statusInfo[status];
  }

  /**
   * Check if transition is valid
   */
  canTransition(from: TestStatus, to: TestStatus, userQualification: string | null): boolean {
    const transition = this.transitions.find(t => t.from === from && t.to === to);
    
    if (!transition) {
      return false;
    }
    
    if (transition.requiresQualification && userQualification) {
      return transition.requiresQualification.includes(userQualification);
    }
    
    return true;
  }

  /**
   * Get all valid next statuses from current status
   */
  getValidNextStatuses(currentStatus: TestStatus, userQualification: string | null): TestStatus[] {
    return this.transitions
      .filter(t => t.from === currentStatus)
      .filter(t => !t.requiresQualification || 
                   (userQualification && t.requiresQualification.includes(userQualification)))
      .map(t => t.to);
  }

  /**
   * Determine status for new entry based on context
   * Based on VB.NET enterReadings and saveResultsFunctions logic
   */
  determineEntryStatus(context: ActionContext): TestStatus {
    // Training user
    if (context.userQualification === 'TRAIN') {
      return context.isPartialSave ? TestStatus.AWAITING : TestStatus.TRAINING;
    }
    
    // Partial save
    if (context.isPartialSave) {
      // Ferrography partial save goes to PARTIAL
      if (context.testId === 210) {
        return TestStatus.PARTIAL;
      }
      return TestStatus.AWAITING;
    }
    
    // Microscope tests
    if (this.microscopeTests.includes(context.testId)) {
      return TestStatus.ENTRY_COMPLETE;
    }
    
    // Regular save by qualified user
    if (context.userQualification === 'Q' || 
        context.userQualification === 'QAG' || 
        context.userQualification === 'MicrE') {
      return TestStatus.SAVED;
    }
    
    return TestStatus.ENTRY_COMPLETE;
  }

  /**
   * Determine status after review action
   * Based on VB.NET reviewaccept/reviewreject logic
   */
  determineReviewStatus(context: ActionContext, action: 'accept' | 'reject'): TestStatus {
    if (action === 'reject') {
      // Rejection always goes back to awaiting (with data deleted)
      // Exception: Ferrography goes to ENTRY_COMPLETE
      return context.testId === 210 ? TestStatus.ENTRY_COMPLETE : TestStatus.AWAITING;
    }
    
    // Accept action
    if (context.testId === 210 && context.userQualification === 'QAG') {
      // Ferrography accepted by QAG goes to partial (awaits MicrE)
      return TestStatus.PARTIAL;
    }
    
    const microscopeTests = [120, 180, 240];
    if (microscopeTests.includes(context.testId)) {
      return TestStatus.ENTRY_COMPLETE;
    }
    
    return TestStatus.SAVED;
  }

  /**
   * Get available actions for current context
   */
  getAvailableActions(context: ActionContext): StatusAction[] {
    // View mode - no actions
    if (context.mode === 'view') {
      return [];
    }
    
    // Review mode
    if (context.mode === 'review') {
      return this.getReviewActions(context);
    }
    
    // Entry mode
    return this.getEntryActions(context);
  }

  /**
   * Get actions available in entry mode
   * Based on VB.NET button display logic from enterResults.txt lines 1189-1344
   */
  private getEntryActions(context: ActionContext): StatusAction[] {
    const actions: StatusAction[] = [];
    const isMicroscopeTest = this.microscopeTests.includes(context.testId);
    
    // Partial save button
    if (context.currentStatus === TestStatus.NOT_STARTED || 
        context.currentStatus === TestStatus.AWAITING ||
        context.currentStatus === TestStatus.PARTIAL) {
      
      // Ferrography partial save rules
      if (context.testId === 210) {
        if (context.userQualification === 'TRAIN' ||
            context.userQualification === 'Q' ||
            context.userQualification === 'QAG' ||
            context.userQualification === 'MicrE') {
          actions.push({
            action: 'partial-save',
            label: 'Partial Save',
            icon: 'save_as',
            requiresQualification: ['TRAIN', 'Q', 'QAG', 'MicrE']
          });
        }
      }
      
      // Viscosity partial save (Q/QAG only)
      if (context.testId === 50 || context.testId === 60) {
        if (context.userQualification === 'Q' || context.userQualification === 'QAG') {
          actions.push({
            action: 'partial-save',
            label: 'Partial Save',
            icon: 'save_as',
            requiresQualification: ['Q', 'QAG']
          });
        }
      }
    }
    
    // Save button
    if (context.userQualification === 'Q' || 
        context.userQualification === 'QAG' || 
        context.userQualification === 'MicrE') {
      
      // Special logic for microscope tests
      if (isMicroscopeTest && context.userQualification === 'MicrE') {
        if (context.currentStatus === TestStatus.TRAINING ||
            context.currentStatus === TestStatus.ENTRY_COMPLETE ||
            context.currentStatus === TestStatus.PARTIAL) {
          actions.push({
            action: 'save',
            label: 'Save',
            icon: 'save',
            requiresQualification: ['MicrE']
          });
        }
      } else if (!context.isTraining || context.currentStatus !== TestStatus.COMPLETE) {
        actions.push({
          action: 'save',
          label: 'Save',
          icon: 'save',
          requiresQualification: ['Q', 'QAG', 'MicrE']
        });
      }
    }
    
    // Clear button (Ferrography training only)
    if (context.testId === 210 && context.userQualification === 'TRAIN') {
      actions.push({
        action: 'clear',
        label: 'Clear',
        icon: 'clear'
      });
    }
    
    // Media Ready button (microscope tests)
    if (isMicroscopeTest) {
      const shouldShow = 
        (context.testId !== 210 || context.currentStatus === TestStatus.NOT_STARTED) &&
        !(context.testId !== 210 && (context.currentStatus === TestStatus.ENTRY_COMPLETE || context.currentStatus === TestStatus.COMPLETE));
      
      if (shouldShow) {
        actions.push({
          action: 'media-ready',
          label: 'Media Ready',
          icon: 'check_circle'
        });
      }
    }
    
    // Delete button (QAG/MicrE only)
    if (context.userQualification === 'QAG' || context.userQualification === 'MicrE') {
      const canDelete = 
        (context.testId === 210 && (context.currentStatus === TestStatus.ENTRY_COMPLETE || 
                                     context.currentStatus === TestStatus.COMPLETE ||
                                     context.currentStatus === TestStatus.PARTIAL)) ||
        (context.testId !== 210 && context.currentStatus !== TestStatus.COMPLETE);
      
      if (canDelete) {
        actions.push({
          action: 'delete',
          label: 'Delete',
          icon: 'delete',
          requiresQualification: ['QAG', 'MicrE']
        });
      }
    }
    
    return actions;
  }

  /**
   * Get actions available in review mode
   * Based on VB.NET review mode button logic
   */
  private getReviewActions(context: ActionContext): StatusAction[] {
    const actions: StatusAction[] = [];
    const microscopeTests = [120, 180, 210, 240];
    
    // Can't review own work
    if (context.enteredBy === context.currentUser) {
      return [];
    }
    
    // Only Q/QAG/MicrE can review
    if (context.userQualification !== 'Q' && 
        context.userQualification !== 'QAG' && 
        context.userQualification !== 'MicrE') {
      return [];
    }
    
    // Ferrography specific rules
    if (context.testId === 210) {
      if (context.userQualification === 'QAG' || context.userQualification === 'MicrE') {
        // Partial save button for Q/QAG reviewing non-MicrE entry
        actions.push({
          action: 'partial-save',
          label: 'Partial Save',
          icon: 'save_as'
        });
      }
      
      if (context.userQualification === 'MicrE' && context.currentStatus === TestStatus.PARTIAL) {
        actions.push({
          action: 'save',
          label: 'Save',
          icon: 'save'
        });
      }
      
      if (context.currentStatus === TestStatus.PARTIAL) {
        actions.push({
          action: 'delete',
          label: 'Delete',
          icon: 'delete'
        });
      }
      
      if (context.userQualification === 'MicrE') {
        actions.push({
          action: 'accept',
          label: 'Accept',
          icon: 'check_circle'
        });
        actions.push({
          action: 'reject',
          label: 'Reject',
          icon: 'cancel'
        });
      }
    } else if (microscopeTests.includes(context.testId)) {
      // Other microscope tests
      if (context.userQualification === 'MicrE' && 
          (context.currentStatus === TestStatus.TRAINING || context.currentStatus === TestStatus.ENTRY_COMPLETE)) {
        actions.push({
          action: 'save',
          label: 'Save',
          icon: 'save'
        });
      }
      
      if (context.userQualification === 'QAG' || 
          (context.userQualification === 'MicrE' && context.currentStatus === TestStatus.TRAINING)) {
        actions.push({
          action: 'accept',
          label: 'Accept',
          icon: 'check_circle'
        });
        actions.push({
          action: 'reject',
          label: 'Reject',
          icon: 'cancel'
        });
      }
    } else {
      // Regular tests
      if (!(context.testId === 50 || context.testId === 60) || 
          context.userQualification !== 'TRAIN' || 
          context.currentStatus !== TestStatus.TRAINING) {
        actions.push({
          action: 'accept',
          label: 'Accept',
          icon: 'check_circle'
        });
        actions.push({
          action: 'reject',
          label: 'Reject',
          icon: 'cancel'
        });
      }
    }
    
    return actions;
  }

  /**
   * Check if status is final (no more changes allowed)
   */
  isFinalStatus(status: TestStatus): boolean {
    return this.statusInfo[status].isFinal;
  }

  /**
   * Check if test requires microscope work
   */
  isMicroscopeTest(testId: number): boolean {
    return this.microscopeTests.includes(testId);
  }
}

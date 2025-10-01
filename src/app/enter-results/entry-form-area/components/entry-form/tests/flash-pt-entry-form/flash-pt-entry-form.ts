import { Component, OnInit, input, signal, computed, inject, effect } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SharedModule } from '../../../../../../shared-module';
import { SampleWithTestInfo } from '../../../../../enter-results.types';
import { FlashPointCalculationService } from '../../../../../../shared/services/flash-point-calculation.service';
import { TestReadingsService } from '../../../../../../shared/services/test-readings.service';
import { StatusWorkflowService } from '../../../../../../shared/services/status-workflow.service';
import { StatusTransitionService } from '../../../../../../shared/services/status-transition.service';
import { TestStatus, ActionContext } from '../../../../../../shared/types/status-workflow.types';
import { ActionButtons } from '../../../../../components/action-buttons/action-buttons';

/**
 * Flash Point Entry Form Component
 * 
 * Modernized with Angular signals, FlashPointCalculationService, status workflow, and data persistence.
 * Phase 2 Integration: Status workflow system with dynamic action buttons and review mode.
 */
@Component({
  standalone: true,
  selector: 'app-flash-pt-entry-form',
  templateUrl: './flash-pt-entry-form.html',
  styleUrls: ['./flash-pt-entry-form.css'],
  imports: [SharedModule, ActionButtons]
})
export class FlashPtEntryForm implements OnInit {
  private fb = inject(FormBuilder);
  private flashCalc = inject(FlashPointCalculationService);
  private testReadingsService = inject(TestReadingsService);
  private statusWorkflow = inject(StatusWorkflowService);
  private statusTransition = inject(StatusTransitionService);
  
  // Inputs
  sampleData = input<SampleWithTestInfo | null>(null);
  errorMessage = input<string | null>(null);
  mode = input<'entry' | 'review' | 'view'>('entry');
  userQualification = input<string | null>('Q'); // TODO: Get from auth service
  currentUser = input<string>('current_user'); // TODO: Get from auth service
  
  // Form
  form!: FormGroup;
  
  // State signals
  isLoading = signal(false);
  isSaving = signal(false);
  saveMessage = signal<{ text: string; type: 'success' | 'error' } | null>(null);
  currentStatus = signal<TestStatus>(TestStatus.AWAITING);
  enteredBy = signal<string | null>(null);
  showCalculationDetails = signal(true);

  
  // Computed signals
  averageTemperature = computed(() => {
    const trial1 = this.form?.get('trial1Temp')?.value;
    const trial2 = this.form?.get('trial2Temp')?.value;
    const trial3 = this.form?.get('trial3Temp')?.value;
    
    const temps = [trial1, trial2, trial3]
      .filter(t => t !== null && t !== undefined && t !== '')
      .map(t => parseFloat(t));
    
    if (temps.length === 0) return 0;
    return this.flashCalc.calculateAverageTemperature(temps);
  });
  
  pressureCorrection = computed(() => {
    const pressure = this.form?.get('pressure')?.value;
    if (!pressure) return 0;
    return this.flashCalc.calculatePressureCorrection(pressure);
  });
  
  flashPointResult = computed(() => {
    const trial1 = this.form?.get('trial1Temp')?.value;
    const trial2 = this.form?.get('trial2Temp')?.value;
    const trial3 = this.form?.get('trial3Temp')?.value;
    const pressure = this.form?.get('pressure')?.value;
    
    const temps = [trial1, trial2, trial3]
      .filter(t => t !== null && t !== undefined && t !== '')
      .map(t => parseFloat(t));
    
    if (temps.length < 2 || !pressure) return null;
    
    return this.flashCalc.calculateFlashPoint(temps, pressure);
  });
  
  // Action context for workflow
  actionContext = computed<ActionContext>(() => {
    const sample = this.sampleData();
    return {
      testId: sample?.testReference?.id || 0, // Flash Point test ID
      sampleId: sample?.sampleId || 0,
      currentStatus: this.currentStatus(),
      userQualification: this.userQualification(),
      enteredBy: this.enteredBy(),
      currentUser: this.currentUser(),
      mode: this.mode(),
      isPartialSave: false,
      isTraining: this.userQualification() === 'TRAIN'
    };
  });
  
  constructor() {
    // Reactively load existing data when sampleData changes
    effect(() => {
      const sampleInfo = this.sampleData();
      if (sampleInfo?.sampleId && sampleInfo?.testReference?.id) {
        this.loadExistingData();
      }
    });
  }
  
  ngOnInit(): void {
    this.initializeForm();
    this.loadCurrentStatus();
  }
  
  private initializeForm(): void {
    this.form = this.fb.group({
      pressure: [760, [Validators.required, Validators.min(600), Validators.max(800)]],
      testMethod: ['ASTM-D92', Validators.required],
      labTemperature: [22, [Validators.min(15), Validators.max(35)]],
      sampleVolume: [75, [Validators.min(50), Validators.max(100)]],
      analystInitials: ['', [Validators.required, Validators.maxLength(5)]],
      trial1Temp: ['', [Validators.required, Validators.min(0), Validators.max(400)]],
      trial2Temp: ['', [Validators.required, Validators.min(0), Validators.max(400)]],
      trial3Temp: ['', [Validators.min(0), Validators.max(400)]],
      flashObservation: [''],
      testNotes: ['']
    });
    
    // Load analyst initials from localStorage
    const savedInitials = localStorage.getItem('analystInitials');
    if (savedInitials) {
      this.form.patchValue({ analystInitials: savedInitials });
    }
  }
  
  /**
   * Load current status from API
   */
  private loadCurrentStatus(): void {
    const sampleInfo = this.sampleData();
    if (!sampleInfo?.sampleId || !sampleInfo?.testReference?.id) {
      return;
    }
    
    this.statusTransition
      .getCurrentStatus(sampleInfo.sampleId, sampleInfo.testReference.id)
      .subscribe({
        next: (response) => {
          if (response.success && response.status) {
            this.currentStatus.set(response.status as TestStatus);
          }
        },
        error: (error) => {
          console.error('Failed to load status:', error);
          // Default to AWAITING if no status found
          this.currentStatus.set(TestStatus.AWAITING);
        }
      });
  }
  
  /**
   * Load existing data from database if available
   */
  private loadExistingData(): void {
    const sampleInfo = this.sampleData();
    if (!sampleInfo?.sampleId || !sampleInfo?.testReference?.id) {
      return;
    }
    
    this.isLoading.set(true);
    
    this.testReadingsService
      .loadTrials(sampleInfo.sampleId, sampleInfo.testReference.id)
      .subscribe({
        next: (trials) => {
          if (trials.length > 0) {
            const trial = trials[0];
            
            // Store who entered the data
            if (trial.entryId) {
              this.enteredBy.set(trial.entryId);
            }
            
            this.form.patchValue({
              pressure: trial.value1 || 760,
              trial1Temp: trial.value2 || '',
              trial2Temp: trial.value3 || '',
              trial3Temp: trial.trialCalc || '',
              testMethod: trial.id1 || 'ASTM-D92',
              labTemperature: parseFloat(trial.id2 || '22') || 22,
              sampleVolume: parseFloat(trial.id3 || '75') || 75,
              flashObservation: this.extractFromComments(trial.mainComments, 'flash'),
              testNotes: this.extractFromComments(trial.mainComments, 'notes'),
              analystInitials: trial.entryId || ''
            });
          }
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Failed to load existing Flash Point data:', error);
          this.isLoading.set(false);
        }
      });
  }

  /**
   * Extract specific field from comments string
   */
  private extractFromComments(comments: string | null, field: string): string {
    if (!comments) return '';
    const regex = new RegExp(`${field}:([^|]+)`, 'i');
    const match = comments.match(regex);
    return match ? match[1].trim() : '';
  }
  
  /**
   * Handle action button clicks
   */
  onAction(action: string): void {
    switch (action) {
      case 'save':
        this.saveResults(false);
        break;
      case 'partial-save':
        this.saveResults(true);
        break;
      case 'accept':
        this.acceptResults();
        break;
      case 'reject':
        this.rejectResults();
        break;
      case 'delete':
        this.deleteResults();
        break;
      case 'clear':
        this.clearForm();
        break;
      case 'media-ready':
        this.markMediaReady();
        break;
    }
  }
  
  /**
   * Save Flash Point results to database
   */
  private saveResults(isPartialSave: boolean = false): void {
    if (!this.form.valid && !isPartialSave) {
      this.showSaveMessage('Please fill in all required fields', 'error');
      return;
    }
    
    const result = this.flashPointResult();
    if (!result || !result.isValid) {
      if (!isPartialSave) {
        this.showSaveMessage('Invalid calculation - please check your inputs', 'error');
        return;
      }
    }
    
    const sampleInfo = this.sampleData();
    if (!sampleInfo?.sampleId || !sampleInfo?.testReference?.id) {
      this.showSaveMessage('No sample selected', 'error');
      return;
    }
    
    // Determine new status based on context
    const context = this.actionContext();
    context.isPartialSave = isPartialSave;
    const newStatus = this.statusWorkflow.determineEntryStatus(context);
    
    this.isSaving.set(true);
    
    // Create comments string
    const comments = this.buildCommentsString();
    
    // Create trial record
    const trial = {
      sampleId: sampleInfo.sampleId,
      testId: sampleInfo.testReference.id,
      trialNumber: 1,
      value1: this.form.get('pressure')?.value, // Atmospheric pressure
      value2: this.form.get('trial1Temp')?.value, // Trial 1 temp
      value3: this.form.get('trial2Temp')?.value, // Trial 2 temp
      trialCalc: this.form.get('trial3Temp')?.value || null, // Trial 3 temp
      id1: this.form.get('testMethod')?.value, // Test method
      id2: this.form.get('labTemperature')?.value?.toString(), // Lab temperature
      id3: this.form.get('sampleVolume')?.value?.toString(), // Sample volume
      trialComplete: !isPartialSave,
      status: newStatus,
      entryId: this.form.get('analystInitials')?.value,
      entryDate: Date.now(),
      mainComments: comments
    };
    
    this.testReadingsService.bulkSaveTrials(
      sampleInfo.sampleId,
      sampleInfo.testReference.id,
      [trial],
      this.form.get('analystInitials')?.value,
      newStatus
    ).subscribe({
      next: () => {
        // Update status
        this.currentStatus.set(newStatus);
        this.isSaving.set(false);
        
        const message = isPartialSave 
          ? 'Flash Point results partially saved' 
          : 'Flash Point results saved successfully';
        this.showSaveMessage(message, 'success');
        
        // Save analyst initials for future use
        const initials = this.form.get('analystInitials')?.value;
        if (initials) {
          localStorage.setItem('analystInitials', initials);
          this.enteredBy.set(initials);
        }
      },
      error: (error) => {
        console.error('Failed to save Flash Point results:', error);
        this.isSaving.set(false);
        this.showSaveMessage('Failed to save results. Please try again.', 'error');
      }
    });
  }
  
  /**
   * Accept results (reviewer action)
   */
  private acceptResults(): void {
    const sampleInfo = this.sampleData();
    if (!sampleInfo?.sampleId || !sampleInfo?.testReference?.id) return;
    
    this.isSaving.set(true);
    
    const context = this.actionContext();
    const newStatus = this.statusWorkflow.determineReviewStatus(context, 'accept');
    
    this.statusTransition
      .acceptResults(sampleInfo.sampleId, sampleInfo.testReference.id, newStatus, this.currentUser())
      .subscribe({
        next: (result) => {
          if (result.success) {
            this.currentStatus.set(result.newStatus);
            this.showSaveMessage('Results accepted', 'success');
          }
          this.isSaving.set(false);
        },
        error: (error) => {
          console.error('Accept error:', error);
          this.isSaving.set(false);
          this.showSaveMessage('Failed to accept results', 'error');
        }
      });
  }
  
  /**
   * Reject results (reviewer action)
   */
  private rejectResults(): void {
    if (!confirm('Are you sure you want to reject these results? All data will be deleted.')) {
      return;
    }
    
    const sampleInfo = this.sampleData();
    if (!sampleInfo?.sampleId || !sampleInfo?.testReference?.id) return;
    
    this.isSaving.set(true);
    
    this.statusTransition
      .rejectResults(sampleInfo.sampleId, sampleInfo.testReference.id, this.currentUser())
      .subscribe({
        next: (result) => {
          if (result.success) {
            this.currentStatus.set(result.newStatus);
            this.form.reset({
              pressure: 760,
              testMethod: 'ASTM-D92',
              labTemperature: 22,
              sampleVolume: 75
            });
            this.showSaveMessage('Results rejected and reset', 'success');
          }
          this.isSaving.set(false);
        },
        error: (error) => {
          console.error('Reject error:', error);
          this.isSaving.set(false);
          this.showSaveMessage('Failed to reject results', 'error');
        }
      });
  }
  
  /**
   * Delete results (admin action)
   */
  private deleteResults(): void {
    if (!confirm('Are you sure you want to delete these results?')) {
      return;
    }
    
    const sampleInfo = this.sampleData();
    if (!sampleInfo?.sampleId || !sampleInfo?.testReference?.id) return;
    
    this.isSaving.set(true);
    
    this.statusTransition
      .deleteResults(sampleInfo.sampleId, sampleInfo.testReference.id, this.currentUser())
      .subscribe({
        next: (result) => {
          if (result.success) {
            this.form.reset({
              pressure: 760,
              testMethod: 'ASTM-D92',
              labTemperature: 22,
              sampleVolume: 75
            });
            this.currentStatus.set(TestStatus.AWAITING);
            this.showSaveMessage('Results deleted', 'success');
          }
          this.isSaving.set(false);
        },
        error: (error) => {
          console.error('Delete error:', error);
          this.isSaving.set(false);
          this.showSaveMessage('Failed to delete results', 'error');
        }
      });
  }
  
  /**
   * Mark as media ready
   */
  private markMediaReady(): void {
    const sampleInfo = this.sampleData();
    if (!sampleInfo?.sampleId || !sampleInfo?.testReference?.id) return;
    
    this.isSaving.set(true);
    
    this.statusTransition
      .markMediaReady(sampleInfo.sampleId, sampleInfo.testReference.id, this.currentUser())
      .subscribe({
        next: (result) => {
          if (result.success) {
            this.currentStatus.set(result.newStatus);
            this.showSaveMessage('Marked as media ready', 'success');
          }
          this.isSaving.set(false);
        },
        error: (error) => {
          console.error('Media ready error:', error);
          this.isSaving.set(false);
          this.showSaveMessage('Failed to mark media ready', 'error');
        }
      });
  }
  
  /**
   * Build comments string from form fields
   */
  private buildCommentsString(): string {
    const parts: string[] = [];
    
    const flash = this.form.get('flashObservation')?.value;
    if (flash) parts.push(`flash:${flash}`);
    
    const notes = this.form.get('testNotes')?.value;
    if (notes) parts.push(`notes:${notes}`);
    
    return parts.join('|');
  }
  
  /**
   * Helper to show save messages
   */
  private showSaveMessage(text: string, type: 'success' | 'error'): void {
    this.saveMessage.set({ text, type });
    setTimeout(() => this.saveMessage.set(null), type === 'error' ? 5000 : 3000);
  }
  
  /**
   * Clear all form data
   */
  private clearForm(): void {
    if (confirm('Are you sure you want to clear all data?')) {
      this.form.reset({
        pressure: 760,
        testMethod: 'ASTM-D92',
        labTemperature: 22,
        sampleVolume: 75,
        analystInitials: localStorage.getItem('analystInitials') || ''
      });
      this.saveMessage.set(null);
    }
  }

  
  // Quality control methods
  showQualityControlChecks(): boolean {
    const result = this.flashPointResult();
    return !!(result && result.warnings && result.warnings.length > 0);
  }
  
  getQualityControlWarnings(): string[] {
    const result = this.flashPointResult();
    return result?.warnings || [];
  }
}


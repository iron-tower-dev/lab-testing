import { Component, OnInit, input, signal, computed, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SharedModule } from '../../../../../../shared-module';
import { SampleWithTestInfo } from '../../../../../enter-results.types';
import { TANCalculationService } from '../../../../../../shared/services/tan-calculation.service';
import { TestReadingsService } from '../../../../../../shared/services/test-readings.service';
import { CalculationResult } from '../../../../../../shared/services/calculation.service';
import { StatusWorkflowService } from '../../../../../../shared/services/status-workflow.service';
import { StatusTransitionService } from '../../../../../../shared/services/status-transition.service';
import { TestStatus, ActionContext } from '../../../../../../shared/types/status-workflow.types';
import { ActionButtons } from '../../../../../components/action-buttons/action-buttons';

/**
 * TAN (Total Acid Number) Entry Form Component
 * 
 * Modernized with Angular signals, TANCalculationService, status workflow, and data persistence.
 * Phase 2 Integration: Status workflow system with dynamic action buttons and review mode.
 */
@Component({
  standalone: true,
  selector: 'app-tan-entry-form',
  templateUrl: './tan-entry-form.html',
  styleUrls: ['./tan-entry-form.css'],
  imports: [SharedModule, ActionButtons]
})
export class TanEntryForm implements OnInit {
  private fb = inject(FormBuilder);
  private tanCalc = inject(TANCalculationService);
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
  
  // Computed signals
  netBuretVolume = computed(() => {
    const initial = this.form?.get('initialBuret')?.value || 0;
    const final = this.form?.get('finalBuret')?.value || 0;
    return this.tanCalc.calculateNetVolume(final, initial);
  });
  
  tanResult = computed(() => {
    const initial = this.form?.get('initialBuret')?.value || 0;
    const final = this.form?.get('finalBuret')?.value || 0;
    const normality = this.form?.get('kohNormality')?.value || 0;
    const weight = this.form?.get('sampleWeight')?.value || 0;
    
    if (!initial && initial !== 0 || !final || !normality || !weight) {
      return null;
    }
    
    return this.tanCalc.calculateTAN(final, initial, normality, weight);
  });
  
  // Action context for workflow
  actionContext = computed<ActionContext>(() => {
    const sample = this.sampleData();
    return {
      testId: sample?.testReference?.id || 10,
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
  
  // UI state
  showCalculationDetails = signal(true);
  
  ngOnInit(): void {
    this.initializeForm();
    this.loadCurrentStatus();
    this.loadExistingData();
  }
  
  private initializeForm(): void {
    this.form = this.fb.group({
      sampleWeight: ['', [Validators.required, Validators.min(0.01), Validators.max(20.00)]],
      initialBuret: [0, [Validators.required, Validators.min(0), Validators.max(50)]],
      finalBuret: ['', [Validators.required, Validators.min(0), Validators.max(50)]],
      kohNormality: [0.1000, [Validators.required, Validators.min(0.0001), Validators.max(1.0000)]],
      temperature: [22, [Validators.min(15), Validators.max(35)]],
      analystInitials: ['', [Validators.required, Validators.maxLength(5)]],
      colorObserved: [''],
      testMethod: ['ASTM-D664'],
      solvent: ['Isopropanol/Toluene'],
      indicator: ['P-Naphtholbenzein'],
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
            // TAN test typically has one trial with all data
            const trial = trials[0];
            
            // Store who entered the data
            if (trial.entryId) {
              this.enteredBy.set(trial.entryId);
            }
            
            this.form.patchValue({
              initialBuret: trial.value1 || 0,
              finalBuret: trial.value2 || 0,
              sampleWeight: parseFloat(trial.id2 || '0') || 0,
              kohNormality: parseFloat(trial.id3 || '0.1') || 0.1,
              testMethod: trial.id1 || 'ASTM-D664',
              temperature: trial.trialCalc || 22,
              colorObserved: this.extractFromComments(trial.mainComments, 'color'),
              testNotes: this.extractFromComments(trial.mainComments, 'notes'),
              solvent: this.extractFromComments(trial.mainComments, 'solvent') || 'Isopropanol/Toluene',
              indicator: this.extractFromComments(trial.mainComments, 'indicator') || 'P-Naphtholbenzein',
              analystInitials: trial.entryId || ''
            });
          }
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Failed to load existing TAN data:', error);
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
   * Save TAN results to database
   */
  private saveResults(isPartialSave: boolean = false): void {
    if (!this.form.valid && !isPartialSave) {
      this.showSaveMessage('Please fill in all required fields', 'error');
      return;
    }
    
    const result = this.tanResult();
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
      value1: this.form.get('initialBuret')?.value, // Initial buret
      value2: this.form.get('finalBuret')?.value, // Final buret
      value3: result?.result || 0, // TAN result
      id1: this.form.get('testMethod')?.value, // Test method
      id2: this.form.get('sampleWeight')?.value?.toString(), // Sample weight
      id3: this.form.get('kohNormality')?.value?.toString(), // KOH normality
      trialCalc: this.form.get('temperature')?.value, // Temperature
      trialComplete: !isPartialSave,
      status: newStatus,
      entryId: this.form.get('analystInitials')?.value,
      entryDate: Date.now(),
      mainComments: comments
    };
    
    this.testReadingsService.bulkSaveTrials([trial]).subscribe({
      next: () => {
        // Update status
        this.currentStatus.set(newStatus);
        this.isSaving.set(false);
        
        const message = isPartialSave 
          ? 'TAN results partially saved' 
          : 'TAN results saved successfully';
        this.showSaveMessage(message, 'success');
        
        // Save analyst initials for future use
        const initials = this.form.get('analystInitials')?.value;
        if (initials) {
          localStorage.setItem('analystInitials', initials);
          this.enteredBy.set(initials);
        }
      },
      error: (error) => {
        console.error('Failed to save TAN results:', error);
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
              initialBuret: 0,
              kohNormality: 0.1000,
              temperature: 22,
              testMethod: 'ASTM-D664',
              solvent: 'Isopropanol/Toluene',
              indicator: 'P-Naphtholbenzein'
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
              initialBuret: 0,
              kohNormality: 0.1000,
              temperature: 22,
              testMethod: 'ASTM-D664',
              solvent: 'Isopropanol/Toluene',
              indicator: 'P-Naphtholbenzein'
            });
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
   * Mark media ready for microscopy (not applicable to TAN, but included for consistency)
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
            this.showSaveMessage('Media marked as ready', 'success');
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
    
    const color = this.form.get('colorObserved')?.value;
    if (color) parts.push(`color:${color}`);
    
    const notes = this.form.get('testNotes')?.value;
    if (notes) parts.push(`notes:${notes}`);
    
    const solvent = this.form.get('solvent')?.value;
    if (solvent) parts.push(`solvent:${solvent}`);
    
    const indicator = this.form.get('indicator')?.value;
    if (indicator) parts.push(`indicator:${indicator}`);
    
    return parts.join('|');
  }
  
  /**
   * Clear all form data
   */
  clearForm(): void {
    if (confirm('Are you sure you want to clear all data?')) {
      this.form.reset({
        initialBuret: 0,
        kohNormality: 0.1000,
        temperature: 22,
        testMethod: 'ASTM-D664',
        solvent: 'Isopropanol/Toluene',
        indicator: 'P-Naphtholbenzein',
        analystInitials: localStorage.getItem('analystInitials') || ''
      });
      this.saveMessage.set(null);
    }
  }
  
  /**
   * Show save message with auto-hide
   */
  private showSaveMessage(text: string, type: 'success' | 'error'): void {
    this.saveMessage.set({ text, type });
    setTimeout(() => this.saveMessage.set(null), 3000);
  }
  
  // Quality control methods
  showQualityControlChecks(): boolean {
    const result = this.tanResult();
    return !!(result && result.warnings && result.warnings.length > 0);
  }
  
  hasNegativeVolume(): boolean {
    return this.netBuretVolume() < 0;
  }
  
  getQualityControlWarnings(): string[] {
    const result = this.tanResult();
    return result?.warnings || [];
  }
}

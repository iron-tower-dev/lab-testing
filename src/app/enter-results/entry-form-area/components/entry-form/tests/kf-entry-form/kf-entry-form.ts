import { Component, OnInit, inject, signal, computed, input, effect } from '@angular/core';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { TestReadingsService } from '../../../../../../shared/services/test-readings.service';
import { SharedModule } from '../../../../../../shared-module';
import { SampleWithTestInfo } from '../../../../../enter-results.types';
import { StatusWorkflowService } from '../../../../../../shared/services/status-workflow.service';
import { StatusTransitionService } from '../../../../../../shared/services/status-transition.service';
import { TestStatus, ActionContext } from '../../../../../../shared/types/status-workflow.types';
import { ActionButtons } from '../../../../../components/action-buttons/action-buttons';

/**
 * Karl Fischer Water Content Entry Form Component
 * 
 * Modernized with Angular signals, status workflow, and data persistence.
 * Phase 2 Integration: Status workflow system with dynamic action buttons and review mode.
 */
@Component({
  selector: 'app-kf-entry-form',
  standalone: true,
  templateUrl: './kf-entry-form.html',
  styleUrl: './kf-entry-form.css',
  imports: [SharedModule, ActionButtons]
})
export class KfEntryForm implements OnInit {
  private fb = inject(FormBuilder);
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
  showFileUpload = signal(false);
  selectedFile = signal<File | null>(null);
  
  ngOnInit(): void {
    this.initializeForm();
    this.loadCurrentStatus();
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      // Trial data
      trial1Result: ['', [Validators.required, Validators.min(0), Validators.max(100)]],
      trial2Result: ['', [Validators.required, Validators.min(0), Validators.max(100)]],
      trial3Result: ['', [Validators.min(0), Validators.max(100)]],
      trial4Result: ['', [Validators.min(0), Validators.max(100)]],
      
      // Test conditions
      analystInitials: ['', [Validators.required, Validators.maxLength(5)]],
      testTemperature: ['25', [Validators.min(20), Validators.max(30)]],
      sampleVolume: ['', [Validators.min(0.1), Validators.max(10)]],
      
      // File upload
      uploadedFileName: [''],
      
      // Comments
      testNotes: [''],
      mainComments: ['']
    });
  }

  // Computed signals for calculations
  validResults = computed(() => {
    if (!this.form) return [];
    const results = [
      this.form.get('trial1Result')?.value,
      this.form.get('trial2Result')?.value,
      this.form.get('trial3Result')?.value,
      this.form.get('trial4Result')?.value
    ].filter(val => val !== null && val !== undefined && val !== '');
    
    return results.map(val => parseFloat(val)).filter(val => !isNaN(val));
  });

  averageResult = computed(() => {
    const results = this.validResults();
    if (results.length < 2) return 0;
    
    const average = results.reduce((sum, val) => sum + val, 0) / results.length;
    return Math.round(average * 100) / 100;
  });

  resultVariation = computed(() => {
    const results = this.validResults();
    if (results.length < 2) return 0;
    
    const max = Math.max(...results);
    const min = Math.min(...results);
    return Math.round((max - min) * 100) / 100;
  });

  isVariationAcceptable = computed(() => {
    return this.resultVariation() <= 0.05; // 0.05% acceptable variation
  });
  
  // Action context for workflow
  actionContext = computed<ActionContext>(() => {
    const sample = this.sampleData();
    return {
      testId: sample?.testReference?.id || 0, // Karl Fischer test ID
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

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile.set(file);
      this.form.patchValue({ uploadedFileName: file.name });
    }
  }

  toggleFileUpload(): void {
    this.showFileUpload.update(show => !show);
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

  private loadExistingData(): void {
    const sampleInfo = this.sampleData();
    if (!sampleInfo?.sampleId || !sampleInfo?.testReference?.id) {
      // Set default values
      this.form.patchValue({
        analystInitials: localStorage.getItem('analystInitials') || '',
        testTemperature: '25'
      });
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
              trial1Result: trial.value1,
              trial2Result: trial.value2,
              trial3Result: trial.value3,
              trial4Result: trial.trialCalc,
              analystInitials: trial.id3 || trial.entryId,
              testTemperature: trial.id1 || '25',
              sampleVolume: trial.id2,
              testNotes: this.extractFromComments('notes', trial.mainComments || '')
            });
          } else {
            // Set default values
            this.form.patchValue({
              analystInitials: localStorage.getItem('analystInitials') || '',
              testTemperature: '25'
            });
          }
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading existing KF test data:', error);
          this.showSaveMessage('Error loading existing data', 'error');
          this.isLoading.set(false);
        }
      });
  }


  private extractFromComments(section: string, comments: string): string {
    if (!comments) return '';
    
    const regex = new RegExp(`${section}:(.+?)(?:\\||$)`, 'i');
    const match = comments.match(regex);
    return match ? match[1].trim() : '';
  }

  private combineComments(): string {
    const parts = [];
    
    const fileName = this.form.get('uploadedFileName')?.value;
    if (fileName) parts.push(`file:${fileName}`);
    
    const notes = this.form.get('testNotes')?.value;
    if (notes) parts.push(`notes:${notes}`);
    
    const main = this.form.get('mainComments')?.value;
    if (main) parts.push(`comments:${main}`);
    
    return parts.join(' | ');
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
   * Save Karl Fischer results to database
   */
  private saveResults(isPartialSave: boolean = false): void {
    if (!this.form.valid && !isPartialSave) {
      this.form.markAllAsTouched();
      this.showSaveMessage('Please correct form errors before saving', 'error');
      return;
    }

    if (this.validResults().length < 2 && !isPartialSave) {
      this.showSaveMessage('At least two trial results are required', 'error');
      return;
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
    
    const average = this.averageResult();
    const comments = this.combineComments();
    
    // Create trial record
    const trial = {
      sampleId: sampleInfo.sampleId,
      testId: sampleInfo.testReference.id,
      trialNumber: 1,
      value1: this.form.get('trial1Result')?.value || null,
      value2: this.form.get('trial2Result')?.value || null,
      value3: this.form.get('trial3Result')?.value || null,
      trialCalc: this.form.get('trial4Result')?.value || (average > 0 ? average : null),
      id1: this.form.get('testTemperature')?.value,
      id2: this.form.get('sampleVolume')?.value?.toString(),
      id3: this.form.get('analystInitials')?.value,
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
          ? 'Karl Fischer results partially saved' 
          : 'Karl Fischer results saved successfully';
        this.showSaveMessage(message, 'success');
        
        // Save analyst initials for future use
        const initials = this.form.get('analystInitials')?.value;
        if (initials) {
          localStorage.setItem('analystInitials', initials);
          this.enteredBy.set(initials);
        }
      },
      error: (error) => {
        console.error('Failed to save Karl Fischer results:', error);
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
              testTemperature: '25',
              analystInitials: localStorage.getItem('analystInitials') || ''
            });
            this.selectedFile.set(null);
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
              testTemperature: '25',
              analystInitials: localStorage.getItem('analystInitials') || ''
            });
            this.selectedFile.set(null);
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

  private clearForm(): void {
    if (confirm('Are you sure you want to clear all entered data? This cannot be undone.')) {
      this.form.reset({
        testTemperature: '25',
        analystInitials: localStorage.getItem('analystInitials') || ''
      });
      this.selectedFile.set(null);
      this.saveMessage.set(null);
    }
  }

  private showSaveMessage(text: string, type: 'success' | 'error'): void {
    this.saveMessage.set({ text, type });
    setTimeout(() => this.saveMessage.set(null), type === 'error' ? 5000 : 3000);
  }
}


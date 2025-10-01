import { Component, OnInit, inject, signal, computed, input, effect } from '@angular/core';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { TestReadingsService } from '../../../../../../shared/services/test-readings.service';
import { GreaseCalculationService } from '../../../../../../shared/services/grease-calculation.service';
import { SharedModule } from '../../../../../../shared-module';
import { SampleWithTestInfo } from '../../../../../enter-results.types';
import { StatusWorkflowService } from '../../../../../../shared/services/status-workflow.service';
import { StatusTransitionService } from '../../../../../../shared/services/status-transition.service';
import { TestStatus, ActionContext } from '../../../../../../shared/types/status-workflow.types';
import { ActionButtons } from '../../../../../components/action-buttons/action-buttons';

/**
 * Grease Penetration (60 strokes) Entry Form Component
 * 
 * Modernized with Angular signals, status workflow, and data persistence.
 * Phase 2 Integration: Status workflow system with dynamic action buttons and review mode.
 */
@Component({
  selector: 'app-gr-pen60-entry-form',
  templateUrl: './gr-pen60-entry-form.html',
  styleUrl: './gr-pen60-entry-form.css',
  standalone: true,
  imports: [SharedModule, ActionButtons]
})
export class GrPen60EntryForm implements OnInit {
  private fb = inject(FormBuilder);
  private testReadingsService = inject(TestReadingsService);
  private greaseCalc = inject(GreaseCalculationService);
  private statusWorkflow = inject(StatusWorkflowService);
  private statusTransition = inject(StatusTransitionService);

  // Inputs
  sampleData = input<SampleWithTestInfo | null>(null);
  errorMessage = input<string | null>(null);
  mode = input<'entry' | 'review' | 'view'>('entry');
  userQualification = input<string | null>('Q');
  currentUser = input<string>('current_user');

  // Form
  form!: FormGroup;

  // State signals
  isLoading = signal(false);
  isSaving = signal(false);
  saveMessage = signal<{ text: string; type: 'success' | 'error' } | null>(null);
  currentStatus = signal<TestStatus>(TestStatus.AWAITING);
  enteredBy = signal<string | null>(null);
  showCalculationDetails = signal(true);

  constructor() {
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
      testTemperature: ['25', Validators.required],
      penetrationTime: ['5', [Validators.required, Validators.min(5), Validators.max(10)]],
      analystInitials: ['', [Validators.required, Validators.maxLength(5)]],
      workedSample: [true],
      cone1: ['', [Validators.required, Validators.min(50), Validators.max(500)]],
      cone2: ['', [Validators.required, Validators.min(50), Validators.max(500)]],
      cone3: ['', [Validators.required, Validators.min(50), Validators.max(500)]],
      penetrometerId: [''],
      lastCalibrationDate: [''],
      sampleAppearance: [''],
      testNotes: [''],
      mainComments: ['']
    });
  }

  // Computed signals for calculations
  validReadings = computed(() => {
    if (!this.form) return [];
    const readings = [
      this.form.get('cone1')?.value,
      this.form.get('cone2')?.value,
      this.form.get('cone3')?.value
    ].filter(val => val !== null && val !== undefined && val !== '');
    
    return readings.map(val => parseFloat(val)).filter(val => !isNaN(val));
  });

  averageReading = computed(() => {
    const readings = this.validReadings();
    if (readings.length !== 3) return 0;
    
    return Math.round(readings.reduce((sum, val) => sum + val, 0) / readings.length);
  });

  penetrationResult = computed(() => {
    const readings = this.validReadings();
    if (readings.length !== 3) return null;
    
    return this.greaseCalc.calculatePenetration(readings);
  });

  nlgiGrade = computed(() => {
    const result = this.penetrationResult();
    if (!result?.isValid) return null;
    
    return this.greaseCalc.getNLGIGrade(result.result);
  });

  consistencyDescription = computed(() => {
    const grade = this.nlgiGrade();
    if (!grade) return null;
    
    const descriptions = this.greaseCalc.getConsistencyDescriptions();
    return descriptions[grade] || 'Unknown';
  });

  readingVariation = computed(() => {
    const readings = this.validReadings();
    if (readings.length < 2) return 0;
    
    const max = Math.max(...readings);
    const min = Math.min(...readings);
    return Math.round(max - min);
  });

  isVariationAcceptable = computed(() => {
    return this.readingVariation() <= 10; // 10 units acceptable
  });

  isRangeReasonable = computed(() => {
    const avg = this.averageReading();
    return avg >= 85 && avg <= 475;
  });
  
  // Action context for workflow
  actionContext = computed<ActionContext>(() => {
    const sample = this.sampleData();
    return {
      testId: sample?.testReference?.id || 0,
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
          this.currentStatus.set(TestStatus.AWAITING);
        }
      });
  }

  private loadExistingData(): void {
    const sampleInfo = this.sampleData();
    if (!sampleInfo?.sampleId || !sampleInfo?.testReference?.id) {
      this.form.patchValue({
        testTemperature: '25',
        penetrationTime: '5',
        workedSample: true,
        analystInitials: localStorage.getItem('analystInitials') || ''
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
            
            if (trial.entryId) {
              this.enteredBy.set(trial.entryId);
            }
            
            this.form.patchValue({
              cone1: trial.value1,
              cone2: trial.value2,
              cone3: trial.value3,
              testTemperature: trial.id1 || '25',
              penetrationTime: trial.id2 || '5',
              analystInitials: trial.id3 || trial.entryId,
              workedSample: this.extractFromComments('worked', trial.mainComments || '') === 'true',
              penetrometerId: this.extractFromComments('equip', trial.mainComments || ''),
              lastCalibrationDate: this.extractFromComments('calibDate', trial.mainComments || ''),
              sampleAppearance: this.extractFromComments('appearance', trial.mainComments || ''),
              testNotes: this.extractFromComments('notes', trial.mainComments || ''),
              mainComments: this.extractFromComments('comments', trial.mainComments || '')
            });
          } else {
            this.form.patchValue({
              testTemperature: '25',
              penetrationTime: '5',
              workedSample: true,
              analystInitials: localStorage.getItem('analystInitials') || ''
            });
          }
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading existing Grease Penetration test data:', error);
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
    
    if (this.form.get('workedSample')?.value) {
      parts.push('worked:true');
    }
    
    const equipId = this.form.get('penetrometerId')?.value;
    if (equipId) parts.push(`equip:${equipId}`);

    const calibDate = this.form.get('lastCalibrationDate')?.value;
    if (calibDate) parts.push(`calibDate:${calibDate}`);
    
    const appearance = this.form.get('sampleAppearance')?.value;
    if (appearance) parts.push(`appearance:${appearance}`);
    
    const notes = this.form.get('testNotes')?.value;
    if (notes) parts.push(`notes:${notes}`);
    
    const main = this.form.get('mainComments')?.value;
    if (main) parts.push(`comments:${main}`);
    
    return parts.join(' | ');
  }

  // Helper methods for template
  getPenetrationRange(): string {
    const grade = this.nlgiGrade();
    if (!grade) return 'N/A';
    
    const ranges: Record<string, string> = {
      '000': '445-475 mm/10',
      '00': '400-430 mm/10',
      '0': '355-385 mm/10',
      '1': '310-340 mm/10',
      '2': '265-295 mm/10',
      '3': '220-250 mm/10',
      '4': '175-205 mm/10',
      '5': '130-160 mm/10',
      '6': '85-115 mm/10'
    };
    
    return ranges[grade] || 'N/A';
  }

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

  private saveResults(isPartialSave: boolean = false): void {
    if (!this.form.valid && !isPartialSave) {
      this.form.markAllAsTouched();
      this.showSaveMessage('Please correct form errors before saving', 'error');
      return;
    }

    if (this.validReadings().length !== 3 && !isPartialSave) {
      this.showSaveMessage('All three cone readings are required', 'error');
      return;
    }

    const sampleInfo = this.sampleData();
    if (!sampleInfo?.sampleId || !sampleInfo?.testReference?.id) {
      this.showSaveMessage('No sample selected', 'error');
      return;
    }

    const context = this.actionContext();
    context.isPartialSave = isPartialSave;
    const newStatus = this.statusWorkflow.determineEntryStatus(context);

    this.isSaving.set(true);

    const result = this.penetrationResult();
    const comments = this.combineComments();

    const trial = {
      sampleId: sampleInfo.sampleId,
      testId: sampleInfo.testReference.id,
      trialNumber: 1,
      value1: this.form.get('cone1')?.value || null,
      value2: this.form.get('cone2')?.value || null,
      value3: this.form.get('cone3')?.value || null,
      trialCalc: result?.result || null,
      id1: this.form.get('testTemperature')?.value,
      id2: this.form.get('penetrationTime')?.value,
      id3: this.form.get('analystInitials')?.value,
      trialComplete: !isPartialSave,
      status: newStatus,
      entryId: this.form.get('analystInitials')?.value,
      entryDate: Date.now(),
      mainComments: comments
    };

    this.testReadingsService.bulkSaveTrials([trial]).subscribe({
      next: () => {
        this.currentStatus.set(newStatus);
        this.isSaving.set(false);

        const message = isPartialSave
          ? 'Grease penetration results partially saved'
          : 'Grease penetration results saved successfully';
        this.showSaveMessage(message, 'success');

        const initials = this.form.get('analystInitials')?.value;
        if (initials) {
          localStorage.setItem('analystInitials', initials);
          this.enteredBy.set(initials);
        }
      },
      error: (error) => {
        console.error('Error saving grease penetration results:', error);
        this.isSaving.set(false);
        this.showSaveMessage('Error saving results. Please try again.', 'error');
      }
    });
  }

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

  private rejectResults(): void {
    if (!confirm('Are you sure you want to reject these results? All data will be deleted.')) return;

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
              penetrationTime: '5',
              workedSample: true,
              analystInitials: localStorage.getItem('analystInitials') || ''
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

  private deleteResults(): void {
    if (!confirm('Are you sure you want to delete these results?')) return;

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
              penetrationTime: '5',
              workedSample: true,
              analystInitials: localStorage.getItem('analystInitials') || ''
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
        penetrationTime: '5',
        workedSample: true,
        analystInitials: localStorage.getItem('analystInitials') || ''
      });
      this.saveMessage.set(null);
    }
  }

  toggleCalculationDetails(): void {
    this.showCalculationDetails.update(show => !show);
  }

  private showSaveMessage(text: string, type: 'success' | 'error'): void {
    this.saveMessage.set({ text, type });
    setTimeout(() => this.saveMessage.set(null), type === 'error' ? 5000 : 3000);
  }
}

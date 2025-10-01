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
 * Grease Drop Point Entry Form Component
 * 
 * Modernized with Angular signals, status workflow, and data persistence.
 * Phase 2 Integration: Status workflow system with dynamic action buttons and review mode.
 */
@Component({
  selector: 'app-gr-drop-pt-entry-form',
  standalone: true,
  templateUrl: './gr-drop-pt-entry-form.html',
  styleUrl: './gr-drop-pt-entry-form.css',
  imports: [SharedModule, ActionButtons]
})
export class GrDropPtEntryForm implements OnInit {
  private fb = inject(FormBuilder);
  private testReadingsService = inject(TestReadingsService);
  private greaseCalc = inject(GreaseCalculationService);
  private statusWorkflow = inject(StatusWorkflowService);
  private statusTransition = inject(StatusTransitionService);

  // Input signals
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
      const data = this.sampleData();
      if (data?.sampleId && data?.testReference?.id) {
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
      // Drop point measurements (observed dropping point temperature)
      droppingPointTemp: ['', [Validators.required, Validators.min(50), Validators.max(350)]],
      blockTemp: ['', [Validators.required, Validators.min(50), Validators.max(400)]],
      
      // Sample preparation
      sampleAmount: ['', [Validators.required, Validators.min(0.5), Validators.max(5)]],
      sampleAppearance: [''],
      workedSample: [false],
      
      // Test apparatus
      apparatusType: ['ASTM D566', Validators.required],
      cupType: ['Standard metal cup'],
      thermometerId: [''],
      
      // Heating conditions
      heatingRate: ['2', [Validators.required, Validators.min(1), Validators.max(5)]],
      initialTemperature: ['', [Validators.min(20), Validators.max(50)]],
      ambientTemperature: ['', [Validators.min(15), Validators.max(35)]],
      
      // Visual observations
      firstSoftening: [''],
      dropAppearance: [''],
      dropBehavior: [''],
      
      // Quality control
      barometricPressure: ['', [Validators.min(700), Validators.max(800)]],
      draftConditions: ['None'],
      
      // Analyst information
      analystInitials: ['', [Validators.required, Validators.maxLength(5)]],
      
      // Comments
      observationNotes: [''],
      testNotes: [''],
      mainComments: ['']
    });
  }

  // Computed signals for calculations
  droppingPointResult = computed(() => {
    if (!this.form) return null;
    
    const droppingPointTemp = parseFloat(this.form.get('droppingPointTemp')?.value);
    const blockTemp = parseFloat(this.form.get('blockTemp')?.value);
    
    if (isNaN(droppingPointTemp) || isNaN(blockTemp)) return null;
    
    return this.greaseCalc.calculateDroppingPoint(droppingPointTemp, blockTemp);
  });

  temperatureDifference = computed(() => {
    if (!this.form) return 0;
    
    const droppingPointTemp = parseFloat(this.form.get('droppingPointTemp')?.value);
    const blockTemp = parseFloat(this.form.get('blockTemp')?.value);
    
    if (isNaN(droppingPointTemp) || isNaN(blockTemp)) return 0;
    
    return Math.round((blockTemp - droppingPointTemp) * 10) / 10;
  });

  isTemperatureDifferenceAcceptable = computed(() => {
    const diff = this.temperatureDifference();
    return diff >= 5 && diff <= 50; // Reasonable difference range
  });

  isHeatingRateAcceptable = computed(() => {
    const rate = parseFloat(this.form?.get('heatingRate')?.value);
    return !isNaN(rate) && rate >= 1.5 && rate <= 2.5; // ASTM D566 requirement
  });

  isDropPointReasonable = computed(() => {
    const result = this.droppingPointResult();
    if (!result?.isValid) return true;
    return result.result >= 60 && result.result <= 320; // Typical range for greases
  });

  dropPointClassification = computed(() => {
    const result = this.droppingPointResult();
    if (!result?.isValid) return null;
    
    const dropPoint = result.result;
    if (dropPoint >= 260) return 'Very High Drop Point';
    if (dropPoint >= 220) return 'High Drop Point';
    if (dropPoint >= 180) return 'Medium High Drop Point';
    if (dropPoint >= 150) return 'Medium Drop Point';
    if (dropPoint >= 120) return 'Medium Low Drop Point';
    return 'Low Drop Point';
  });

  serviceTemperature = computed(() => {
    const result = this.droppingPointResult();
    if (!result?.isValid) return null;
    
    // Conservative service temperature estimate (typically 50-100°C below drop point)
    return Math.round(result.result - 75);
  });

  stabilityIndication = computed(() => {
    const result = this.droppingPointResult();
    if (!result?.isValid) return null;
    
    const dropPoint = result.result;
    if (dropPoint >= 250) return 'Excellent high-temperature stability';
    if (dropPoint >= 200) return 'Good high-temperature stability';
    if (dropPoint >= 150) return 'Moderate high-temperature stability';
    return 'Limited high-temperature stability';
  });
  
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
    if (!sampleInfo?.sampleId || !sampleInfo?.testReference?.id) return;
    
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
        analystInitials: localStorage.getItem('analystInitials') || '',
        apparatusType: 'ASTM D566',
        cupType: 'Standard metal cup',
        heatingRate: '2',
        draftConditions: 'None'
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
              droppingPointTemp: trial.value1,
              blockTemp: trial.value2,
              sampleAmount: trial.value3,
              apparatusType: trial.id1 || 'ASTM D566',
              heatingRate: trial.id2 || '2',
              analystInitials: trial.id3 || trial.entryId,
              observationNotes: this.extractFromComments('observation', trial.mainComments || ''),
              testNotes: this.extractFromComments('notes', trial.mainComments || '')
            });
          } else {
            this.form.patchValue({
              analystInitials: localStorage.getItem('analystInitials') || '',
              apparatusType: 'ASTM D566',
              cupType: 'Standard metal cup',
              heatingRate: '2',
              draftConditions: 'None'
            });
          }
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading existing Grease Dropping Point test data:', error);
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
    
    const result = this.droppingPointResult();
    if (result?.isValid) {
      parts.push(`correctedDropPoint:${result.result}C`);
      if (result.metadata?.temperatureDifference) {
        parts.push(`tempDiff:${result.metadata.temperatureDifference}C`);
      }
    }
    
    const cupType = this.form.get('cupType')?.value;
    if (cupType) parts.push(`cup:${cupType}`);
    
    const workedSample = this.form.get('workedSample')?.value;
    if (workedSample) parts.push('worked:true');
    
    const appearance = this.form.get('sampleAppearance')?.value;
    if (appearance) parts.push(`appearance:${appearance}`);
    
    const softening = this.form.get('firstSoftening')?.value;
    if (softening) parts.push(`softening:${softening}`);
    
    const dropAppearance = this.form.get('dropAppearance')?.value;
    if (dropAppearance) parts.push(`dropAppearance:${dropAppearance}`);
    
    const dropBehavior = this.form.get('dropBehavior')?.value;
    if (dropBehavior) parts.push(`dropBehavior:${dropBehavior}`);
    
    const pressure = this.form.get('barometricPressure')?.value;
    if (pressure) parts.push(`pressure:${pressure}`);
    
    const observation = this.form.get('observationNotes')?.value;
    if (observation) parts.push(`observation:${observation}`);
    
    const notes = this.form.get('testNotes')?.value;
    if (notes) parts.push(`notes:${notes}`);
    
    const main = this.form.get('mainComments')?.value;
    if (main) parts.push(`comments:${main}`);
    
    return parts.join(' | ');
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

    const result = this.droppingPointResult();
    if (!result?.isValid && !isPartialSave) {
      this.showSaveMessage('Please enter valid dropping point and block temperatures', 'error');
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
    const comments = this.combineComments();

    const trial = {
      sampleId: sampleInfo.sampleId,
      testId: sampleInfo.testReference.id,
      trialNumber: 1,
      value1: this.form.get('droppingPointTemp')?.value || null,
      value2: this.form.get('blockTemp')?.value || null,
      value3: this.form.get('sampleAmount')?.value || null,
      trialCalc: result?.result || null,
      id1: this.form.get('apparatusType')?.value,
      id2: this.form.get('heatingRate')?.value,
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
          ? 'Grease dropping point results partially saved'
          : 'Grease dropping point results saved successfully';
        this.showSaveMessage(message, 'success');
        const initials = this.form.get('analystInitials')?.value;
        if (initials) {
          localStorage.setItem('analystInitials', initials);
          this.enteredBy.set(initials);
        }
      },
      error: (error) => {
        console.error('Error saving grease dropping point results:', error);
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
    this.statusTransition.acceptResults(sampleInfo.sampleId, sampleInfo.testReference.id, newStatus, this.currentUser())
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
    this.statusTransition.rejectResults(sampleInfo.sampleId, sampleInfo.testReference.id, this.currentUser())
      .subscribe({
        next: (result) => {
          if (result.success) {
            this.currentStatus.set(result.newStatus);
            this.form.reset({
              apparatusType: 'ASTM D566',
              cupType: 'Standard metal cup',
              heatingRate: '2',
              draftConditions: 'None',
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
    this.statusTransition.deleteResults(sampleInfo.sampleId, sampleInfo.testReference.id, this.currentUser())
      .subscribe({
        next: (result) => {
          if (result.success) {
            this.form.reset({
              apparatusType: 'ASTM D566',
              cupType: 'Standard metal cup',
              heatingRate: '2',
              draftConditions: 'None',
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
    this.statusTransition.markMediaReady(sampleInfo.sampleId, sampleInfo.testReference.id, this.currentUser())
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
        apparatusType: 'ASTM D566',
        cupType: 'Standard metal cup',
        heatingRate: '2',
        draftConditions: 'None',
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

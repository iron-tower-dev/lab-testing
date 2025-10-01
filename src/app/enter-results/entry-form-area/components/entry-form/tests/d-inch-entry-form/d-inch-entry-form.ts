import { Component, OnInit, signal, computed, inject, input, effect } from '@angular/core';
import { SharedModule } from '../../../../../../shared-module';
import { TestReadingsService } from '../../../../../../shared/services/test-readings.service';
import { TestReading } from '../../../../../../shared/models/test-reading.model';
import { TestSampleInfo } from '../../../../../../../types';
import { StatusWorkflowService } from '../../../../../../shared/services/status-workflow.service';
import { StatusTransitionService } from '../../../../../../shared/services/status-transition.service';
import { ActionButtons } from '../../../../../components/action-buttons/action-buttons';
import { ActionContext, TestStatus } from '../../../../../../shared/types/status-workflow.types';

@Component({
  selector: 'app-d-inch-entry-form',
  standalone: true,
  imports: [SharedModule, ActionButtons],
  templateUrl: './d-inch-entry-form.html',
  styleUrls: ['./d-inch-entry-form.scss'],
})
export class DInchEntryForm implements OnInit {
  // Injected services
  private testReadingsService = inject(TestReadingsService);
  private statusWorkflowService = inject(StatusWorkflowService);
  private statusTransitionService = inject(StatusTransitionService);

  // Input signals for test sample info and context
  testSampleInfo = input<TestSampleInfo | null>(null);
  sampleData = input<any>(null);
  context = input<'sample' | 'batch'>('sample');

  // Status workflow signals
  currentStatus = signal<TestStatus>(TestStatus.AWAITING);
  enteredBy = signal<string>('');

  // Form input signals - Test Information
  testStandard = signal<string>('');
  equipmentId = signal<string>('');
  testTemperature = signal<number>(25);
  analystInitials = signal<string>('');

  // Trial measurements (4 trials)
  trial1Measurement = signal<number | null>(null);
  trial1Result = signal<number | null>(null);
  trial1Notes = signal<string>('');
  trial1Selected = signal<boolean>(false);

  trial2Measurement = signal<number | null>(null);
  trial2Result = signal<number | null>(null);
  trial2Notes = signal<string>('');
  trial2Selected = signal<boolean>(false);

  trial3Measurement = signal<number | null>(null);
  trial3Result = signal<number | null>(null);
  trial3Notes = signal<string>('');
  trial3Selected = signal<boolean>(false);

  trial4Measurement = signal<number | null>(null);
  trial4Result = signal<number | null>(null);
  trial4Notes = signal<string>('');
  trial4Selected = signal<boolean>(false);

  // Comments
  labComments = signal<string>('');
  overallNotes = signal<string>('');

  // UI state
  loading = signal<boolean>(false);
  saving = signal<boolean>(false);
  saveMessage = signal<string>('');
  showCalculationDetails = signal<boolean>(true);

  // Action context for status workflow
  actionContext = computed<ActionContext>(() => ({
    testId: this.testSampleInfo()?.testId || 0,
    sampleId: this.testSampleInfo()?.sampleId || 0,
    currentStatus: this.currentStatus(),
    userQualification: 'Q', // TODO: Get from user context
    enteredBy: this.enteredBy(),
    currentUser: 'current_user', // TODO: Get from user context
    mode: 'entry' as const,
    isPartialSave: false,
    isTraining: false
  }));

  // Test standard options
  testStandardOptions = [
    'ASTM D2266 - Wear Preventive Characteristics of Lubricating Grease',
    'ASTM D1831 - Roll Stability of Lubricating Grease',
    'Custom Method'
  ];

  // Computed signals for calculations
  validTrials = computed(() => {
    const trials = [];
    if (this.trial1Measurement() !== null) trials.push(this.trial1Result() || this.trial1Measurement());
    if (this.trial2Measurement() !== null) trials.push(this.trial2Result() || this.trial2Measurement());
    if (this.trial3Measurement() !== null) trials.push(this.trial3Result() || this.trial3Measurement());
    if (this.trial4Measurement() !== null) trials.push(this.trial4Result() || this.trial4Measurement());
    return trials.filter(t => t !== null) as number[];
  });

  selectedTrials = computed(() => {
    const selected = [];
    if (this.trial1Selected() && this.trial1Measurement() !== null) {
      selected.push({ num: 1, result: this.trial1Result() || this.trial1Measurement() });
    }
    if (this.trial2Selected() && this.trial2Measurement() !== null) {
      selected.push({ num: 2, result: this.trial2Result() || this.trial2Measurement() });
    }
    if (this.trial3Selected() && this.trial3Measurement() !== null) {
      selected.push({ num: 3, result: this.trial3Result() || this.trial3Measurement() });
    }
    if (this.trial4Selected() && this.trial4Measurement() !== null) {
      selected.push({ num: 4, result: this.trial4Result() || this.trial4Measurement() });
    }
    return selected;
  });

  averageResult = computed(() => {
    const trials = this.validTrials();
    if (trials.length === 0) return null;
    const sum = trials.reduce((acc, val) => acc + val!, 0);
    return Math.round((sum / trials.length) * 100) / 100;
  });

  resultVariation = computed(() => {
    const trials = this.validTrials();
    if (trials.length < 2) return null;
    const max = Math.max(...trials);
    const min = Math.min(...trials);
    return Math.round((max - min) * 100) / 100;
  });

  standardDeviation = computed(() => {
    const trials = this.validTrials();
    if (trials.length < 2) return null;
    const avg = this.averageResult()!;
    const variance = trials.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / trials.length;
    return Math.round(Math.sqrt(variance) * 100) / 100;
  });

  coefficientOfVariation = computed(() => {
    const stdDev = this.standardDeviation();
    const avg = this.averageResult();
    if (stdDev === null || avg === null || avg === 0) return null;
    return Math.round((stdDev / avg) * 100 * 100) / 100;
  });

  isVariationAcceptable = computed(() => {
    const variation = this.resultVariation();
    if (variation === null) return true;
    return variation <= 5; // Acceptable variation threshold
  });

  showQualityControlChecks = computed(() => {
    return !this.isVariationAcceptable() || this.validTrials().length < 2;
  });

  qualityControlMessage = computed(() => {
    if (this.validTrials().length < 2) {
      return 'At least 2 trial measurements are recommended for reliable results';
    }
    if (!this.isVariationAcceptable()) {
      return `High variation between trials (${this.resultVariation()} units) - review measurement technique`;
    }
    return '';
  });

  // Form validation
  isFormValid = computed(() => {
    return this.testStandard() !== '' &&
           this.equipmentId().trim() !== '' &&
           this.testTemperature() >= 15 && this.testTemperature() <= 35 &&
           this.analystInitials().trim() !== '' && this.analystInitials().length <= 5 &&
           this.validTrials().length > 0;
  });

  constructor() {
    // Effect to react to sample data changes
    effect(() => {
      const sample = this.sampleData();
      const info = this.testSampleInfo();
      if (sample && info) {
        this.loadCurrentStatus();
        this.loadData();
      }
    });
  }

  ngOnInit(): void {
    this.loadCurrentStatus();
    this.loadData();
  }

  private async loadCurrentStatus(): Promise<void> {
    const info = this.testSampleInfo();
    if (!info) return;

    try {
      const status = await this.statusWorkflowService
        .getCurrentStatus(info.sampleId, info.testId)
        .toPromise();
      
      if (status) {
        this.currentStatus.set(status.status || 'draft');
        this.enteredBy.set(status.enteredBy || '');
      }
    } catch (error) {
      console.error('Error loading status:', error);
    }
  }

  private async loadData(): Promise<void> {
    this.loading.set(true);
    try {
      const info = this.testSampleInfo();
      if (!info) {
        this.setDefaultValues();
        return;
      }

      const existingReading = await this.testReadingsService
        .getTestReading(info.sampleId, info.testId)
        .toPromise();

      if (existingReading) {
        this.loadFromExistingReading(existingReading);
      } else {
        this.setDefaultValues();
      }
    } catch (error) {
      console.error('Error loading D-inch data:', error);
      this.setDefaultValues();
    } finally {
      this.loading.set(false);
    }
  }

  private setDefaultValues(): void {
    const savedInitials = localStorage.getItem('analystInitials') || '';
    this.analystInitials.set(savedInitials);
    // Update enteredBy signal if we have saved initials
    if (savedInitials) {
      this.enteredBy.set(savedInitials);
    }
    this.testTemperature.set(25);
  }

  private loadFromExistingReading(reading: TestReading): void {
    this.trial1Measurement.set(reading.value1 || null);
    this.trial2Measurement.set(reading.value2 || null);
    this.trial3Measurement.set(reading.value3 || null);
    this.trial4Measurement.set(reading.trialCalc || null);
    
    this.equipmentId.set(reading.id1 || '');
    this.testStandard.set(reading.id2 || '');
    this.analystInitials.set(reading.id3 || '');
    // Update enteredBy signal to match loaded analyst initials
    if (reading.id3) {
      this.enteredBy.set(reading.id3);
    }
    
    if (reading.mainComments) {
      this.labComments.set(this.extractFromComments(reading.mainComments, 'lab'));
      this.overallNotes.set(this.extractFromComments(reading.mainComments, 'notes'));
    }

    // Calculate results for each trial
    this.calculateTrialResult(1);
    this.calculateTrialResult(2);
    this.calculateTrialResult(3);
    this.calculateTrialResult(4);
  }

  // Calculation method for individual trial
  calculateTrialResult(trialNum: number): void {
    let measurement: number | null = null;
    
    switch(trialNum) {
      case 1: measurement = this.trial1Measurement(); break;
      case 2: measurement = this.trial2Measurement(); break;
      case 3: measurement = this.trial3Measurement(); break;
      case 4: measurement = this.trial4Measurement(); break;
    }

    if (measurement !== null) {
      // For D-inch test, result equals measurement (or apply specific calculation if needed)
      const result = measurement;
      
      switch(trialNum) {
        case 1: this.trial1Result.set(result); break;
        case 2: this.trial2Result.set(result); break;
        case 3: this.trial3Result.set(result); break;
        case 4: this.trial4Result.set(result); break;
      }
    } else {
      // Clear result when measurement is null to avoid stale data
      switch(trialNum) {
        case 1: this.trial1Result.set(null); break;
        case 2: this.trial2Result.set(null); break;
        case 3: this.trial3Result.set(null); break;
        case 4: this.trial4Result.set(null); break;
      }
    }
  }

  // Selection helpers
  toggleAllTrials(): void {
    const allSelected = this.trial1Selected() && this.trial2Selected() && 
                       this.trial3Selected() && this.trial4Selected();
    const newValue = !allSelected;
    
    if (this.trial1Measurement() !== null) this.trial1Selected.set(newValue);
    if (this.trial2Measurement() !== null) this.trial2Selected.set(newValue);
    if (this.trial3Measurement() !== null) this.trial3Selected.set(newValue);
    if (this.trial4Measurement() !== null) this.trial4Selected.set(newValue);
  }

  clearSelectedTrials(): void {
    if (this.trial1Selected()) {
      this.trial1Measurement.set(null);
      this.trial1Result.set(null);
      this.trial1Notes.set('');
      this.trial1Selected.set(false);
    }
    if (this.trial2Selected()) {
      this.trial2Measurement.set(null);
      this.trial2Result.set(null);
      this.trial2Notes.set('');
      this.trial2Selected.set(false);
    }
    if (this.trial3Selected()) {
      this.trial3Measurement.set(null);
      this.trial3Result.set(null);
      this.trial3Notes.set('');
      this.trial3Selected.set(false);
    }
    if (this.trial4Selected()) {
      this.trial4Measurement.set(null);
      this.trial4Result.set(null);
      this.trial4Notes.set('');
      this.trial4Selected.set(false);
    }

    this.saveMessage.set('Selected trials cleared');
    setTimeout(() => this.saveMessage.set(''), 2000);
  }

  private async saveTestData(markComplete: boolean = false): Promise<void> {
    const info = this.testSampleInfo();
    if (!info) return;

    // Save analyst initials for future use
    const initials = this.analystInitials();
    if (initials) {
      localStorage.setItem('analystInitials', initials);
      // Update enteredBy signal so UI reflects the new user immediately
      this.enteredBy.set(initials);
    }

    const testReading: Partial<TestReading> = {
      sampleId: info.sampleId,
      testId: info.testId,
      value1: this.trial1Measurement(),
      value2: this.trial2Measurement(),
      value3: this.trial3Measurement(),
      trialCalc: this.trial4Measurement(),
      id1: this.equipmentId(),
      id2: this.testStandard(),
      id3: this.analystInitials(),
      mainComments: this.combineComments(),
      complete: markComplete
    };

    await this.testReadingsService.saveTestReading(testReading).toPromise();
  }

  async onAction(action: string): Promise<void> {
    const info = this.testSampleInfo();
    if (!info) return;

    this.saving.set(true);
    this.saveMessage.set('');

    try {
      switch (action) {
        case 'save':
          if (!this.isFormValid()) {
            this.saveMessage.set('Please fill in all required fields correctly');
            setTimeout(() => this.saveMessage.set(''), 3000);
            return;
          }
          await this.saveTestData(true);
          await this.statusTransitionService.transitionTo(
            info.sampleId,
            info.testId,
            'entered',
            this.analystInitials()
          ).toPromise();
          this.currentStatus.set('entered');
          this.saveMessage.set('Test data saved successfully!');
          break;

        case 'partial-save':
          await this.saveTestData(false);
          this.saveMessage.set('Progress saved successfully!');
          break;

        case 'accept':
          await this.statusTransitionService.transitionTo(
            info.sampleId,
            info.testId,
            'accepted',
            this.analystInitials()
          ).toPromise();
          this.currentStatus.set('accepted');
          this.saveMessage.set('Test results accepted!');
          break;

        case 'reject':
          const reason = prompt('Please provide a reason for rejection:');
          if (!reason) return;
          await this.statusTransitionService.transitionTo(
            info.sampleId,
            info.testId,
            'rejected',
            this.analystInitials(),
            reason
          ).toPromise();
          this.currentStatus.set('rejected');
          this.saveMessage.set('Test results rejected');
          break;

        case 'delete':
          if (!confirm('Are you sure you want to delete this test data?')) return;
          await this.testReadingsService.deleteTestReading(
            info.sampleId,
            info.testId
          ).toPromise();
          this.clearForm();
          this.currentStatus.set('draft');
          this.saveMessage.set('Test data deleted');
          break;

        case 'clear':
          this.clearForm();
          break;

        case 'media-ready':
          await this.statusTransitionService.transitionTo(
            info.sampleId,
            info.testId,
            'media-ready',
            this.analystInitials()
          ).toPromise();
          this.currentStatus.set('media-ready');
          this.saveMessage.set('Test marked as media ready!');
          break;
      }

      setTimeout(() => this.saveMessage.set(''), 3000);
    } catch (error) {
      console.error(`Error performing action ${action}:`, error);
      this.saveMessage.set('Error performing action. Please try again.');
      setTimeout(() => this.saveMessage.set(''), 5000);
    } finally {
      this.saving.set(false);
    }
  }

  private clearForm(): void {
    this.testStandard.set('');
    this.equipmentId.set('');
    this.testTemperature.set(25);
    this.trial1Measurement.set(null);
    this.trial1Result.set(null);
    this.trial1Notes.set('');
    this.trial1Selected.set(false);
    this.trial2Measurement.set(null);
    this.trial2Result.set(null);
    this.trial2Notes.set('');
    this.trial2Selected.set(false);
    this.trial3Measurement.set(null);
    this.trial3Result.set(null);
    this.trial3Notes.set('');
    this.trial3Selected.set(false);
    this.trial4Measurement.set(null);
    this.trial4Result.set(null);
    this.trial4Notes.set('');
    this.trial4Selected.set(false);
    this.labComments.set('');
    this.overallNotes.set('');
    // Keep analyst initials
    
    this.saveMessage.set('Form cleared');
    setTimeout(() => this.saveMessage.set(''), 2000);
  }

  private extractFromComments(comments: string, section: string): string {
    if (!comments) return '';
    
    const regex = new RegExp(`${section}:(.+?)(?:\\||$)`, 'i');
    const match = comments.match(regex);
    return match ? match[1].trim() : '';
  }

  private combineComments(): string {
    const parts = [];
    
    const temp = this.testTemperature();
    if (temp) parts.push(`temperature:${temp}°C`);
    
    const t1Notes = this.trial1Notes();
    if (t1Notes) parts.push(`trial1:${t1Notes}`);
    
    const t2Notes = this.trial2Notes();
    if (t2Notes) parts.push(`trial2:${t2Notes}`);
    
    const t3Notes = this.trial3Notes();
    if (t3Notes) parts.push(`trial3:${t3Notes}`);
    
    const t4Notes = this.trial4Notes();
    if (t4Notes) parts.push(`trial4:${t4Notes}`);
    
    const lab = this.labComments();
    if (lab) parts.push(`lab:${lab}`);
    
    const notes = this.overallNotes();
    if (notes) parts.push(`notes:${notes}`);
    
    return parts.join(' | ');
  }
}

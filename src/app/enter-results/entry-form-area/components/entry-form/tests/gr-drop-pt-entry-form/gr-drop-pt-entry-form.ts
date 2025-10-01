import { Component, OnInit, inject, signal, computed, input, effect } from '@angular/core';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { TestReadingsService } from '../../../../../../core/services/test-readings.service';
import { GreaseCalculationService } from '../../../../../../shared/services/grease-calculation.service';
import { TestReadingRecord } from '../../../../../../core/models/test-reading.model';
import { SharedModule } from '../../../../../../shared-module';
import { SampleWithTestInfo } from '../../../../../enter-results.types';

@Component({
  selector: 'app-gr-drop-pt-entry-form',
  standalone: true,
  templateUrl: './gr-drop-pt-entry-form.html',
  styleUrl: './gr-drop-pt-entry-form.css',
  imports: [
    SharedModule
  ]
})
export class GrDropPtEntryForm implements OnInit {
  private fb = inject(FormBuilder);
  private testReadingsService = inject(TestReadingsService);
  private greaseCalc = inject(GreaseCalculationService);

  // Input signals
  sampleData = input<SampleWithTestInfo | null>(null);

  // State signals
  loading = signal(false);
  saving = signal(false);
  saveMessage = signal<{ text: string; type: 'success' | 'error' } | null>(null);
  showCalculationDetails = signal(true);

  // Form and sample data
  form!: FormGroup;
  existingData = signal<TestReadingRecord | null>(null);

  // Computed signals derived from sampleData
  sampleId = computed(() => {
    const data = this.sampleData();
    return data?.sampleId?.toString() || '';
  });

  testTypeId = computed(() => {
    const data = this.sampleData();
    return data?.testReference?.id?.toString() || '';
  });
  
  constructor() {
    // Watch for changes in sampleData and reload existing data when it changes
    effect(() => {
      const data = this.sampleData();
      if (data?.sampleId && data?.testReference?.id) {
        this.loadExistingData();
      }
    });
  }

  ngOnInit(): void {
    this.initializeForm();
    this.loadExistingData();
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


  private async loadExistingData(): Promise<void> {
    // TODO: Get sampleId and testTypeId from parent component or service
    const sampleId = this.sampleId();
    const testTypeId = this.testTypeId();
    
    if (!sampleId || !testTypeId) {
      // Set default values
      this.form.patchValue({
        analystInitials: localStorage.getItem('analystInitials') || '',
        apparatusType: 'ASTM D566',
        cupType: 'Standard metal cup',
        heatingRate: '2',
        draftConditions: 'None'
      });
      return;
    }

    this.loading.set(true);
    
    try {
      const existingReading = await this.testReadingsService.getTestReading(sampleId, testTypeId);
      
      if (existingReading) {
        this.existingData.set(existingReading);
        this.form.patchValue({
          droppingPointTemp: existingReading.value1,
          blockTemp: existingReading.value2,
          sampleAmount: existingReading.value3,
          apparatusType: existingReading.id1 || 'ASTM D566',
          heatingRate: existingReading.id2 || '2',
          analystInitials: existingReading.id3,
          observationNotes: this.extractFromComments('observation', existingReading.mainComments || ''),
          testNotes: this.extractFromComments('notes', existingReading.mainComments || '')
        });
      } else {
        // Set default values
        this.form.patchValue({
          analystInitials: localStorage.getItem('analystInitials') || '',
          apparatusType: 'ASTM D566',
          cupType: 'Standard metal cup',
          heatingRate: '2',
          draftConditions: 'None'
        });
      }
    } catch (error) {
      console.error('Error loading existing Grease Dropping Point test data:', error);
      this.showSaveMessage('Error loading existing data', 'error');
    } finally {
      this.loading.set(false);
    }
  }

  private createTestReading(): TestReadingRecord {
    const result = this.droppingPointResult();
    
    return {
      sampleId: this.sampleId(),
      testTypeId: this.testTypeId(),
      value1: this.form.get('droppingPointTemp')?.value || null,
      value2: this.form.get('blockTemp')?.value || null,
      value3: this.form.get('sampleAmount')?.value || null,
      trialCalc: result?.result || null,
      id1: this.form.get('apparatusType')?.value,
      id2: this.form.get('heatingRate')?.value,
      id3: this.form.get('analystInitials')?.value,
      mainComments: this.combineComments(),
      trialComplete: true,
      status: 'E', // Entry status
      entryId: this.form.get('analystInitials')?.value || ''
    };
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

  async onSave(): Promise<void> {
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      this.showSaveMessage('Please correct form errors before saving', 'error');
      return;
    }

    const result = this.droppingPointResult();
    if (!result?.isValid) {
      this.showSaveMessage('Please enter valid dropping point and block temperatures', 'error');
      return;
    }

    this.saving.set(true);
    
    try {
      const testReading = this.createTestReading();
      await this.testReadingsService.saveTestReading(testReading);
      
      // Save analyst initials for future use
      const initials = this.form.get('analystInitials')?.value;
      if (initials) {
        localStorage.setItem('analystInitials', initials);
      }
      
      this.showSaveMessage('Grease dropping point test results saved successfully', 'success');
      
    } catch (error) {
      console.error('Error saving grease dropping point test results:', error);
      this.showSaveMessage('Error saving test results. Please try again.', 'error');
    } finally {
      this.saving.set(false);
    }
  }

  onClear(): void {
    if (confirm('Are you sure you want to clear all entered data? This cannot be undone.')) {
      this.form.reset({
        apparatusType: 'ASTM D566',
        cupType: 'Standard metal cup',
        heatingRate: '2',
        draftConditions: 'None',
        analystInitials: localStorage.getItem('analystInitials') || ''
      });
      this.showSaveMessage('Form cleared', 'success');
    }
  }

  toggleCalculationDetails(): void {
    this.showCalculationDetails.update(show => !show);
  }

  private showSaveMessage(text: string, type: 'success' | 'error'): void {
    this.saveMessage.set({ text, type });
    
    // Auto-hide success messages after 3 seconds
    if (type === 'success') {
      setTimeout(() => {
        this.saveMessage.set(null);
      }, 3000);
    }
  }
}

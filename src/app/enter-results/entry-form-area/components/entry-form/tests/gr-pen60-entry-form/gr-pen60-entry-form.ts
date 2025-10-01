import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { TestReadingsService } from '../../../../../../core/services/test-readings.service';
import { GreaseCalculationService } from '../../../../../../shared/services/grease-calculation.service';
import { TestReadingRecord } from '../../../../../../core/models/test-reading.model';
import { SharedModule } from '../../../../../../shared-module';

@Component({
  selector: 'app-gr-pen60-entry-form',
  templateUrl: './gr-pen60-entry-form.html',
  styleUrl: './gr-pen60-entry-form.css',
  standalone: true,
  imports: [
    SharedModule
  ]
})
export class GrPen60EntryForm implements OnInit {
  private fb = inject(FormBuilder);
  private testReadingsService = inject(TestReadingsService);
  private greaseCalc = inject(GreaseCalculationService);

  // State signals
  loading = signal(false);
  saving = signal(false);
  saveMessage = signal<{ text: string; type: 'success' | 'error' } | null>(null);
  showCalculationDetails = signal(true);

  // Form and sample data
  form!: FormGroup;
  sampleId = signal<string>('');
  testTypeId = signal<string>('');
  existingData = signal<TestReadingRecord | null>(null);

  ngOnInit(): void {
    this.initializeForm();
    this.loadExistingData();
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

  private async loadExistingData(): Promise<void> {
    // TODO: Get sampleId and testTypeId from parent component or service
    const sampleId = this.sampleId();
    const testTypeId = this.testTypeId();
    
    if (!sampleId || !testTypeId) {
      // Set default values
      this.form.patchValue({
        testTemperature: '25',
        penetrationTime: '5',
        workedSample: true,
        analystInitials: localStorage.getItem('analystInitials') || ''
      });
      return;
    }

    this.loading.set(true);
    
    try {
      const existingReading = await this.testReadingsService.getTestReading(sampleId, testTypeId);
      
      if (existingReading) {
        this.existingData.set(existingReading);
        this.form.patchValue({
          cone1: existingReading.value1,
          cone2: existingReading.value2,
          cone3: existingReading.value3,
          testTemperature: existingReading.id1 || '25',
          penetrationTime: existingReading.id2 || '5',
          analystInitials: existingReading.id3,
          workedSample: this.extractFromComments('worked', existingReading.mainComments || '') === 'true',
          penetrometerId: this.extractFromComments('equip', existingReading.mainComments || ''),
          lastCalibrationDate: this.extractFromComments('calibDate', existingReading.mainComments || ''),
          sampleAppearance: this.extractFromComments('appearance', existingReading.mainComments || ''),
          testNotes: this.extractFromComments('notes', existingReading.mainComments || ''),
          mainComments: this.extractFromComments('comments', existingReading.mainComments || '')
        });
      } else {
        // Set default values
        this.form.patchValue({
          testTemperature: '25',
          penetrationTime: '5',
          workedSample: true,
          analystInitials: localStorage.getItem('analystInitials') || ''
        });
      }
    } catch (error) {
      console.error('Error loading existing Grease Penetration test data:', error);
      this.showSaveMessage('Error loading existing data', 'error');
    } finally {
      this.loading.set(false);
    }
  }

  private createTestReading(): TestReadingRecord {
    const result = this.penetrationResult();
    
    return {
      sampleId: this.sampleId(),
      testTypeId: this.testTypeId(),
      value1: this.form.get('cone1')?.value || null,
      value2: this.form.get('cone2')?.value || null,
      value3: this.form.get('cone3')?.value || null,
      trialCalc: result?.result || null,
      id1: this.form.get('testTemperature')?.value,
      id2: this.form.get('penetrationTime')?.value,
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

  async onSave(): Promise<void> {
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      this.showSaveMessage('Please correct form errors before saving', 'error');
      return;
    }

    if (this.validReadings().length !== 3) {
      this.showSaveMessage('All three cone readings are required', 'error');
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
      
      this.showSaveMessage('Grease penetration test results saved successfully', 'success');
      
    } catch (error) {
      console.error('Error saving grease penetration test results:', error);
      this.showSaveMessage('Error saving test results. Please try again.', 'error');
    } finally {
      this.saving.set(false);
    }
  }

  onClear(): void {
    if (confirm('Are you sure you want to clear all entered data? This cannot be undone.')) {
      this.form.reset({
        testTemperature: '25',
        penetrationTime: '5',
        workedSample: true,
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

import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { TestReadingsService } from '../../../../../../core/services/test-readings.service';
import { TestReadingRecord } from '../../../../../../core/models/test-reading.model';
import { SharedModule } from '../../../../../../shared-module';

@Component({
  selector: 'app-tbn-entry-form',
  standalone: true,
  templateUrl: './tbn-entry-form.html',
  styleUrl: './tbn-entry-form.css',
  imports: [
    SharedModule
  ]
})
export class TbnEntryForm implements OnInit {
  private fb = inject(FormBuilder);
  private testReadingsService = inject(TestReadingsService);

  loading = signal(false);
  saving = signal(false);
  saveMessage = signal<{ text: string; type: 'success' | 'error' } | null>(null);
  showCalculationDetails = signal(true);

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
      // Trial results
      trial1Result: ['', [Validators.required, Validators.min(0), Validators.max(50)]],
      trial2Result: ['', [Validators.required, Validators.min(0), Validators.max(50)]],
      trial3Result: ['', [Validators.min(0), Validators.max(50)]],
      trial4Result: ['', [Validators.min(0), Validators.max(50)]],
      
      // Test parameters
      sampleWeight: ['', [Validators.required, Validators.min(0.1), Validators.max(10)]],
      titrantNormality: ['0.1000', [Validators.required, Validators.min(0.0001), Validators.max(1.0000)]],
      
      // Equipment and conditions
      temperatureEquipmentId: [''],
      titrationEquipmentId: [''],
      testTemperature: ['25', [Validators.min(20), Validators.max(30)]],
      analystInitials: ['', [Validators.required, Validators.maxLength(5)]],
      
      // Titration details
      solventSystem: ['Perchloric acid in glacial acetic acid'],
      indicator: ['Crystal violet'],
      
      // Comments
      testNotes: [''],
      mainComments: ['']
    });
  }

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
    return Math.round((results.reduce((sum, val) => sum + val, 0) / results.length) * 100) / 100;
  });

  tbnResult = computed(() => {
    const avg = this.averageResult();
    const sampleWeight = parseFloat(this.form?.get('sampleWeight')?.value);
    const titrantNormality = parseFloat(this.form?.get('titrantNormality')?.value);
    
    if (avg > 0 && sampleWeight > 0 && titrantNormality > 0) {
      const tbn = (avg * titrantNormality * 56.1) / sampleWeight;
      return Math.round(tbn * 100) / 100;
    }
    return 0;
  });

  resultVariation = computed(() => {
    const results = this.validResults();
    if (results.length < 2) return 0;
    const max = Math.max(...results);
    const min = Math.min(...results);
    return Math.round((max - min) * 100) / 100;
  });

  isVariationAcceptable = computed(() => {
    return this.resultVariation() <= 0.2;
  });

  showQualityControlChecks = computed(() => {
    return !this.isVariationAcceptable() || this.tbnResult() > 15 || this.averageResult() > 25;
  });

  qualityControlMessage = computed(() => {
    if (!this.isVariationAcceptable()) {
      return 'High variation between trials - review titration technique';
    }
    if (this.tbnResult() > 15) {
      return 'High TBN value - verify sample type and calculations';
    }
    if (this.averageResult() > 25) {
      return 'High titrant volume - check normality and sample weight';
    }
    return '';
  });

  private async loadExistingData(): Promise<void> {
    const sampleId = this.sampleId();
    const testTypeId = this.testTypeId();
    
    if (!sampleId || !testTypeId) {
      this.form.patchValue({
        analystInitials: localStorage.getItem('analystInitials') || '',
        titrantNormality: '0.1000',
        testTemperature: '25'
      });
      return;
    }

    this.loading.set(true);
    try {
      const existingReading = await this.testReadingsService.getTestReading(sampleId, testTypeId);
      if (existingReading) {
        this.existingData.set(existingReading);
        this.form.patchValue({
          trial1Result: existingReading.value1,
          trial2Result: existingReading.value2,
          trial3Result: existingReading.value3,
          trial4Result: existingReading.trialCalc,
          sampleWeight: existingReading.id1,
          titrantNormality: existingReading.id2 || '0.1000',
          analystInitials: existingReading.id3,
          testNotes: this.extractFromComments('notes', existingReading.mainComments || '')
        });
      } else {
        this.form.patchValue({
          analystInitials: localStorage.getItem('analystInitials') || '',
          titrantNormality: '0.1000',
          testTemperature: '25'
        });
      }
    } catch (error) {
      console.error('Error loading TBN data:', error);
      this.showSaveMessage('Error loading data', 'error');
    } finally {
      this.loading.set(false);
    }
  }

  private createTestReading(): TestReadingRecord {
    const tbn = this.tbnResult();
    return {
      sampleId: this.sampleId(),
      testTypeId: this.testTypeId(),
      value1: this.form.get('trial1Result')?.value || null,
      value2: this.form.get('trial2Result')?.value || null,
      value3: this.form.get('trial3Result')?.value || null,
      trialCalc: this.form.get('trial4Result')?.value || (tbn > 0 ? tbn : null),
      id1: this.form.get('sampleWeight')?.value,
      id2: this.form.get('titrantNormality')?.value,
      id3: this.form.get('analystInitials')?.value,
      mainComments: this.combineComments(),
      trialComplete: true,
      status: 'E',
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
    
    const tempEquip = this.form.get('temperatureEquipmentId')?.value;
    if (tempEquip) parts.push(`tempEquip:${tempEquip}`);
    
    const titrationEquip = this.form.get('titrationEquipmentId')?.value;
    if (titrationEquip) parts.push(`titrationEquip:${titrationEquip}`);
    
    const solvent = this.form.get('solventSystem')?.value;
    if (solvent) parts.push(`solvent:${solvent}`);
    
    const indicator = this.form.get('indicator')?.value;
    if (indicator) parts.push(`indicator:${indicator}`);
    
    const notes = this.form.get('testNotes')?.value;
    if (notes) parts.push(`notes:${notes}`);
    
    const main = this.form.get('mainComments')?.value;
    if (main) parts.push(`comments:${main}`);
    
    return parts.join(' | ');
  }

  async onSave(): Promise<void> {
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      this.showSaveMessage('Please correct form errors', 'error');
      return;
    }

    this.saving.set(true);
    try {
      const testReading = this.createTestReading();
      await this.testReadingsService.saveTestReading(testReading);
      const initials = this.form.get('analystInitials')?.value;
      if (initials) localStorage.setItem('analystInitials', initials);
      this.showSaveMessage('TBN results saved successfully', 'success');
    } catch (error) {
      console.error('Error saving TBN results:', error);
      this.showSaveMessage('Error saving results', 'error');
    } finally {
      this.saving.set(false);
    }
  }

  onClear(): void {
    if (confirm('Clear all data?')) {
      this.form.reset({
        titrantNormality: '0.1000',
        testTemperature: '25',
        analystInitials: localStorage.getItem('analystInitials') || ''
      });
      this.showSaveMessage('Form cleared', 'success');
    }
  }

  getFieldError(field: string): string {
    const control = this.form.get(field);
    if (control?.hasError('required')) return 'Required';
    if (control?.hasError('min')) return 'Value too low';
    if (control?.hasError('max')) return 'Value too high';
    return '';
  }

  private showSaveMessage(text: string, type: 'success' | 'error'): void {
    this.saveMessage.set({ text, type });
    if (type === 'success') {
      setTimeout(() => this.saveMessage.set(null), 3000);
    }
  }
}

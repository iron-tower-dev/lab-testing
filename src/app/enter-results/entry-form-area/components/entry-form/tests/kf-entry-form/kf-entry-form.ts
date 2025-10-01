import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { TestReadingsService } from '../../../../../../core/services/test-readings.service';
import { TestReadingRecord } from '../../../../../../core/models/test-reading.model';
import { SharedModule } from '../../../../../../shared-module';

@Component({
  selector: 'app-kf-entry-form',
  standalone: true,
  templateUrl: './kf-entry-form.html',
  styleUrl: './kf-entry-form.css',
  imports: [
    SharedModule
  ]
})
export class KfEntryForm implements OnInit {
  private fb = inject(FormBuilder);
  private testReadingsService = inject(TestReadingsService);

  // State signals
  loading = signal(false);
  saving = signal(false);
  saveMessage = signal<{ text: string; type: 'success' | 'error' } | null>(null);
  showFileUpload = signal(false);
  selectedFile = signal<File | null>(null);

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

  private async loadExistingData(): Promise<void> {
    // TODO: Get sampleId and testTypeId from parent component or service
    const sampleId = this.sampleId();
    const testTypeId = this.testTypeId();
    
    if (!sampleId || !testTypeId) {
      // Set default values
      this.form.patchValue({
        analystInitials: localStorage.getItem('analystInitials') || '',
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
          analystInitials: existingReading.id3,
          testTemperature: existingReading.id1 || '25',
          sampleVolume: existingReading.id2,
          testNotes: this.extractFromComments('notes', existingReading.mainComments || '')
        });
      } else {
        // Set default values
        this.form.patchValue({
          analystInitials: localStorage.getItem('analystInitials') || '',
          testTemperature: '25'
        });
      }
    } catch (error) {
      console.error('Error loading existing KF test data:', error);
      this.showSaveMessage('Error loading existing data', 'error');
    } finally {
      this.loading.set(false);
    }
  }

  private createTestReading(): TestReadingRecord {
    const average = this.averageResult();
    
    return {
      sampleId: this.sampleId(),
      testTypeId: this.testTypeId(),
      value1: this.form.get('trial1Result')?.value || null,
      value2: this.form.get('trial2Result')?.value || null,
      value3: this.form.get('trial3Result')?.value || null,
      trialCalc: this.form.get('trial4Result')?.value || (average > 0 ? average : null),
      id1: this.form.get('testTemperature')?.value,
      id2: this.form.get('sampleVolume')?.value?.toString(),
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
    
    const fileName = this.form.get('uploadedFileName')?.value;
    if (fileName) parts.push(`file:${fileName}`);
    
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

    if (this.validResults().length < 2) {
      this.showSaveMessage('At least two trial results are required', 'error');
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
      
      this.showSaveMessage('KF test results saved successfully', 'success');
      
    } catch (error) {
      console.error('Error saving KF test results:', error);
      this.showSaveMessage('Error saving test results. Please try again.', 'error');
    } finally {
      this.saving.set(false);
    }
  }

  onClear(): void {
    if (confirm('Are you sure you want to clear all entered data? This cannot be undone.')) {
      this.form.reset({
        testTemperature: '25',
        analystInitials: localStorage.getItem('analystInitials') || ''
      });
      this.selectedFile.set(null);
      this.showSaveMessage('Form cleared', 'success');
    }
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


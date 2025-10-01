import { Component, OnInit, input, signal, computed, inject, effect } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SharedModule } from '../../../../../../shared-module';
import { SampleWithTestInfo } from '../../../../../enter-results.types';
import { FlashPointCalculationService } from '../../../../../../shared/services/flash-point-calculation.service';
import { TestReadingsService } from '../../../../../../shared/services/test-readings.service';

/**
 * Flash Point Entry Form Component
 * 
 * Modernized with Angular signals, FlashPointCalculationService, and data persistence.
 * Follows the Vis40/TAN pattern for consistency.
 */
@Component({
  standalone: true,
  selector: 'app-flash-pt-entry-form',
  templateUrl: './flash-pt-entry-form.html',
  styleUrls: ['./flash-pt-entry-form.css'],
  imports: [SharedModule]
})
export class FlashPtEntryForm implements OnInit {
  private fb = inject(FormBuilder);
  private flashCalc = inject(FlashPointCalculationService);
  private testReadingsService = inject(TestReadingsService);
  
  // Inputs
  sampleData = input<SampleWithTestInfo | null>(null);
  errorMessage = input<string | null>(null);
  
  // Form
  form!: FormGroup;
  
  // State signals
  isLoading = signal(false);
  isSaving = signal(false);
  saveMessage = signal<string | null>(null);
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
   * Save Flash Point results to database
   */
  saveResults(): void {
    if (!this.form.valid) {
      this.saveMessage.set('Please fill in all required fields');
      setTimeout(() => this.saveMessage.set(null), 3000);
      return;
    }
    
    const result = this.flashPointResult();
    if (!result || !result.isValid) {
      this.saveMessage.set('Invalid calculation - please check your inputs');
      setTimeout(() => this.saveMessage.set(null), 3000);
      return;
    }
    
    const sampleInfo = this.sampleData();
    if (!sampleInfo?.sampleId || !sampleInfo?.testReference?.id) {
      this.saveMessage.set('No sample selected');
      setTimeout(() => this.saveMessage.set(null), 3000);
      return;
    }
    
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
      trialComplete: true,
      status: 'E',
      entryId: this.form.get('analystInitials')?.value,
      entryDate: Date.now(),
      mainComments: comments
    };
    
    this.testReadingsService.bulkSaveTrials([trial]).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.saveMessage.set('Flash Point results saved successfully');
        
        // Save analyst initials for future use
        const initials = this.form.get('analystInitials')?.value;
        if (initials) {
          localStorage.setItem('analystInitials', initials);
        }
        
        setTimeout(() => this.saveMessage.set(null), 3000);
      },
      error: (error) => {
        console.error('Failed to save Flash Point results:', error);
        this.isSaving.set(false);
        this.saveMessage.set('Failed to save results. Please try again.');
        setTimeout(() => this.saveMessage.set(null), 5000);
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
   * Clear all form data
   */
  clearForm(): void {
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


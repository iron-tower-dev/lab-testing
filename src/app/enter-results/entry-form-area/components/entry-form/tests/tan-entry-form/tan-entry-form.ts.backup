import { Component, OnInit, input, signal, computed, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SharedModule } from '../../../../../../shared-module';
import { SampleWithTestInfo } from '../../../../../enter-results.types';
import { TANCalculationService } from '../../../../../../shared/services/tan-calculation.service';
import { TestReadingsService } from '../../../../../../shared/services/test-readings.service';
import { CalculationResult } from '../../../../../../shared/services/calculation.service';

/**
 * TAN (Total Acid Number) Entry Form Component
 * 
 * Modernized with Angular signals, TANCalculationService, and data persistence.
 * Follows the Vis40 pattern for consistency.
 */
@Component({
  standalone: true,
  selector: 'app-tan-entry-form',
  templateUrl: './tan-entry-form.html',
  styleUrls: ['./tan-entry-form.css'],
  imports: [SharedModule]
})
export class TanEntryForm implements OnInit {
  private fb = inject(FormBuilder);
  private tanCalc = inject(TANCalculationService);
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
  
  // UI state
  showCalculationDetails = signal(true);
  
  ngOnInit(): void {
    this.initializeForm();
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
   * Save TAN results to database
   */
  saveResults(): void {
    if (!this.form.valid) {
      this.saveMessage.set('Please fill in all required fields');
      setTimeout(() => this.saveMessage.set(null), 3000);
      return;
    }
    
    const result = this.tanResult();
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
      value1: this.form.get('initialBuret')?.value, // Initial buret
      value2: this.form.get('finalBuret')?.value, // Final buret
      value3: result.result, // TAN result
      id1: this.form.get('testMethod')?.value, // Test method
      id2: this.form.get('sampleWeight')?.value?.toString(), // Sample weight
      id3: this.form.get('kohNormality')?.value?.toString(), // KOH normality
      trialCalc: this.form.get('temperature')?.value, // Temperature
      trialComplete: true,
      status: 'E',
      entryId: this.form.get('analystInitials')?.value,
      entryDate: Date.now(),
      mainComments: comments
    };
    
    this.testReadingsService.bulkSaveTrials([trial]).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.saveMessage.set('TAN results saved successfully');
        
        // Save analyst initials for future use
        const initials = this.form.get('analystInitials')?.value;
        if (initials) {
          localStorage.setItem('analystInitials', initials);
        }
        
        setTimeout(() => this.saveMessage.set(null), 3000);
      },
      error: (error) => {
        console.error('Failed to save TAN results:', error);
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


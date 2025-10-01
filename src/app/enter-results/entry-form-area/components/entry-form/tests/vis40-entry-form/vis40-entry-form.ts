import { Component, OnInit, input, signal, computed, inject, effect } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { SharedModule } from '../../../../../../shared-module';
import { SampleWithTestInfo } from '../../../../../enter-results.types';
import { ViscosityCalculationService, RepeatabilityResult } from '../../../../../../shared/services/viscosity-calculation.service';
import { EquipmentService, TubeOption } from '../../../../../../shared/services/equipment.service';
import { TestReadingsService } from '../../../../../../shared/services/test-readings.service';

interface ViscosityTrial {
  trialNumber: number;
  selected: boolean;
  stopwatchTime: string;
  tubeCalibration: string;
  calculatedResult: number;
}

@Component({
  standalone: true,
  selector: 'app-vis40-entry-form',
  templateUrl: './vis40-entry-form.html',
  styleUrls: ['./vis40-entry-form.css'],
  imports: [SharedModule]
})
export class Vis40EntryForm implements OnInit {
  private fb = inject(FormBuilder);
  private viscosityCalc = inject(ViscosityCalculationService);
  private equipmentService = inject(EquipmentService);
  private testReadingsService = inject(TestReadingsService);
  
  sampleData = input<SampleWithTestInfo | null>(null);
  errorMessage = input<string | null>(null);
  
  form!: FormGroup;
  isLoading = signal(false);
  isSaving = signal(false);
  saveMessage = signal<string | null>(null);
  tubeOptions = signal<TubeOption[]>([{ value: '', label: 'Select Tube' }]);
  
  // Repeatability result signal
  repeatabilityResult = signal<RepeatabilityResult | null>(null);
  
  // Computed: get selected trial results for repeatability check
  selectedResults = computed(() => {
    const trials = this.trialsArray?.value || [];
    return trials
      .filter((t: ViscosityTrial) => t.selected && t.calculatedResult > 0)
      .map((t: ViscosityTrial) => t.calculatedResult);
  });
  
  ngOnInit(): void {
    this.initializeForm();
    this.loadTubeCalibrations();
    this.loadExistingTrials();
  }
  
  private initializeForm(): void {
    this.form = this.fb.group({
      trials: this.fb.array([
        this.createTrialGroup(1),
        this.createTrialGroup(2),
        this.createTrialGroup(3),
        this.createTrialGroup(4)
      ])
    });
  }
  
  /**
   * Load tube calibrations from M&TE equipment service
   */
  private loadTubeCalibrations(): void {
    const sampleInfo = this.sampleData();
    if (!sampleInfo?.testReference?.id) {
      console.warn('No test ID available for equipment lookup');
      return;
    }
    
    this.isLoading.set(true);
    
    this.equipmentService.getViscosityTubesForTest(sampleInfo.testReference.id)
      .subscribe({
        next: (options) => {
          this.tubeOptions.set(options);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Failed to load tube calibrations:', error);
          this.isLoading.set(false);
          // Fallback to empty list with just the placeholder
          this.tubeOptions.set([{ value: '', label: 'Select Tube' }]);
        }
      });
  }
  
  private createTrialGroup(trialNumber: number): FormGroup {
    return this.fb.group({
      trialNumber: [trialNumber],
      selected: [false],
      stopwatchTime: ['', Validators.required],
      tubeCalibration: ['', Validators.required],
      calculatedResult: [{ value: 0, disabled: true }]
    });
  }
  
  get trialsArray(): FormArray {
    return this.form.get('trials') as FormArray;
  }
  
  getTrialGroup(index: number): FormGroup {
    return this.trialsArray.at(index) as FormGroup;
  }
  
  /**
   * Handle stopwatch time blur event
   * Parses MM.SS.HH format and triggers calculation
   */
  onStopwatchTimeBlur(trialIndex: number): void {
    const trial = this.getTrialGroup(trialIndex);
    const timeInput = trial.get('stopwatchTime')?.value;
    
    if (!timeInput) {
      return;
    }
    
    // Parse time format
    const parsed = this.viscosityCalc.parseTimeFormat(timeInput);
    
    // Update field with parsed seconds
    if (parsed.isValid) {
      trial.patchValue({ stopwatchTime: parsed.seconds });
    }
    
    // Trigger calculation
    this.calculateResult(trialIndex);
  }
  
  /**
   * Handle tube calibration change
   * Triggers calculation
   */
  onTubeChange(trialIndex: number): void {
    this.calculateResult(trialIndex);
  }
  
  /**
   * Calculate viscosity result for a trial
   */
  private calculateResult(trialIndex: number): void {
    const trial = this.getTrialGroup(trialIndex);
    const stopwatchTime = trial.get('stopwatchTime')?.value;
    const tubeCalibration = trial.get('tubeCalibration')?.value;
    
    if (!stopwatchTime || !tubeCalibration) {
      return;
    }
    
    // Calculate result
    const result = this.viscosityCalc.calculateViscosity(
      stopwatchTime,
      tubeCalibration
    );
    
    // Update calculated result
    trial.patchValue({ calculatedResult: result.result });
    
    // Check repeatability if trial is selected
    if (trial.get('selected')?.value) {
      this.checkRepeatability();
    }
  }
  
  /**
   * Handle trial selection checkbox change
   */
  onTrialSelectionChange(): void {
    this.checkRepeatability();
  }
  
  /**
   * Check repeatability of selected trials
   */
  private checkRepeatability(): void {
    const results = this.selectedResults();
    
    if (results.length < 2) {
      this.repeatabilityResult.set(null);
      return;
    }
    
    const check = this.viscosityCalc.checkRepeatability(results, 0.35);
    this.repeatabilityResult.set(check);
  }
  
  /**
   * Clear all trial data
   */
  clearForm(): void {
    if (confirm('Are you sure you want to clear all trial data?')) {
      this.form.reset();
      this.trialsArray.controls.forEach((control, index) => {
        control.patchValue({
          trialNumber: index + 1,
          selected: false,
          calculatedResult: 0
        });
      });
      this.repeatabilityResult.set(null);
    }
  }
  
  /**
   * Load existing trials from database
   */
  private loadExistingTrials(): void {
    const sampleInfo = this.sampleData();
    if (!sampleInfo?.sampleId || !sampleInfo?.testReference?.id) {
      return;
    }
    
    this.isLoading.set(true);
    
    this.testReadingsService.loadTrials(sampleInfo.sampleId, sampleInfo.testReference.id)
      .subscribe({
        next: (response) => {
          if (response.success && response.data && response.data.length > 0) {
            // Populate form with existing data
            response.data.forEach((reading, index) => {
              if (index < this.trialsArray.length) {
                const trial = this.getTrialGroup(index);
                trial.patchValue({
                  trialNumber: reading.trialNumber,
                  selected: reading.trialComplete || false,
                  stopwatchTime: reading.value1 || '',
                  tubeCalibration: reading.id2 || '',
                  calculatedResult: reading.value3 || 0
                });
              }
            });
            
            // Recalculate repeatability
            this.checkRepeatability();
          }
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Failed to load existing trials:', error);
          this.isLoading.set(false);
        }
      });
  }
  
  /**
   * Save form data to database
   */
  saveForm(): void {
    // Validate form
    if (!this.form.valid) {
      this.saveMessage.set('⚠️ Please fill in all required fields');
      setTimeout(() => this.saveMessage.set(null), 3000);
      return;
    }
    
    const sampleInfo = this.sampleData();
    if (!sampleInfo?.sampleId || !sampleInfo?.testReference?.id) {
      this.saveMessage.set('⚠️ Sample information is missing');
      setTimeout(() => this.saveMessage.set(null), 3000);
      return;
    }
    
    // Check repeatability for Q/QAG users
    const repeatability = this.repeatabilityResult();
    if (repeatability && !repeatability.isWithinLimit) {
      // TODO: Check user qualification level from auth service
      // For now, just warn all users
      if (!confirm(`${repeatability.warning}\n\nDo you want to continue saving?`)) {
        return;
      }
    }
    
    this.isSaving.set(true);
    this.saveMessage.set(null);
    
    // Prepare trial data
    const formData = this.form.getRawValue();
    const trials = formData.trials.map((trial: any) => ({
      trialNumber: trial.trialNumber,
      value1: trial.stopwatchTime || null, // stopwatch time in seconds
      value3: trial.calculatedResult || null, // calculated viscosity result
      id2: trial.tubeCalibration ? trial.tubeCalibration.split('|')[0] : null, // extract tube ID
      trialComplete: trial.selected || false,
      selected: trial.selected || false
    }));
    
    // Save to database
    this.testReadingsService.bulkSaveTrials(
      sampleInfo.sampleId,
      sampleInfo.testReference.id,
      trials,
      undefined, // entryId - can be set to current user ID
      'E' // status: E = Entered
    ).subscribe({
      next: (response) => {
        this.isSaving.set(false);
        if (response.success) {
          this.saveMessage.set(`✅ Successfully saved ${response.count} trial(s)`);
          setTimeout(() => this.saveMessage.set(null), 5000);
          console.log('Viscosity @ 40°C data saved:', response.data);
          
          // TODO: Update sample status workflow
          // TODO: Emit event to parent component
        } else {
          this.saveMessage.set('❌ Failed to save data');
          setTimeout(() => this.saveMessage.set(null), 5000);
        }
      },
      error: (error) => {
        this.isSaving.set(false);
        console.error('Save error:', error);
        this.saveMessage.set(`❌ Error: ${error.message || 'Failed to save data'}`);
        setTimeout(() => this.saveMessage.set(null), 5000);
      }
    });
  }
}

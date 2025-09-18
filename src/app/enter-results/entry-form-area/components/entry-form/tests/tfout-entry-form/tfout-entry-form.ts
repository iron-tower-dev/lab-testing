import { Component, computed, inject, input, output, signal, effect, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { SharedModule } from '../../../../../../shared-module';
import { SampleWithTestInfo } from '../../../../../enter-results.types';
import { TestStandardsService } from '../../../../../../shared/services/test-standards.service';
import { TestFormDataService } from '../../../../../../shared/services/test-form-data.service';
import { TestTypesService } from '../../../../../../shared/services/test-types.service';
import { debounceTime, Subject, takeUntil, firstValueFrom } from 'rxjs';

// Standard test data interface
export interface TFOUTTrialData {
  trialNumber: number;
  testValue: number | null;
  notes: string;
  isSelected: boolean;
}

export interface TFOUTFormData {
  sampleId?: number;
  analystInitials: string;
  testStandard: string;
  trials: TFOUTTrialData[];
  labComments: string;
}

@Component({
  selector: 'app-tfout-entry-form',
  imports: [SharedModule],
  templateUrl: './tfout-entry-form.html',
  styleUrl: './tfout-entry-form.css'
})
export class TFOUTEntryForm implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly testStandardsService = inject(TestStandardsService);
  private readonly testFormDataService = inject(TestFormDataService);
  private readonly testTypesService = inject(TestTypesService);
  
  // Input/Output signals
  sampleData = input<SampleWithTestInfo | null>(null);
  initialData = input<TFOUTFormData | null>(null);
  
  formDataChange = output<TFOUTFormData>();
  validationChange = output<boolean>();
  partialSave = output<TFOUTFormData>();
  
  // Form groups
  form!: FormGroup;
  trialsFormArray!: FormArray;
  
  // Reactive signals
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  commentCharacterCount = signal(0);
  commentLimitWarning = computed(() => this.commentCharacterCount() > 800);
  
  // Component lifecycle
  private destroy$ = new Subject<void>();
  private autoSaveSubject = new Subject<TFOUTFormData>();
  
  // Test standards - loaded from API
  testStandardOptions = signal<{value: string; label: string}[]>([]);

  ngOnInit(): void {
    this.initializeForms();
    this.setupFormSubscriptions();
    this.setupAutoSave();
    this.loadTestStandards();
    this.loadInitialData();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  private initializeForms(): void {
    // Main form
    this.form = this.fb.group({
      analystInitials: ['', [Validators.required, Validators.maxLength(5)]],
      testStandard: ['', Validators.required],
      labComments: ['', [Validators.maxLength(1000)]]
    });
    
    // Trials form array (4 trials)
    this.trialsFormArray = this.fb.array(
      Array.from({ length: 4 }, (_, index) => this.createTrialForm(index + 1))
    );
    
    this.form.addControl('trials', this.trialsFormArray);
  }
  
  private createTrialForm(trialNumber: number): FormGroup {
    return this.fb.group({
      trialNumber: [trialNumber],
      testValue: [null],
      notes: ['', [Validators.maxLength(200)]],
      isSelected: [false]
    });
  }

  private setupFormSubscriptions(): void {
    // Track lab comments character count
    this.form.get('labComments')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(comments => {
        this.commentCharacterCount.set((comments || '').length);
      });
    
    // Track form changes for validation and output
    this.form.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.emitFormChanges());
    this.trialsFormArray.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.emitFormChanges());
  }
  
  private setupAutoSave(): void {
    this.autoSaveSubject
      .pipe(
        debounceTime(2000),
        takeUntil(this.destroy$)
      )
      .subscribe(formData => {
        this.autoSaveFormData(formData);
      });
  }
  
  private async loadTestStandards(): Promise<void> {
    try {
      this.isLoading.set(true);
      this.errorMessage.set(null);
      
      // First get the test ID for TFOUT
      const testTypeResponse = await firstValueFrom(this.testTypesService.getTestTypeByCode('TFOUT'));
      if (!testTypeResponse.success || !testTypeResponse.data) {
        throw new Error('Failed to get test type for TFOUT');
      }
      
      const testId = testTypeResponse.data.testId;
      const standards = await firstValueFrom(this.testStandardsService.getStandardOptions(testId));
      this.testStandardOptions.set(standards);
    } catch (error) {
      console.error('Failed to load test standards for TFOUT:', error);
      this.errorMessage.set('Failed to load test standards. Please refresh the page.');
    } finally {
      this.isLoading.set(false);
    }
  }
  
  private async loadInitialData(): Promise<void> {
    const inputData = this.initialData();
    if (inputData) {
      this.populateForm(inputData);
      return;
    }
    
    // Try to load persisted data from API
    const sampleData = this.sampleData();
    if (sampleData?.sampleId) {
      try {
        // Get the test ID for TFOUT
        const testTypeResponse = await firstValueFrom(this.testTypesService.getTestTypeByCode('TFOUT'));
        if (testTypeResponse.success && testTypeResponse.data) {
          const testId = testTypeResponse.data.testId;
          const response = await firstValueFrom(this.testFormDataService.getFormData(sampleData.sampleId, testId));
          if (response.success && response.data && response.data.formData) {
            this.populateForm(response.data.formData as TFOUTFormData);
          }
        }
      } catch (error) {
        console.error('Failed to load saved TFOUT data:', error);
        // Continue with empty form
      }
    }
  }
  
  private populateForm(data: TFOUTFormData): void {
    this.form.patchValue({
      analystInitials: data.analystInitials,
      testStandard: data.testStandard,
      labComments: data.labComments
    });
    
    // Load trial data
    data.trials.forEach((trialData, index) => {
      if (index < this.trialsFormArray.length) {
        this.trialsFormArray.at(index).patchValue(trialData);
      }
    });
  }
  
  private async autoSaveFormData(formData: TFOUTFormData): Promise<void> {
    if (!this.sampleData()?.sampleId || !this.form.dirty) {
      return;
    }
    
    try {
      // Get the test ID for TFOUT
      const testTypeResponse = await firstValueFrom(this.testTypesService.getTestTypeByCode('TFOUT'));
      if (!testTypeResponse.success || !testTypeResponse.data) {
        return;
      }
      
      const testId = testTypeResponse.data.testId;
      await firstValueFrom(this.testFormDataService.autoSaveFormData(
        this.sampleData()!.sampleId!,
        testId,
        formData,
        'auto-save'
      ));
      
      // Mark form as saved
      this.form.markAsPristine();
      this.trialsFormArray.markAsPristine();
    } catch (error) {
      console.error('Auto-save failed for TFOUT:', error);
    }
  }
  
  // Trial management methods
  getTrialForm(index: number): FormGroup {
    return this.trialsFormArray.at(index) as FormGroup;
  }
  
  selectedTrialsCount = computed(() => {
    return this.trialsFormArray.controls.filter(
      control => control.get('isSelected')?.value && control.get('testValue')?.value !== null
    ).length;
  });
  
  allTrialsSelected = computed(() => {
    return this.trialsFormArray.controls.every(control => control.get('isSelected')?.value);
  });
  
  onSelectAllTrials(): void {
    const selectAll = !this.allTrialsSelected();
    this.trialsFormArray.controls.forEach(control => {
      control.get('isSelected')?.setValue(selectAll);
    });
  }
  
  onClearSelectedTrials(): void {
    this.trialsFormArray.controls.forEach(control => {
      if (control.get('isSelected')?.value) {
        control.patchValue({
          testValue: null,
          notes: '',
          isSelected: false
        });
      }
    });
  }
  
  // Calculation methods
  calculatedResults = computed(() => {
    const selectedTrials = this.trialsFormArray.controls
      .filter(control => control.get('isSelected')?.value && control.get('testValue')?.value !== null)
      .map(control => control.get('testValue')?.value as number);
    
    if (selectedTrials.length === 0) return null;
    
    const average = selectedTrials.reduce((sum, val) => sum + val, 0) / selectedTrials.length;
    const variance = selectedTrials.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / selectedTrials.length;
    const stdDev = Math.sqrt(variance);
    const cv = average !== 0 ? (stdDev / average) * 100 : 0;
    
    return { average, stdDev, cv };
  });
  
  // Form validation
  formIsValid = computed(() => {
    return this.form.valid && this.selectedTrialsCount() > 0;
  });
  
  hasUnsavedChanges = computed(() => {
    return this.form.dirty || this.trialsFormArray.dirty;
  });
  
  private emitFormChanges(): void {
    const formData = this.getFormData();
    this.formDataChange.emit(formData);
    this.validationChange.emit(this.formIsValid());
    
    // Trigger auto-save
    if (this.hasUnsavedChanges()) {
      this.autoSaveSubject.next(formData);
    }
  }
  
  private getFormData(): TFOUTFormData {
    const trialsData: TFOUTTrialData[] = this.trialsFormArray.controls.map(
      control => control.value as TFOUTTrialData
    );
    
    return {
      sampleId: this.sampleData()?.sampleId,
      analystInitials: this.form.get('analystInitials')?.value || '',
      testStandard: this.form.get('testStandard')?.value || '',
      trials: trialsData,
      labComments: this.form.get('labComments')?.value || ''
    };
  }
  
  // Action methods
  async onSave(): Promise<void> {
    if (!this.formIsValid()) return;
    
    this.isLoading.set(true);
    this.errorMessage.set(null);
    
    try {
      const formData = this.getFormData();
      
      if (this.sampleData()?.sampleId) {
        // Get the test ID for TFOUT
        const testTypeResponse = await firstValueFrom(this.testTypesService.getTestTypeByCode('TFOUT'));
        if (testTypeResponse.success && testTypeResponse.data) {
          const testId = testTypeResponse.data.testId;
          await firstValueFrom(this.testFormDataService.submitFormData(
            this.sampleData()!.sampleId!,
            testId,
            formData,
            'user'
          ));
        }
      }
      
      this.form.markAsPristine();
      this.trialsFormArray.markAsPristine();
      console.log('Successfully saved TFOUT test data');
      
    } catch (error) {
      this.errorMessage.set('Failed to save data. Please try again.');
      console.error('Error saving TFOUT test data:', error);
    } finally {
      this.isLoading.set(false);
    }
  }
  
  onClear(): void {
    this.form.reset({
      analystInitials: '',
      testStandard: '',
      labComments: ''
    });
    
    this.trialsFormArray.controls.forEach((control, index) => {
      control.reset({
        trialNumber: index + 1,
        testValue: null,
        notes: '',
        isSelected: false
      });
    });
    
    this.errorMessage.set(null);
  }
}

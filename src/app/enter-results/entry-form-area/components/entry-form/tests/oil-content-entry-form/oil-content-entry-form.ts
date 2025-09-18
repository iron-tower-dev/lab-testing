import { Component, computed, inject, input, output, signal, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { SharedModule } from '../../../../../../shared-module';
import { SampleWithTestInfo } from '../../../../../enter-results.types';
import { TestStandardsService } from '../../../../../../shared/services/test-standards.service';
import { TestFormDataService } from '../../../../../../shared/services/test-form-data.service';
import { TestTypesService } from '../../../../../../shared/services/test-types.service';
import { debounceTime, Subject, takeUntil, firstValueFrom } from 'rxjs';

// Oil content measurement interface
export interface OilContentMeasurement {
  measurementNumber: number;
  oilContentPercent: number | null;
  notes: string;
  isSelected: boolean;
}

export interface OilContentFormData {
  sampleId?: number;
  analystInitials: string;
  testStandard: string;
  testMethod: string;
  instrumentUsed: string;
  sampleVolume: number;
  extractionSolvent: string;
  measurements: OilContentMeasurement[];
  labComments: string;
}

@Component({
  selector: 'app-oil-content-entry-form',
  imports: [SharedModule],
  templateUrl: './oil-content-entry-form.html',
  styleUrl: './oil-content-entry-form.css'
})
export class OilContentEntryForm implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly testStandardsService = inject(TestStandardsService);
  private readonly testFormDataService = inject(TestFormDataService);
  private readonly testTypesService = inject(TestTypesService);
  
  // Input/Output signals
  sampleData = input<SampleWithTestInfo | null>(null);
  initialData = input<OilContentFormData | null>(null);
  
  formDataChange = output<OilContentFormData>();
  validationChange = output<boolean>();
  partialSave = output<OilContentFormData>();
  
  // Form groups
  form!: FormGroup;
  measurementsFormArray!: FormArray;
  
  // Reactive signals
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  commentCharacterCount = signal(0);
  commentLimitWarning = computed(() => this.commentCharacterCount() > 800);
  
  // Component lifecycle
  private destroy$ = new Subject<void>();
  private autoSaveSubject = new Subject<OilContentFormData>();
  
  // Test standards - loaded from API
  testStandardOptions = signal<{value: string; label: string}[]>([]);
  
  // Test method options
  readonly testMethods = [
    'Gravimetric Method',
    'Infrared Spectroscopy',
    'Solvent Extraction',
    'Other'
  ];
  
  readonly instruments = [
    'Balance (Analytical)',
    'FT-IR Spectrometer',
    'Separatory Funnel',
    'Soxhlet Extractor',
    'Other'
  ];
  
  readonly solvents = [
    'Hexane',
    'Petroleum Ether',
    'Chloroform',
    'Carbon Tetrachloride',
    'Other'
  ];

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
      testMethod: ['', Validators.required],
      instrumentUsed: ['', Validators.required],
      sampleVolume: [100, [Validators.required, Validators.min(1), Validators.max(1000)]],
      extractionSolvent: ['', Validators.required],
      labComments: ['', [Validators.maxLength(1000)]]
    });
    
    // Measurements form array (3 measurements)
    this.measurementsFormArray = this.fb.array(
      Array.from({ length: 3 }, (_, index) => this.createMeasurementForm(index + 1))
    );
    
    this.form.addControl('measurements', this.measurementsFormArray);
  }
  
  private createMeasurementForm(measurementNumber: number): FormGroup {
    return this.fb.group({
      measurementNumber: [measurementNumber],
      oilContentPercent: [null, [Validators.min(0), Validators.max(100)]],
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
    
    this.measurementsFormArray.valueChanges
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
      
      const testTypeResponse = await firstValueFrom(this.testTypesService.getTestTypeByCode('OIL_CONTENT'));
      if (!testTypeResponse.success || !testTypeResponse.data) {
        throw new Error('Failed to get test type for OIL_CONTENT');
      }
      
      const testId = testTypeResponse.data.testId;
      const standards = await firstValueFrom(this.testStandardsService.getStandardOptions(testId));
      this.testStandardOptions.set(standards);
    } catch (error) {
      console.error('Failed to load test standards for Oil Content:', error);
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
        const testTypeResponse = await firstValueFrom(this.testTypesService.getTestTypeByCode('OIL_CONTENT'));
        if (testTypeResponse.success && testTypeResponse.data) {
          const testId = testTypeResponse.data.testId;
          const response = await firstValueFrom(this.testFormDataService.getFormData(sampleData.sampleId, testId));
          if (response.success && response.data && response.data.formData) {
            this.populateForm(response.data.formData as OilContentFormData);
          }
        }
      } catch (error) {
        console.error('Failed to load saved Oil Content data:', error);
        // Continue with empty form
      }
    }
  }
  
  private populateForm(data: OilContentFormData): void {
    this.form.patchValue({
      analystInitials: data.analystInitials,
      testStandard: data.testStandard,
      testMethod: data.testMethod,
      instrumentUsed: data.instrumentUsed,
      sampleVolume: data.sampleVolume,
      extractionSolvent: data.extractionSolvent,
      labComments: data.labComments
    });
    
    // Load measurement data
    data.measurements.forEach((measurementData, index) => {
      if (index < this.measurementsFormArray.length) {
        this.measurementsFormArray.at(index).patchValue(measurementData);
      }
    });
  }
  
  private async autoSaveFormData(formData: OilContentFormData): Promise<void> {
    if (!this.sampleData()?.sampleId || !this.form.dirty) {
      return;
    }
    
    try {
      const testTypeResponse = await firstValueFrom(this.testTypesService.getTestTypeByCode('OIL_CONTENT'));
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
      this.measurementsFormArray.markAsPristine();
    } catch (error) {
      console.error('Auto-save failed for Oil Content:', error);
    }
  }
  
  // Measurement management methods
  getMeasurementForm(index: number): FormGroup {
    return this.measurementsFormArray.at(index) as FormGroup;
  }
  
  selectedMeasurementsCount = computed(() => {
    return this.measurementsFormArray.controls.filter(
      control => control.get('isSelected')?.value && control.get('oilContentPercent')?.value !== null
    ).length;
  });
  
  // Calculation methods
  calculatedResults = computed(() => {
    const selectedMeasurements = this.measurementsFormArray.controls
      .filter(control => control.get('isSelected')?.value && control.get('oilContentPercent')?.value !== null)
      .map(control => control.get('oilContentPercent')?.value as number);
    
    if (selectedMeasurements.length === 0) return null;
    
    const average = selectedMeasurements.reduce((sum, val) => sum + val, 0) / selectedMeasurements.length;
    const variance = selectedMeasurements.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / selectedMeasurements.length;
    const stdDev = Math.sqrt(variance);
    const cv = average !== 0 ? (stdDev / average) * 100 : 0;
    
    return { average, stdDev, cv };
  });
  
  // Form validation and state
  formIsValid = computed(() => {
    return this.form.valid && this.selectedMeasurementsCount() > 0;
  });
  
  hasUnsavedChanges = computed(() => {
    return this.form.dirty || this.measurementsFormArray.dirty;
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
  
  private getFormData(): OilContentFormData {
    const measurementsData: OilContentMeasurement[] = this.measurementsFormArray.controls.map(
      control => control.value as OilContentMeasurement
    );
    
    return {
      sampleId: this.sampleData()?.sampleId,
      analystInitials: this.form.get('analystInitials')?.value || '',
      testStandard: this.form.get('testStandard')?.value || '',
      testMethod: this.form.get('testMethod')?.value || '',
      instrumentUsed: this.form.get('instrumentUsed')?.value || '',
      sampleVolume: this.form.get('sampleVolume')?.value || 100,
      extractionSolvent: this.form.get('extractionSolvent')?.value || '',
      measurements: measurementsData,
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
        const testTypeResponse = await firstValueFrom(this.testTypesService.getTestTypeByCode('OIL_CONTENT'));
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
      this.measurementsFormArray.markAsPristine();
      console.log('Successfully saved Oil Content test data');
      
    } catch (error) {
      this.errorMessage.set('Failed to save data. Please try again.');
      console.error('Error saving Oil Content test data:', error);
    } finally {
      this.isLoading.set(false);
    }
  }
  
  onClear(): void {
    this.form.reset({
      analystInitials: '',
      testStandard: '',
      testMethod: '',
      instrumentUsed: '',
      sampleVolume: 100,
      extractionSolvent: '',
      labComments: ''
    });
    
    this.measurementsFormArray.controls.forEach((control, index) => {
      control.reset({
        measurementNumber: index + 1,
        oilContentPercent: null,
        notes: '',
        isSelected: false
      });
    });
    
    this.errorMessage.set(null);
  }
}

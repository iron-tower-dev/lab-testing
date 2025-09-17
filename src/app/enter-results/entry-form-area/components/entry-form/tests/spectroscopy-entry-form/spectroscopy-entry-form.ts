import { Component, computed, inject, input, output, signal, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { SharedModule } from '../../../../../../shared-module';
import { SampleWithTestInfo } from '../../../../../enter-results.types';
import { TestStandardsService } from '../../../../../../shared/services/test-standards.service';
import { TestFormDataService } from '../../../../../../shared/services/test-form-data.service';
import { TestTypesService } from '../../../../../../shared/services/test-types.service';
import { debounceTime, Subject, takeUntil, firstValueFrom } from 'rxjs';

// Element measurement interface
export interface ElementMeasurement {
  element: string;
  measuredValue: number | null;
  units: string;
  lowerLimit?: number;
  upperLimit?: number;
  status?: 'normal' | 'high' | 'low';
  notes: string;
}

export interface SpectroscopyFormData {
  sampleId?: number;
  analystInitials: string;
  testStandard: string;
  spectrometerModel: string;
  calibrationDate: string;
  elements: ElementMeasurement[];
  dilutionFactor: number;
  testType: 'standard' | 'large'; // Standard vs Large spectroscopy
  labComments: string;
}

@Component({
  selector: 'app-spectroscopy-entry-form',
  imports: [SharedModule],
  templateUrl: './spectroscopy-entry-form.html',
  styleUrl: './spectroscopy-entry-form.css'
})
export class SpectroscopyEntryForm implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly testStandardsService = inject(TestStandardsService);
  private readonly testFormDataService = inject(TestFormDataService);
  private readonly testTypesService = inject(TestTypesService);
  
  // Input/Output signals
  sampleData = input<SampleWithTestInfo | null>(null);
  initialData = input<SpectroscopyFormData | null>(null);
  
  formDataChange = output<SpectroscopyFormData>();
  validationChange = output<boolean>();
  partialSave = output<SpectroscopyFormData>();
  
  // Form groups
  form!: FormGroup;
  elementsFormArray!: FormArray;
  
  // Reactive signals
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  commentCharacterCount = signal(0);
  commentLimitWarning = computed(() => this.commentCharacterCount() > 800);
  
  // Component lifecycle
  private destroy$ = new Subject<void>();
  private autoSaveSubject = new Subject<SpectroscopyFormData>();
  
  // Test standards - loaded from API
  testStandardOptions = signal<{value: string; label: string}[]>([]);
  
  // Common elements for spectroscopy analysis
  readonly commonElements = [
    { symbol: 'Fe', name: 'Iron', units: 'ppm', normalRange: [0, 200] },
    { symbol: 'Cu', name: 'Copper', units: 'ppm', normalRange: [0, 100] },
    { symbol: 'Al', name: 'Aluminum', units: 'ppm', normalRange: [0, 50] },
    { symbol: 'Cr', name: 'Chromium', units: 'ppm', normalRange: [0, 20] },
    { symbol: 'Ni', name: 'Nickel', units: 'ppm', normalRange: [0, 20] },
    { symbol: 'Pb', name: 'Lead', units: 'ppm', normalRange: [0, 20] },
    { symbol: 'Sn', name: 'Tin', units: 'ppm', normalRange: [0, 20] },
    { symbol: 'Ag', name: 'Silver', units: 'ppm', normalRange: [0, 10] },
    { symbol: 'Si', name: 'Silicon', units: 'ppm', normalRange: [0, 30] },
    { symbol: 'B', name: 'Boron', units: 'ppm', normalRange: [0, 10] },
    { symbol: 'Na', name: 'Sodium', units: 'ppm', normalRange: [0, 50] },
    { symbol: 'K', name: 'Potassium', units: 'ppm', normalRange: [0, 10] },
    { symbol: 'Mg', name: 'Magnesium', units: 'ppm', normalRange: [0, 20] },
    { symbol: 'Ca', name: 'Calcium', units: 'ppm', normalRange: [0, 50] },
    { symbol: 'Zn', name: 'Zinc', units: 'ppm', normalRange: [0, 100] },
    { symbol: 'P', name: 'Phosphorus', units: 'ppm', normalRange: [0, 1000] },
    { symbol: 'S', name: 'Sulfur', units: 'ppm', normalRange: [0, 5000] },
    { symbol: 'Mo', name: 'Molybdenum', units: 'ppm', normalRange: [0, 20] },
    { symbol: 'Ti', name: 'Titanium', units: 'ppm', normalRange: [0, 10] },
    { symbol: 'V', name: 'Vanadium', units: 'ppm', normalRange: [0, 10] }
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
      spectrometerModel: ['', Validators.required],
      calibrationDate: ['', Validators.required],
      dilutionFactor: [1, [Validators.required, Validators.min(1), Validators.max(1000)]],
      testType: ['standard', Validators.required],
      labComments: ['', [Validators.maxLength(1000)]]
    });
    
    // Elements form array - initialize with common elements
    this.elementsFormArray = this.fb.array(
      this.commonElements.map(element => this.createElementForm(element))
    );
    
    this.form.addControl('elements', this.elementsFormArray);
  }
  
  private createElementForm(elementInfo: any): FormGroup {
    return this.fb.group({
      element: [elementInfo.symbol],
      measuredValue: [null, [Validators.min(0), Validators.max(10000)]],
      units: [elementInfo.units],
      lowerLimit: [elementInfo.normalRange[0]],
      upperLimit: [elementInfo.normalRange[1]],
      status: ['normal'],
      notes: ['', [Validators.maxLength(200)]]
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
    
    this.elementsFormArray.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateElementStatuses();
        this.emitFormChanges();
      });
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
      
      // Get test type - try both standard and large spectroscopy
      const testCode = this.form.get('testType')?.value === 'large' ? 'SPECTROSCOPY_LARGE' : 'SPECTROSCOPY_STANDARD';
      const testTypeResponse = await firstValueFrom(this.testTypesService.getTestTypeByCode(testCode));
      
      if (!testTypeResponse.success || !testTypeResponse.data) {
        // Fallback to generic spectroscopy
        const fallbackResponse = await firstValueFrom(this.testTypesService.getTestTypeByCode('SPECTROSCOPY'));
        if (fallbackResponse.success && fallbackResponse.data) {
          const testId = fallbackResponse.data.testId;
          const standards = await firstValueFrom(this.testStandardsService.getStandardOptions(testId));
          this.testStandardOptions.set(standards);
        }
      } else {
        const testId = testTypeResponse.data.testId;
        const standards = await firstValueFrom(this.testStandardsService.getStandardOptions(testId));
        this.testStandardOptions.set(standards);
      }
    } catch (error) {
      console.error('Failed to load test standards for Spectroscopy:', error);
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
        const testCode = this.form.get('testType')?.value === 'large' ? 'SPECTROSCOPY_LARGE' : 'SPECTROSCOPY_STANDARD';
        const testTypeResponse = await firstValueFrom(this.testTypesService.getTestTypeByCode(testCode));
        if (testTypeResponse.success && testTypeResponse.data) {
          const testId = testTypeResponse.data.testId;
          const response = await firstValueFrom(this.testFormDataService.getFormData(sampleData.sampleId, testId));
          if (response.success && response.data && response.data.formData) {
            this.populateForm(response.data.formData as SpectroscopyFormData);
          }
        }
      } catch (error) {
        console.error('Failed to load saved Spectroscopy data:', error);
        // Continue with empty form
      }
    }
  }
  
  private populateForm(data: SpectroscopyFormData): void {
    this.form.patchValue({
      analystInitials: data.analystInitials,
      testStandard: data.testStandard,
      spectrometerModel: data.spectrometerModel,
      calibrationDate: data.calibrationDate,
      dilutionFactor: data.dilutionFactor,
      testType: data.testType,
      labComments: data.labComments
    });
    
    // Load element data
    data.elements.forEach((elementData, index) => {
      if (index < this.elementsFormArray.length) {
        this.elementsFormArray.at(index).patchValue(elementData);
      }
    });
  }
  
  private async autoSaveFormData(formData: SpectroscopyFormData): Promise<void> {
    if (!this.sampleData()?.sampleId || !this.form.dirty) {
      return;
    }
    
    try {
      const testCode = formData.testType === 'large' ? 'SPECTROSCOPY_LARGE' : 'SPECTROSCOPY_STANDARD';
      const testTypeResponse = await firstValueFrom(this.testTypesService.getTestTypeByCode(testCode));
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
      this.elementsFormArray.markAsPristine();
    } catch (error) {
      console.error('Auto-save failed for Spectroscopy:', error);
    }
  }
  
  // Element management methods
  getElementForm(index: number): FormGroup {
    return this.elementsFormArray.at(index) as FormGroup;
  }
  
  private updateElementStatuses(): void {
    this.elementsFormArray.controls.forEach(control => {
      const measuredValue = control.get('measuredValue')?.value;
      const lowerLimit = control.get('lowerLimit')?.value;
      const upperLimit = control.get('upperLimit')?.value;
      
      if (measuredValue !== null && measuredValue !== undefined) {
        let status = 'normal';
        if (lowerLimit !== null && measuredValue < lowerLimit) {
          status = 'low';
        } else if (upperLimit !== null && measuredValue > upperLimit) {
          status = 'high';
        }
        control.get('status')?.setValue(status);
      }
    });
  }
  
  // Statistics and validation
  measuredElementsCount = computed(() => {
    return this.elementsFormArray.controls.filter(
      control => control.get('measuredValue')?.value !== null && control.get('measuredValue')?.value !== undefined
    ).length;
  });
  
  abnormalElementsCount = computed(() => {
    return this.elementsFormArray.controls.filter(
      control => {
        const status = control.get('status')?.value;
        return status === 'high' || status === 'low';
      }
    ).length;
  });
  
  formIsValid = computed(() => {
    return this.form.valid && this.measuredElementsCount() > 0;
  });
  
  hasUnsavedChanges = computed(() => {
    return this.form.dirty || this.elementsFormArray.dirty;
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
  
  private getFormData(): SpectroscopyFormData {
    const elementsData: ElementMeasurement[] = this.elementsFormArray.controls.map(
      control => control.value as ElementMeasurement
    );
    
    return {
      sampleId: this.sampleData()?.sampleId,
      analystInitials: this.form.get('analystInitials')?.value || '',
      testStandard: this.form.get('testStandard')?.value || '',
      spectrometerModel: this.form.get('spectrometerModel')?.value || '',
      calibrationDate: this.form.get('calibrationDate')?.value || '',
      dilutionFactor: this.form.get('dilutionFactor')?.value || 1,
      testType: this.form.get('testType')?.value || 'standard',
      elements: elementsData,
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
        const testCode = formData.testType === 'large' ? 'SPECTROSCOPY_LARGE' : 'SPECTROSCOPY_STANDARD';
        const testTypeResponse = await firstValueFrom(this.testTypesService.getTestTypeByCode(testCode));
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
      this.elementsFormArray.markAsPristine();
      console.log('Successfully saved Spectroscopy test data');
      
    } catch (error) {
      this.errorMessage.set('Failed to save data. Please try again.');
      console.error('Error saving Spectroscopy test data:', error);
    } finally {
      this.isLoading.set(false);
    }
  }
  
  onClear(): void {
    this.form.reset({
      analystInitials: '',
      testStandard: '',
      spectrometerModel: '',
      calibrationDate: '',
      dilutionFactor: 1,
      testType: 'standard',
      labComments: ''
    });
    
    this.elementsFormArray.controls.forEach((control, index) => {
      const elementInfo = this.commonElements[index];
      control.reset({
        element: elementInfo.symbol,
        measuredValue: null,
        units: elementInfo.units,
        lowerLimit: elementInfo.normalRange[0],
        upperLimit: elementInfo.normalRange[1],
        status: 'normal',
        notes: ''
      });
    });
    
    this.errorMessage.set(null);
  }
}

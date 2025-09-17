import { Component, OnInit, input, output, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { SharedModule } from '../../../../../../shared-module';
import { SampleWithTestInfo } from '../../../../../enter-results.types';

// D-inch specific types
export interface DInchTrialData {
  trialNumber: number;
  measurement?: number;
  result?: number;
  notes?: string;
  isSelected: boolean;
}

export interface DInchFormData {
  sampleId?: number;
  analystInitials: string;
  temperature?: number;
  testStandard: string;
  equipmentId?: string;
  trials: DInchTrialData[];
  labComments: string;
  overallNotes?: string;
}

export interface DInchFormValidation {
  isValid: boolean;
  trialErrors: Record<number, string[]>;
  generalErrors: string[];
  hasUnsavedChanges: boolean;
}

@Component({
  selector: 'app-d-inch-entry-form',
  imports: [SharedModule],
  templateUrl: './d-inch-entry-form.html',
  styleUrl: './d-inch-entry-form.css',
})
export class DInchEntryForm implements OnInit {
  // Input/Output signals following Angular best practices
  sampleData = input<SampleWithTestInfo | null>(null);
  initialData = input<DInchFormData | null>(null);
  readOnly = input<boolean>(false);
  
  formDataChange = output<DInchFormData>();
  validationChange = output<DInchFormValidation>();
  partialSave = output<DInchFormData>();
  
  // Form groups
  mainForm!: FormGroup;
  trialsFormArray!: FormArray;
  
  // Reactive signals
  selectedTrialCount = signal<number>(0);
  averageResult = signal<number | null>(null);
  isCalculating = signal<boolean>(false);
  
  // Constants
  readonly testStandardOptions = [
    { value: 'ASTM-D6751', label: 'ASTM D6751 - Biodiesel' },
    { value: 'ASTM-D975', label: 'ASTM D975 - Diesel Fuel' },
    { value: 'ASTM-D396', label: 'ASTM D396 - Fuel Oils' },
    { value: 'ISO-3104', label: 'ISO 3104 - Petroleum Products' },
    { value: 'Custom', label: 'Custom Method' }
  ];
  
  readonly maxTrials = 4;
  
  // Computed properties
  validTrialCount = computed(() => {
    return this.getValidResults().length;
  });
  
  resultVariation = computed(() => {
    const validResults = this.getValidResults();
    if (validResults.length < 2) return 0;
    
    const avg = this.averageResult();
    if (avg === null) return 0;
    
    const variance = validResults.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / validResults.length;
    return Math.sqrt(variance);
  });
  
  constructor(private fb: FormBuilder) {}
  
  ngOnInit(): void {
    this.initializeForms();
    this.setupFormSubscriptions();
    this.loadInitialData();
  }
  
  private initializeForms(): void {
    // Main form for general test information
    this.mainForm = this.fb.group({
      analystInitials: ['', [Validators.required, Validators.maxLength(5)]],
      temperature: [22, [Validators.min(15), Validators.max(35)]],
      testStandard: ['ASTM-D6751', Validators.required],
      equipmentId: [''],
      labComments: ['', Validators.maxLength(1000)],
      overallNotes: ['', Validators.maxLength(500)]
    });
    
    // Trials form array - 4 trials
    this.trialsFormArray = this.fb.array(
      Array.from({ length: this.maxTrials }, (_, index) => this.createTrialForm(index + 1))
    );
  }
  
  private createTrialForm(trialNumber: number): FormGroup {
    return this.fb.group({
      trialNumber: [trialNumber],
      measurement: ['', [Validators.min(0), Validators.max(1000)]],
      result: [{ value: '', disabled: true }],
      notes: ['', Validators.maxLength(200)],
      isSelected: [false]
    });
  }
  
  private setupFormSubscriptions(): void {
    // Track changes to trial measurements for automatic calculation
    this.trialsFormArray.valueChanges.subscribe(() => {
      this.calculateResults();
      this.updateSelectedCount();
      this.emitFormChanges();
    });
    
    // Track main form changes
    this.mainForm.valueChanges.subscribe(() => {
      this.emitFormChanges();
    });
    
    // Set up individual trial subscriptions
    for (let i = 0; i < this.maxTrials; i++) {
      const trialForm = this.trialsFormArray.at(i);
      trialForm.get('measurement')?.valueChanges.subscribe(() => {
        this.calculateTrialResult(i);
      });
    }
  }
  
  private loadInitialData(): void {
    const data = this.initialData();
    if (data) {
      this.mainForm.patchValue({
        analystInitials: data.analystInitials,
        temperature: data.temperature || 22,
        testStandard: data.testStandard,
        equipmentId: data.equipmentId || '',
        labComments: data.labComments,
        overallNotes: data.overallNotes || ''
      });
      
      // Load trial data
      data.trials.forEach((trial, index) => {
        if (index < this.maxTrials) {
          const trialForm = this.trialsFormArray.at(index);
          trialForm.patchValue(trial);
        }
      });
    }
  }
  
  private calculateTrialResult(trialIndex: number): void {
    const trialForm = this.trialsFormArray.at(trialIndex);
    const measurement = trialForm.get('measurement')?.value;
    
    if (measurement !== null && measurement !== '' && !isNaN(measurement)) {
      // For D-inch test, the result might be the measurement itself or a calculated value
      // This is a placeholder calculation - adjust based on actual D-inch test requirements
      const result = Number(measurement);
      trialForm.get('result')?.setValue(result, { emitEvent: false });
    } else {
      trialForm.get('result')?.setValue('', { emitEvent: false });
    }
  }
  
  private calculateResults(): void {
    this.isCalculating.set(true);
    
    const validResults = this.getValidResults();
    
    if (validResults.length > 0) {
      const average = validResults.reduce((sum, val) => sum + val, 0) / validResults.length;
      this.averageResult.set(Math.round(average * 100) / 100);
    } else {
      this.averageResult.set(null);
    }
    
    this.isCalculating.set(false);
  }
  
  private updateSelectedCount(): void {
    const selectedCount = this.trialsFormArray.controls
      .filter(control => control.get('isSelected')?.value === true)
      .length;
    this.selectedTrialCount.set(selectedCount);
  }
  
  private getValidResults(): number[] {
    return this.trialsFormArray.controls
      .map(control => control.get('result')?.value)
      .filter(result => result !== null && result !== '' && !isNaN(result))
      .map(result => Number(result));
  }
  
  private emitFormChanges(): void {
    const formData: DInchFormData = {
      sampleId: this.sampleData()?.sampleId,
      ...this.mainForm.value,
      trials: this.trialsFormArray.value
    };
    
    this.formDataChange.emit(formData);
    
    // Emit validation state
    const validation = this.validateForm();
    this.validationChange.emit(validation);
  }
  
  private validateForm(): DInchFormValidation {
    const trialErrors: Record<number, string[]> = {};
    const generalErrors: string[] = [];
    
    // Validate trials
    this.trialsFormArray.controls.forEach((control, index) => {
      const errors: string[] = [];
      const measurement = control.get('measurement');
      
      if (measurement?.errors) {
        if (measurement.errors['min']) {
          errors.push('Measurement cannot be negative');
        }
        if (measurement.errors['max']) {
          errors.push('Measurement exceeds maximum allowed value');
        }
      }
      
      if (errors.length > 0) {
        trialErrors[index + 1] = errors;
      }
    });
    
    // Validate main form
    if (this.mainForm.get('analystInitials')?.errors?.['required']) {
      generalErrors.push('Analyst initials are required');
    }
    
    const validResults = this.getValidResults();
    if (validResults.length === 0) {
      generalErrors.push('At least one trial measurement is required');
    }
    
    return {
      isValid: Object.keys(trialErrors).length === 0 && generalErrors.length === 0,
      trialErrors,
      generalErrors,
      hasUnsavedChanges: this.mainForm.dirty || this.trialsFormArray.dirty
    };
  }
  
  // Public methods for template
  getTrialForm(index: number): FormGroup {
    return this.trialsFormArray.at(index) as FormGroup;
  }
  
  onSelectAllTrials(): void {
    const allSelected = this.trialsFormArray.controls.every(
      control => control.get('isSelected')?.value === true
    );
    
    this.trialsFormArray.controls.forEach(control => {
      control.get('isSelected')?.setValue(!allSelected);
    });
  }
  
  onClearSelectedTrials(): void {
    this.trialsFormArray.controls.forEach(control => {
      if (control.get('isSelected')?.value) {
        control.get('measurement')?.setValue('');
        control.get('notes')?.setValue('');
        control.get('isSelected')?.setValue(false);
      }
    });
  }
  
  onSave(): void {
    if (this.validateForm().isValid) {
      const formData: DInchFormData = {
        sampleId: this.sampleData()?.sampleId,
        ...this.mainForm.value,
        trials: this.trialsFormArray.value
      };
      
      // Emit save event or call service
      this.formDataChange.emit(formData);
    }
  }
  
  onPartialSave(): void {
    const formData: DInchFormData = {
      sampleId: this.sampleData()?.sampleId,
      ...this.mainForm.value,
      trials: this.trialsFormArray.value
    };
    
    this.partialSave.emit(formData);
  }
  
  onClear(): void {
    this.mainForm.reset({
      temperature: 22,
      testStandard: 'ASTM-D6751'
    });
    
    this.trialsFormArray.controls.forEach((control, index) => {
      control.reset({
        trialNumber: index + 1,
        isSelected: false
      });
    });
    
    this.averageResult.set(null);
  }
  
  isVariationAcceptable(): boolean {
    return this.resultVariation() <= 5.0; // 5% acceptable variation
  }
  
  showQualityControlChecks(): boolean {
    return !this.isVariationAcceptable() || this.getValidResults().length < 2;
  }
  
  getQualityControlMessage(): string {
    if (!this.isVariationAcceptable()) {
      return `High variation between trials (${this.resultVariation().toFixed(2)}%) - review technique`;
    }
    if (this.getValidResults().length < 2) {
      return 'At least 2 trials recommended for reliable results';
    }
    return '';
  }
}

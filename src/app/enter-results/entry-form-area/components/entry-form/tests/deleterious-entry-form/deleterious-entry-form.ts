import { Component, OnInit, input, output, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { SharedModule } from '../../../../../../shared-module';
import { SampleWithTestInfo, DeleteriousFormData, DeleteriousFormValidation, DeleteriousTrial } from '../../../../../enter-results.types';

@Component({
  selector: 'app-deleterious-entry-form',
  imports: [SharedModule],
  templateUrl: './deleterious-entry-form.html',
  styleUrl: './deleterious-entry-form.css',
})
export class DeleteriousEntryForm implements OnInit {
  // Input/Output signals
  sampleData = input<SampleWithTestInfo | null>(null);
  formDataChange = output<DeleteriousFormData>();
  validationChange = output<DeleteriousFormValidation>();
  formSaved = output<DeleteriousFormData>();
  formCleared = output<void>();

  // Form and validation
  form!: FormGroup;
  trialsFormArray!: FormArray;

  // Reactive state signals
  readonly selectedTrialsCount = signal<number>(0);
  readonly commentCharacterCount = signal<number>(0);
  readonly calculatedResults = signal<{ average: number; stdDev: number; cv: number } | null>(null);
  readonly hasUnsavedChanges = signal<boolean>(false);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  // Computed properties
  readonly commentLimitWarning = computed(() => this.commentCharacterCount() > 900);
  readonly formIsValid = computed(() => this.form?.valid && this.selectedTrialsCount() > 0);
  readonly allTrialsSelected = computed(() => this.selectedTrialsCount() === 4);

  // Constants
  readonly testStandardOptions = [
    { value: 'ASTM-D7216', label: 'ASTM D7216 - Standard Test Method for Deleterious Materials' },
    { value: 'ASTM-D4055', label: 'ASTM D4055 - Field Measurement of Surface Wind' },
    { value: 'ISO-12185', label: 'ISO 12185 - Crude petroleum and petroleum products' },
    { value: 'Custom', label: 'Custom Method' }
  ];

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initializeForm();
    this.setupFormWatchers();
  }

  private initializeForm(): void {
    // Create trials form array
    this.trialsFormArray = this.fb.array([
      this.createTrialForm(1),
      this.createTrialForm(2),
      this.createTrialForm(3),
      this.createTrialForm(4)
    ]);

    // Main form
    this.form = this.fb.group({
      analystInitials: ['', [Validators.required, Validators.maxLength(5)]],
      testStandard: ['ASTM-D7216', Validators.required],
      temperature: [null, [Validators.min(15), Validators.max(35)]],
      humidity: [null, [Validators.min(0), Validators.max(100)]],
      equipment: ['', Validators.required],
      trials: this.trialsFormArray,
      labComments: ['', Validators.maxLength(1000)]
    });
  }

  private createTrialForm(trialNumber: number): FormGroup {
    return this.fb.group({
      trialNumber: [trialNumber],
      testValue: [null, [Validators.min(0)]],
      notes: ['', Validators.maxLength(200)],
      isSelected: [false]
    });
  }

  private setupFormWatchers(): void {
    // Watch for form changes
    this.form.valueChanges.subscribe(() => {
      this.updateSelectedTrialsCount();
      this.updateCommentCharacterCount();
      this.calculateResults();
      this.hasUnsavedChanges.set(true);
      this.emitFormData();
      this.emitValidationState();
    });
  }

  private updateSelectedTrialsCount(): void {
    const trials = this.trialsFormArray.value as DeleteriousTrial[];
    const count = trials.filter(trial => trial.isSelected).length;
    this.selectedTrialsCount.set(count);
  }

  private updateCommentCharacterCount(): void {
    const comments = this.form.get('labComments')?.value || '';
    this.commentCharacterCount.set(comments.length);
  }

  private calculateResults(): void {
    const trials = this.trialsFormArray.value as DeleteriousTrial[];
    const selectedTrials = trials.filter(trial => trial.isSelected && trial.testValue !== null);
    
    if (selectedTrials.length < 2) {
      this.calculatedResults.set(null);
      return;
    }

    const values = selectedTrials.map(trial => trial.testValue!);
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / (values.length - 1);
    const stdDev = Math.sqrt(variance);
    const cv = average !== 0 ? (stdDev / average) * 100 : 0;

    this.calculatedResults.set({
      average: Math.round(average * 1000) / 1000,
      stdDev: Math.round(stdDev * 1000) / 1000,
      cv: Math.round(cv * 100) / 100
    });
  }

  // Form action methods
  onSave(): void {
    if (this.formIsValid()) {
      this.isLoading.set(true);
      const formData = this.getFormData();
      this.formSaved.emit(formData);
      this.hasUnsavedChanges.set(false);
      // Simulate save operation
      setTimeout(() => {
        this.isLoading.set(false);
        this.errorMessage.set(null);
      }, 1000);
    }
  }

  onClear(): void {
    if (confirm('Are you sure you want to clear all form data?')) {
      this.form.reset();
      this.trialsFormArray.controls.forEach((control, index) => {
        control.patchValue({
          trialNumber: index + 1,
          testValue: null,
          notes: '',
          isSelected: false
        });
      });
      this.hasUnsavedChanges.set(false);
      this.formCleared.emit();
    }
  }

  onSelectAllTrials(): void {
    const selectAll = !this.allTrialsSelected();
    this.trialsFormArray.controls.forEach(control => {
      control.patchValue({ isSelected: selectAll });
    });
  }

  onClearSelectedTrials(): void {
    this.trialsFormArray.controls.forEach(control => {
      if (control.get('isSelected')?.value) {
        control.patchValue({ isSelected: false });
      }
    });
  }

  // Utility methods
  getTrialForm(index: number): FormGroup {
    return this.trialsFormArray.at(index) as FormGroup;
  }

  private emitFormData(): void {
    this.formDataChange.emit(this.getFormData());
  }

  private emitValidationState(): void {
    this.validationChange.emit(this.getValidationState());
  }

  private getFormData(): DeleteriousFormData {
    const formValues = this.form.value;
    const calculatedResults = this.calculatedResults();
    
    return {
      sampleId: this.sampleData()?.sampleId,
      analystInitials: formValues.analystInitials,
      testStandard: formValues.testStandard,
      testConditions: {
        temperature: formValues.temperature,
        humidity: formValues.humidity,
        equipment: formValues.equipment
      },
      trials: formValues.trials,
      labComments: formValues.labComments,
      overallResult: calculatedResults ? {
        averageValue: calculatedResults.average,
        standardDeviation: calculatedResults.stdDev,
        coefficientOfVariation: calculatedResults.cv
      } : undefined
    };
  }

  private getValidationState(): DeleteriousFormValidation {
    const overallErrors: string[] = [];
    const trialErrors: Record<number, string[]> = {};

    if (!this.form.get('analystInitials')?.valid) {
      overallErrors.push('Analyst initials are required');
    }

    if (!this.form.get('equipment')?.valid) {
      overallErrors.push('Equipment information is required');
    }

    if (this.selectedTrialsCount() === 0) {
      overallErrors.push('At least one trial must be selected');
    }

    // Check individual trials
    this.trialsFormArray.controls.forEach((control, index) => {
      const errors: string[] = [];
      const trialData = control.value;
      
      if (trialData.isSelected && (trialData.testValue === null || trialData.testValue === undefined)) {
        errors.push('Test value is required for selected trials');
      }

      if (errors.length > 0) {
        trialErrors[index + 1] = errors;
      }
    });

    return {
      isValid: this.formIsValid(),
      overallErrors,
      trialErrors,
      hasUnsavedChanges: this.hasUnsavedChanges()
    };
  }
}

import { Component, OnInit, OnDestroy, input, signal, computed, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { SharedModule } from '../../../../../../shared-module';
import { SampleWithTestInfo } from '../../../../../enter-results.types';

interface DeleteriousTrial {
  trialNumber: number;
  testValue: number | null;
  notes: string;
  isSelected: boolean;
}

interface DeleteriousResults {
  average: number;
  stdDev: number;
  cv: number;
}

@Component({
  selector: 'app-deleterious-entry-form',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './deleterious-entry-form.html',
  styleUrl: './deleterious-entry-form.scss',
})
export class DeleteriousEntryForm implements OnInit, OnDestroy {
  sampleData = input<SampleWithTestInfo | null>(null);
  
  private fb = inject(FormBuilder);
  private destroy$ = new Subject<void>();

  form!: FormGroup;
  
  // Signals for reactive state
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  testStandardOptions = signal<Array<{value: string, label: string}>>([
    { value: 'ASTM-D7216', label: 'ASTM D7216 - Standard Test Method for Deleterious Materials' },
    { value: 'ASTM-D4055', label: 'ASTM D4055 - Field Measurement of Surface Wind' },
    { value: 'ISO-12185', label: 'ISO 12185 - Crude petroleum and petroleum products' },
    { value: 'Custom', label: 'Custom Method' }
  ]);
  
  // Equipment options
  equipmentOptions = [
    'Standard Test Equipment',
    'Automated Analyzer',
    'Manual Test Kit',
    'Portable Detector'
  ];
  
  // Computed properties
  selectedTrialsCount = computed(() => {
    const trials = this.trialsFormArray?.controls || [];
    return trials.filter(control => control.get('isSelected')?.value).length;
  });
  
  calculatedResults = computed(() => {
    const selectedTrials = this.getSelectedTrials();
    if (selectedTrials.length < 2) return null;
    
    return this.calculateResults(selectedTrials);
  });
  
  formIsValid = computed(() => {
    if (!this.form) return false;
    
    const requiredFields = ['analystInitials', 'testStandard', 'equipment'];
    const allRequiredValid = requiredFields.every(field => 
      this.form.get(field)?.valid
    );
    
    return allRequiredValid && this.selectedTrialsCount() >= 1;
  });
  
  commentCharacterCount = computed(() => {
    return this.form?.get('labComments')?.value?.length || 0;
  });
  
  commentLimitWarning = computed(() => {
    return this.commentCharacterCount() > 800;
  });
  
  get trialsFormArray(): FormArray {
    return this.form.get('trials') as FormArray;
  }

  ngOnInit(): void {
    this.initializeForm();
    this.setupAutoSave();
    this.loadSavedData();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      analystInitials: ['', [Validators.required, Validators.maxLength(5)]],
      testStandard: ['', Validators.required],
      equipment: ['', Validators.required],
      temperature: [null, [Validators.min(15), Validators.max(35)]],
      humidity: [null, [Validators.min(0), Validators.max(100)]],
      trials: this.fb.array(this.createTrialForms()),
      labComments: ['', Validators.maxLength(1000)]
    });
  }
  
  private createTrialForms(): FormGroup[] {
    return Array.from({ length: 4 }, (_, index) => this.fb.group({
      trialNumber: [index + 1],
      isSelected: [false],
      testValue: [null, [Validators.min(0)]],
      notes: ['', Validators.maxLength(200)]
    }));
  }

  private setupAutoSave(): void {
    this.form.valueChanges.pipe(
      debounceTime(2000),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.saveFormData();
    });
  }
  
  private saveFormData(): void {
    if (this.form.valid && this.sampleData()) {
      const formData = {
        ...this.form.value,
        sampleData: this.sampleData(),
        timestamp: new Date().toISOString()
      };
      
      const key = `deleterious_form_${this.sampleData()?.sampleId}`;
      localStorage.setItem(key, JSON.stringify(formData));
    }
  }
  
  private loadSavedData(): void {
    if (this.sampleData()) {
      const key = `deleterious_form_${this.sampleData()?.sampleId}`;
      const savedData = localStorage.getItem(key);
      
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          this.form.patchValue(parsedData, { emitEvent: false });
        } catch (error) {
          console.warn('Failed to load saved deleterious form data:', error);
        }
      }
    }
  }
  
  getTrialForm(index: number): FormGroup {
    return this.trialsFormArray.at(index) as FormGroup;
  }
  
  private getSelectedTrials(): DeleteriousTrial[] {
    return this.trialsFormArray.controls
      .filter(control => control.get('isSelected')?.value)
      .map(control => control.value as DeleteriousTrial)
      .filter(trial => trial.testValue !== null);
  }
  
  private calculateResults(trials: DeleteriousTrial[]): DeleteriousResults {
    const values = trials.map(t => t.testValue!).filter(v => v >= 0);
    
    if (values.length < 2) {
      return { average: values[0] || 0, stdDev: 0, cv: 0 };
    }
    
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / (values.length - 1);
    const stdDev = Math.sqrt(variance);
    const cv = average !== 0 ? (stdDev / average) * 100 : 0;
    
    return {
      average: Math.round(average * 1000) / 1000,
      stdDev: Math.round(stdDev * 1000) / 1000,
      cv: Math.round(cv * 100) / 100
    };
  }

  onSave(): void {
    if (!this.formIsValid()) {
      this.errorMessage.set('Please complete all required fields and select at least 1 trial.');
      return;
    }
    
    this.isLoading.set(true);
    this.errorMessage.set(null);
    
    // Simulate API call
    setTimeout(() => {
      this.isLoading.set(false);
      
      // Clear saved data after successful save
      if (this.sampleData()) {
        const key = `deleterious_form_${this.sampleData()?.sampleId}`;
        localStorage.removeItem(key);
      }
      
      console.log('Deleterious data saved successfully');
    }, 1500);
  }
  
  onClear(): void {
    this.form.reset();
    this.errorMessage.set(null);
    
    // Reset trials array properly
    this.trialsFormArray.clear();
    this.createTrialForms().forEach(trialForm => {
      this.trialsFormArray.push(trialForm);
    });
    
    // Clear saved data
    if (this.sampleData()) {
      const key = `deleterious_form_${this.sampleData()?.sampleId}`;
      localStorage.removeItem(key);
    }
  }

}

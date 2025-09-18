import { Component, OnInit, OnDestroy, input, signal, computed, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { SharedModule } from '../../../../../../shared-module';
import { SampleWithTestInfo } from '../../../../../enter-results.types';

interface DebrisObservation {
  isSelected: boolean;
  debrisType: string;
  concentration: string;
  size: string;
  severity: number | null;
  notes: string;
}

@Component({
  selector: 'app-debris-id-entry-form',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './debris-id-entry-form.html',
  styleUrl: './debris-id-entry-form.scss',
})
export class DebrisIdEntryForm implements OnInit, OnDestroy {
  sampleData = input<SampleWithTestInfo | null>(null);
  
  private fb = inject(FormBuilder);
  private destroy$ = new Subject<void>();
  
  form!: FormGroup;
  
  // Signals for reactive state
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  testStandardOptions = signal<Array<{value: string, label: string}>>([
    { value: 'ASTM-D7670', label: 'ASTM D7670 - Microscopic Debris Analysis' },
    { value: 'ASTM-D6595', label: 'ASTM D6595 - Oil Analysis Particle Counting' },
    { value: 'ISO-4406', label: 'ISO 4406 - Particle Counting' },
    { value: 'Custom', label: 'Custom Method' }
  ]);
  
  // Debris type options
  debrisTypes = [
    'Metallic Debris',
    'Organic Debris', 
    'Cutting Debris',
    'Fatigue Debris',
    'Sliding Debris',
    'Corrosion Debris',
    'Contamination'
  ];
  
  concentrationOptions = ['Trace', 'Light', 'Moderate', 'Heavy', 'Extreme'];
  sizeOptions = ['<5µm', '5-25µm', '25-50µm', '50-100µm', '>100µm'];
  severityOptions = [1, 2, 3, 4, 5];
  
  // Computed properties
  selectedObservationsCount = computed(() => {
    if (!this.observationsFormArray) {
      return 0;
    }
    const observations = this.observationsFormArray.controls || [];
    return observations.filter(control => control.get('isSelected')?.value).length;
  });
  
  formIsValid = computed(() => {
    if (!this.form) return false;
    
    return this.form.valid && this.selectedObservationsCount() >= 1;
  });
  
  commentCharacterCount = computed(() => {
    return this.form?.get('labComments')?.value?.length || 0;
  });
  
  commentLimitWarning = computed(() => {
    return this.commentCharacterCount() > 800;
  });
  
  get observationsFormArray(): FormArray {
    return this.form.get('observations') as FormArray;
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
      magnification: ['', Validators.required],
      observations: this.fb.array(this.createObservationForms()),
      labComments: ['', Validators.maxLength(1000)]
    });
  }
  
  private createObservationForms(): FormGroup[] {
    return this.debrisTypes.map(debrisType => this.fb.group({
      isSelected: [false],
      debrisType: [debrisType],
      concentration: [''],
      size: [''],
      severity: [null, [Validators.min(1), Validators.max(5)]],
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
      
      const key = `debris_id_form_${this.sampleData()?.sampleId}`;
      localStorage.setItem(key, JSON.stringify(formData));
    }
  }
  
  private loadSavedData(): void {
    if (this.sampleData()) {
      const key = `debris_id_form_${this.sampleData()?.sampleId}`;
      const savedData = localStorage.getItem(key);
      
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          this.form.patchValue(parsedData, { emitEvent: false });
        } catch (error) {
          console.warn('Failed to load saved debris ID form data:', error);
        }
      }
    }
  }
  
  getObservationForm(index: number): FormGroup {
    return this.observationsFormArray.at(index) as FormGroup;
  }
  
  onSave(): void {
    if (!this.formIsValid()) {
      this.errorMessage.set('Please complete all required fields and select at least 1 debris observation.');
      return;
    }
    
    this.isLoading.set(true);
    this.errorMessage.set(null);
    
    // Simulate API call
    setTimeout(() => {
      this.isLoading.set(false);
      
      // Clear saved data after successful save
      if (this.sampleData()) {
        const key = `debris_id_form_${this.sampleData()?.sampleId}`;
        localStorage.removeItem(key);
      }
      
      console.log('Debris ID data saved successfully');
    }, 1500);
  }
  
  onClear(): void {
    this.form.reset();
    this.errorMessage.set(null);
    
    // Reset observations array properly
    this.observationsFormArray.clear();
    this.createObservationForms().forEach(obsForm => {
      this.observationsFormArray.push(obsForm);
    });
    
    // Clear saved data
    if (this.sampleData()) {
      const key = `debris_id_form_${this.sampleData()?.sampleId}`;
      localStorage.removeItem(key);
    }
  }
}

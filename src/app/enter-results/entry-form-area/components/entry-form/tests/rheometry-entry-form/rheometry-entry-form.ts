import { Component, OnInit, OnDestroy, input, signal, computed, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { SharedModule } from '../../../../../../shared-module';
import { SampleWithTestInfo } from '../../../../../enter-results.types';

interface RheologyMeasurement {
  isSelected: boolean;
  shearRate: number | null;
  viscosity: number | null;
  temperature: number | null;
  notes: string;
}

interface RheologyResults {
  averageViscosity: number;
  viscosityIndex: number;
  thixotropicIndex: number;
  flowBehaviorIndex: number;
}

@Component({
  selector: 'app-rheometry-entry-form',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './rheometry-entry-form.html',
  styleUrl: './rheometry-entry-form.scss',
})
export class RheometryEntryForm implements OnInit, OnDestroy {
  sampleData = input<SampleWithTestInfo | null>(null);
  
  private fb = inject(FormBuilder);
  private destroy$ = new Subject<void>();
  
  form!: FormGroup;
  
  // Signals for reactive state
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  testStandardOptions = signal<Array<{value: string, label: string}>>([
    { value: 'ASTM D4287', label: 'ASTM D4287 - Standard Test Method for High-Shear Viscosity Using a Cone/Plate Viscometer' },
    { value: 'ASTM D5133', label: 'ASTM D5133 - Standard Test Method for Low Temperature, Low Shear Rate, Viscosity/Temperature Dependence of Lubricating Oils Using a Temperature-Scanning Technique' },
    { value: 'ISO 3219', label: 'ISO 3219 - Plastics — Polymers/resins in the liquid state or as emulsions or dispersions — Determination of viscosity using a rotational viscometer with defined shear rate' },
    { value: 'Custom', label: 'Custom Method' }
  ]);
  
  // Available test equipment
  rheometers = [
    'Brookfield Viscometer',
    'Haake Rheometer', 
    'TA Instruments Rheometer',
    'Anton Paar Rheometer',
    'Malvern Kinexus'
  ];
  
  // Test methods
  testMethods = [
    'Steady Shear Rate Sweep',
    'Oscillatory Frequency Sweep',
    'Temperature Ramp',
    'Stress Relaxation',
    'Creep Recovery'
  ];
  
  // Computed properties
  selectedMeasurementsCount = computed(() => {
    const measurements = this.measurementsFormArray?.controls || [];
    return measurements.filter(control => control.get('isSelected')?.value).length;
  });
  
  calculatedResults = computed(() => {
    const selectedMeasurements = this.getSelectedMeasurements();
    if (selectedMeasurements.length < 2) return null;
    
    return this.calculateRheologyResults(selectedMeasurements);
  });
  
  formIsValid = computed(() => {
    if (!this.form) return false;
    
    const requiredFields = ['analystInitials', 'testStandard', 'testMethod', 'rheometerUsed'];
    const allRequiredValid = requiredFields.every(field => 
      this.form.get(field)?.valid
    );
    
    return allRequiredValid && this.selectedMeasurementsCount() >= 2;
  });
  
  commentCharacterCount = computed(() => {
    return this.form?.get('labComments')?.value?.length || 0;
  });
  
  commentLimitWarning = computed(() => {
    return this.commentCharacterCount() > 800;
  });
  
  get measurementsFormArray(): FormArray {
    return this.form.get('measurements') as FormArray;
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
      testMethod: ['', Validators.required],
      rheometerUsed: ['', Validators.required],
      testTemperature: [25, [Validators.required, Validators.min(-20), Validators.max(200)]],
      sampleVolume: [null, [Validators.min(0.1), Validators.max(100)]],
      measurements: this.fb.array(this.createMeasurementForms()),
      labComments: ['', Validators.maxLength(1000)]
    });
  }
  
  private createMeasurementForms(): FormGroup[] {
    return Array.from({ length: 8 }, () => this.fb.group({
      isSelected: [false],
      shearRate: [null, [Validators.min(0.1), Validators.max(10000)]],
      viscosity: [null, [Validators.min(0.1), Validators.max(100000)]],
      temperature: [25, [Validators.min(-20), Validators.max(200)]],
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
      
      const key = `rheometry_form_${this.sampleData()?.sampleId}`;
      localStorage.setItem(key, JSON.stringify(formData));
    }
  }
  
  private loadSavedData(): void {
    if (this.sampleData()) {
      const key = `rheometry_form_${this.sampleData()?.sampleId}`;
      const savedData = localStorage.getItem(key);
      
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          this.form.patchValue(parsedData, { emitEvent: false });
        } catch (error) {
          console.warn('Failed to load saved rheometry form data:', error);
        }
      }
    }
  }
  
  getMeasurementForm(index: number): FormGroup {
    return this.measurementsFormArray.at(index) as FormGroup;
  }
  
  private getSelectedMeasurements(): RheologyMeasurement[] {
    return this.measurementsFormArray.controls
      .filter(control => control.get('isSelected')?.value)
      .map(control => control.value as RheologyMeasurement)
      .filter(measurement => 
        measurement.shearRate !== null && 
        measurement.viscosity !== null
      );
  }
  
  private calculateRheologyResults(measurements: RheologyMeasurement[]): RheologyResults {
    const viscosities = measurements.map(m => m.viscosity!).filter(v => v > 0);
    const shearRates = measurements.map(m => m.shearRate!).filter(s => s > 0);
    
    // Calculate average viscosity
    const averageViscosity = viscosities.reduce((sum, v) => sum + v, 0) / viscosities.length;
    
    // Simple viscosity index calculation (simplified)
    const maxViscosity = Math.max(...viscosities);
    const minViscosity = Math.min(...viscosities);
    const viscosityIndex = ((maxViscosity - minViscosity) / averageViscosity) * 100;
    
    // Thixotropic index (simplified calculation)
    const thixotropicIndex = viscosities.length > 1 ? 
      (viscosities[0] / viscosities[viscosities.length - 1]) : 1;
    
    // Flow behavior index (power law model simplified)
    const flowBehaviorIndex = shearRates.length > 1 && viscosities.length > 1 ?
      Math.log(viscosities[viscosities.length - 1] / viscosities[0]) / 
      Math.log(shearRates[shearRates.length - 1] / shearRates[0]) : 1;
    
    return {
      averageViscosity: Math.round(averageViscosity * 100) / 100,
      viscosityIndex: Math.round(viscosityIndex * 100) / 100,
      thixotropicIndex: Math.round(thixotropicIndex * 100) / 100,
      flowBehaviorIndex: Math.round(Math.abs(flowBehaviorIndex) * 100) / 100
    };
  }
  
  onSave(): void {
    if (!this.formIsValid()) {
      this.errorMessage.set('Please complete all required fields and select at least 2 measurements.');
      return;
    }
    
    this.isLoading.set(true);
    this.errorMessage.set(null);
    
    // Simulate API call
    setTimeout(() => {
      this.isLoading.set(false);
      
      // Clear saved data after successful save
      if (this.sampleData()) {
        const key = `rheometry_form_${this.sampleData()?.sampleId}`;
        localStorage.removeItem(key);
      }
      
      console.log('Rheometry data saved successfully');
    }, 1500);
  }
  
  onClear(): void {
    this.form.reset();
    this.errorMessage.set(null);
    
    // Clear saved data
    if (this.sampleData()) {
      const key = `rheometry_form_${this.sampleData()?.sampleId}`;
      localStorage.removeItem(key);
    }
  }
}

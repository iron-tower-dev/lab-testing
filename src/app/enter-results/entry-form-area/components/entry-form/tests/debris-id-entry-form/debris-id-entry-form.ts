import { Component, OnInit, inject, input, output, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { SharedModule } from '../../../../../../shared-module';
import { ParticleTypesService } from '../../../../../../shared/services/particle-types.service';
import {
  SampleWithTestInfo,
  ParticleTypeDefinition
} from '../../../../../enter-results.types';

// Debris ID specific types
export type DebrisIdParticleType = 
  | 'Metallic Debris' 
  | 'Organic Debris'
  | 'Inorganic Debris'
  | 'Synthetic Debris'
  | 'Cutting Debris'
  | 'Fatigue Debris'
  | 'Sliding Debris'
  | 'Rolling Debris'
  | 'Corrosion Debris'
  | 'Contamination';

export type DebrisIdViewMode = 'All' | 'Review' | 'Selected';

export type DebrisIdSeverity = 1 | 2 | 3 | 4 | 5;

export type DebrisIdConcentration = 'Trace' | 'Light' | 'Moderate' | 'Heavy' | 'Extreme';

export type DebrisIdSize = 
  | 'Microscopic <5µm'
  | 'Small 5-25µm'
  | 'Medium 25-50µm'
  | 'Large 50-100µm'
  | 'Very Large >100µm';

export type DebrisIdShape = 
  | 'Spherical'
  | 'Angular'
  | 'Platelet'
  | 'Needle-like'
  | 'Irregular'
  | 'Chunky';

export type DebrisIdComposition = 
  | 'Iron/Steel'
  | 'Aluminum'
  | 'Copper/Bronze'
  | 'Organic Material'
  | 'Silicon'
  | 'Carbon'
  | 'Unknown';

export interface DebrisIdParticleTypeData {
  particleType: DebrisIdParticleType;
  isVisible: boolean;
  isSelected: boolean;
  concentration: DebrisIdConcentration | '';
  sizeRange: DebrisIdSize | '';
  primaryShape: DebrisIdShape | '';
  composition: DebrisIdComposition | '';
  severity: DebrisIdSeverity | '';
  observations: string;
  recommendedAction: string;
  includeInReport: boolean;
}

export interface DebrisIdOverallData {
  overallSeverity: DebrisIdSeverity | '';
  analystInitials: string;
  testStandard: string;
  equipmentUsed: string;
  magnification: string;
  overallComments: string;
  recommendedActions: string;
  viewMode: DebrisIdViewMode;
  analysisComplete: boolean;
  partialSave: boolean;
}

export interface DebrisIdFormData {
  sampleId?: number;
  overall: DebrisIdOverallData;
  particleTypes: DebrisIdParticleTypeData[];
}

export interface DebrisIdFormValidation {
  isValid: boolean;
  overallErrors: string[];
  particleTypeErrors: Record<DebrisIdParticleType, string[]>;
  commentLengthWarning: boolean;
  hasUnsavedChanges: boolean;
}

@Component({
  selector: 'app-debris-id-entry-form',
  imports: [SharedModule],
  templateUrl: './debris-id-entry-form.html',
  styleUrl: './debris-id-entry-form.scss'
})
export class DebrisIdEntryForm implements OnInit {
  // Injected services
  private readonly particleTypesService = inject(ParticleTypesService);
  
  // Input/Output signals following Angular best practices
  sampleData = input<SampleWithTestInfo | null>(null);
  initialData = input<DebrisIdFormData | null>(null);
  readOnly = input<boolean>(false);
  
  formDataChange = output<DebrisIdFormData>();
  validationChange = output<DebrisIdFormValidation>();
  partialSave = output<DebrisIdFormData>();
  
  // Form groups
  overallForm!: FormGroup;
  particleTypeFormsArray!: FormArray;
  
  // Reactive signals
  viewMode = signal<DebrisIdViewMode>('All');
  commentCharacterCount = signal<number>(0);
  commentLimitWarning = computed(() => this.commentCharacterCount() > 900);
  commentLimitExceeded = computed(() => this.commentCharacterCount() > 1000);
  selectedParticleCount = signal<number>(0);
  
  // Constants for debris identification
  readonly debrisParticleTypes: DebrisIdParticleType[] = [
    'Metallic Debris',
    'Organic Debris', 
    'Inorganic Debris',
    'Synthetic Debris',
    'Cutting Debris',
    'Fatigue Debris',
    'Sliding Debris',
    'Rolling Debris',
    'Corrosion Debris',
    'Contamination'
  ];
  
  readonly concentrationOptions: DebrisIdConcentration[] = ['Trace', 'Light', 'Moderate', 'Heavy', 'Extreme'];
  readonly sizeOptions: DebrisIdSize[] = [
    'Microscopic <5µm',
    'Small 5-25µm',
    'Medium 25-50µm', 
    'Large 50-100µm',
    'Very Large >100µm'
  ];
  readonly shapeOptions: DebrisIdShape[] = [
    'Spherical', 'Angular', 'Platelet', 'Needle-like', 'Irregular', 'Chunky'
  ];
  readonly compositionOptions: DebrisIdComposition[] = [
    'Iron/Steel', 'Aluminum', 'Copper/Bronze', 'Organic Material', 'Silicon', 'Carbon', 'Unknown'
  ];
  readonly severityOptions: DebrisIdSeverity[] = [1, 2, 3, 4, 5];
  readonly testStandardOptions = [
    { value: 'ASTM-D7670', label: 'ASTM D7670 - Microscopic Debris' },
    { value: 'ASTM-D6595', label: 'ASTM D6595 - Oil Analysis' },
    { value: 'ISO-4406', label: 'ISO 4406 - Particle Counting' },
    { value: 'Custom', label: 'Custom Method' }
  ];
  
  // Visibility tracking
  particleTypeVisibility = signal<Record<DebrisIdParticleType, boolean>>(
    {} as Record<DebrisIdParticleType, boolean>
  );
  
  // Particle type definitions loaded from API
  particleTypeDefinitions = signal<ParticleTypeDefinition[]>([]);
  isLoadingParticleTypes = signal<boolean>(false);
  particleTypesError = signal<string | null>(null);
  
  constructor(private fb: FormBuilder) {}
  
  ngOnInit(): void {
    this.initializeForms();
    this.setupFormSubscriptions();
    this.loadParticleTypeDefinitions();
    this.loadInitialData();
    this.initializeParticleTypeVisibility();
  }
  
  private initializeForms(): void {
    // Overall form for general debris identification information
    this.overallForm = this.fb.group({
      overallSeverity: [''],
      analystInitials: ['', [Validators.required, Validators.maxLength(5)]],
      testStandard: ['ASTM-D7670', Validators.required],
      equipmentUsed: [''],
      magnification: [''],
      overallComments: ['', [Validators.maxLength(1000)]],
      recommendedActions: ['', [Validators.maxLength(500)]],
      viewMode: ['All'],
      analysisComplete: [false],
      partialSave: [false]
    });
    
    // Particle type forms array
    this.particleTypeFormsArray = this.fb.array(
      this.debrisParticleTypes.map((particleType: DebrisIdParticleType) => this.createParticleTypeForm(particleType))
    );
  }
  
  private createParticleTypeForm(particleType: DebrisIdParticleType): FormGroup {
    return this.fb.group({
      particleType: [particleType],
      isVisible: [true],
      isSelected: [false],
      concentration: [''],
      sizeRange: [''],
      primaryShape: [''],
      composition: [''],
      severity: [''],
      observations: ['', Validators.maxLength(500)],
      recommendedAction: ['', Validators.maxLength(200)],
      includeInReport: [false]
    });
  }
  
  private setupFormSubscriptions(): void {
    // Track view mode changes
    this.overallForm.get('viewMode')?.valueChanges.subscribe(mode => {
      this.viewMode.set(mode);
      this.updateParticleTypeVisibility();
    });
    
    // Track overall comments character count
    this.overallForm.get('overallComments')?.valueChanges.subscribe(comments => {
      this.commentCharacterCount.set((comments || '').length);
    });
    
    // Track selected particle types count
    this.particleTypeFormsArray.valueChanges.subscribe(() => {
      this.updateSelectedParticleCount();
      this.emitFormChanges();
    });
    
    // Track overall form changes
    this.overallForm.valueChanges.subscribe(() => this.emitFormChanges());
  }
  
  private loadParticleTypeDefinitions(): void {
    this.isLoadingParticleTypes.set(true);
    this.particleTypesError.set(null);
    
    this.particleTypesService.getActiveParticleTypes().subscribe({
      next: (definitions: ParticleTypeDefinition[]) => {
        this.particleTypeDefinitions.set(definitions);
        this.isLoadingParticleTypes.set(false);
        console.log('Loaded particle type definitions for debris ID:', definitions.length);
      },
      error: (error: Error) => {
        console.warn('Failed to load particle type definitions, using fallback:', error);
        this.particleTypesError.set(error.message || 'Failed to load particle types');
        this.isLoadingParticleTypes.set(false);
      }
    });
  }
  
  private loadInitialData(): void {
    const data = this.initialData();
    if (data) {
      this.overallForm.patchValue(data.overall);
      this.viewMode.set(data.overall.viewMode);
      
      data.particleTypes.forEach((ptData: DebrisIdParticleTypeData, index: number) => {
        const form = this.particleTypeFormsArray.at(index);
        if (form) {
          form.patchValue(ptData);
        }
      });
      
      this.updateParticleTypeVisibility();
      this.updateSelectedParticleCount();
    }
  }
  
  private initializeParticleTypeVisibility(): void {
    const visibility: Record<DebrisIdParticleType, boolean> = {} as any;
    this.debrisParticleTypes.forEach(type => {
      visibility[type] = true;
    });
    this.particleTypeVisibility.set(visibility);
  }
  
  private updateParticleTypeVisibility(): void {
    const mode = this.viewMode();
    const visibility: Record<DebrisIdParticleType, boolean> = {} as any;
    
    this.debrisParticleTypes.forEach((type: DebrisIdParticleType, index: number) => {
      const form = this.particleTypeFormsArray.at(index);
      const isSelected = form?.get('isSelected')?.value || false;
      
      if (mode === 'All') {
        visibility[type] = true;
      } else if (mode === 'Review' || mode === 'Selected') {
        visibility[type] = isSelected;
      }
    });
    
    this.particleTypeVisibility.set(visibility);
  }
  
  private updateSelectedParticleCount(): void {
    const selectedCount = this.particleTypeFormsArray.controls
      .filter(control => control.get('isSelected')?.value === true)
      .length;
    this.selectedParticleCount.set(selectedCount);
  }
  
  private emitFormChanges(): void {
    const formData: DebrisIdFormData = {
      sampleId: this.sampleData()?.sampleId,
      overall: this.overallForm.value,
      particleTypes: this.particleTypeFormsArray.value
    };
    
    this.formDataChange.emit(formData);
    
    // Emit validation state
    const validation = this.validateForm();
    this.validationChange.emit(validation);
  }
  
  private validateForm(): DebrisIdFormValidation {
    const particleTypeErrors: Record<DebrisIdParticleType, string[]> = {} as any;
    const overallErrors: string[] = [];
    
    // Validate overall form
    if (this.overallForm.get('analystInitials')?.errors?.['required']) {
      overallErrors.push('Analyst initials are required');
    }
    if (this.overallForm.get('testStandard')?.errors?.['required']) {
      overallErrors.push('Test standard is required');
    }
    
    // Validate particle types
    this.particleTypeFormsArray.controls.forEach((control, index) => {
      const particleType = this.debrisParticleTypes[index];
      const errors: string[] = [];
      
      const isSelected = control.get('isSelected')?.value;
      if (isSelected) {
        if (!control.get('concentration')?.value) {
          errors.push('Concentration is required for selected particle types');
        }
        if (!control.get('severity')?.value) {
          errors.push('Severity rating is required for selected particle types');
        }
      }
      
      const observations = control.get('observations')?.value;
      if (observations && observations.length > 500) {
        errors.push('Observations cannot exceed 500 characters');
      }
      
      if (errors.length > 0) {
        particleTypeErrors[particleType] = errors;
      }
    });
    
    return {
      isValid: overallErrors.length === 0 && Object.keys(particleTypeErrors).length === 0,
      overallErrors,
      particleTypeErrors,
      commentLengthWarning: this.commentLimitWarning(),
      hasUnsavedChanges: this.overallForm.dirty || this.particleTypeFormsArray.dirty
    };
  }
  
  // Public methods for template
  getParticleTypeForm(index: number): FormGroup {
    return this.particleTypeFormsArray.at(index) as FormGroup;
  }
  
  isParticleTypeVisible(particleType: DebrisIdParticleType): boolean {
    return this.particleTypeVisibility()[particleType] || false;
  }
  
  onSelectAllParticleTypes(): void {
    const allSelected = this.particleTypeFormsArray.controls.every(
      control => control.get('isSelected')?.value === true
    );
    
    this.particleTypeFormsArray.controls.forEach(control => {
      control.get('isSelected')?.setValue(!allSelected);
    });
    
    this.updateParticleTypeVisibility();
  }
  
  onClearSelectedParticleTypes(): void {
    this.particleTypeFormsArray.controls.forEach(control => {
      if (control.get('isSelected')?.value) {
        control.patchValue({
          isSelected: false,
          concentration: '',
          sizeRange: '',
          primaryShape: '',
          composition: '',
          severity: '',
          observations: '',
          recommendedAction: '',
          includeInReport: false
        });
      }
    });
    
    this.updateParticleTypeVisibility();
  }
  
  onToggleParticleType(index: number): void {
    const control = this.particleTypeFormsArray.at(index);
    const isSelected = control.get('isSelected')?.value;
    control.get('isSelected')?.setValue(!isSelected);
    
    this.updateParticleTypeVisibility();
  }
  
  onSave(): void {
    if (this.validateForm().isValid) {
      const formData: DebrisIdFormData = {
        sampleId: this.sampleData()?.sampleId,
        overall: { ...this.overallForm.value, analysisComplete: true },
        particleTypes: this.particleTypeFormsArray.value
      };
      
      this.formDataChange.emit(formData);
    }
  }
  
  onPartialSave(): void {
    const formData: DebrisIdFormData = {
      sampleId: this.sampleData()?.sampleId,
      overall: { ...this.overallForm.value, partialSave: true },
      particleTypes: this.particleTypeFormsArray.value
    };
    
    this.partialSave.emit(formData);
  }
  
  onClear(): void {
    this.overallForm.reset({
      testStandard: 'ASTM-D7670',
      viewMode: 'All',
      analysisComplete: false,
      partialSave: false
    });
    
    this.particleTypeFormsArray.controls.forEach((control, index) => {
      control.reset({
        particleType: this.debrisParticleTypes[index],
        isVisible: true,
        isSelected: false,
        includeInReport: false
      });
    });
    
    this.viewMode.set('All');
    this.initializeParticleTypeVisibility();
  }
}

import { Component, OnInit, inject, input, output, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, FormControl, Validators } from '@angular/forms';
import { SharedModule } from '../../../../../../shared-module';
import { ParticleTypeCardComponent } from './components/particle-type-card.component';
import { ParticleTypesService } from '../../../../../../shared/services/particle-types.service';
import {
  FerrographyFormData,
  FerrographyParticleTypeData,
  FerrographyOverallData,
  FerrographyHeat,
  FerrographyConcentration,
  FerrographySize,
  FerrographyColor,
  FerrographyTexture,
  FerrographyComposition,
  FerrographySeverity,
  FerrographyDilutionFactor,
  FerrographyViewMode,
  FerrographyFormValidation,
  ParticleTypeDefinition
} from '../../../../../enter-results.types';

@Component({
  selector: 'app-ferrography-entry-form',
  imports: [SharedModule, ParticleTypeCardComponent],
  templateUrl: './ferrography-entry-form.html',
  styleUrl: './ferrography-entry-form.css',
})
export class FerrographyEntryForm implements OnInit {
  // Injected services
  private readonly particleTypesService = inject(ParticleTypesService);
  
  // Input/Output signals following Angular best practices
  sampleId = input<number>();
  initialData = input<FerrographyFormData>();
  readOnly = input<boolean>(false);
  // Shared lab comments control passed from parent
  labCommentsControl = input<any | null>(null);
  
  formDataChange = output<FerrographyFormData>();
  validationChange = output<FerrographyFormValidation>();
  partialSave = output<FerrographyFormData>();
  
  // Form groups
  overallForm!: FormGroup;
  particleTypeFormsArray!: FormArray;
  
  // Reactive signals
  viewMode = signal<FerrographyViewMode>('All');
  commentCharacterCount = signal<number>(0);
  commentLimitWarning = computed(() => this.commentCharacterCount() > 900);
  commentLimitExceeded = computed(() => this.commentCharacterCount() > 1000);
  
  // Dynamic particle types from database
  dynamicParticleTypes = signal<string[]>([]);
  readonly heatOptions: FerrographyHeat[] = ['NA', 'Blue', 'Straw', 'Purple', 'No Change', 'Melted', 'Charred'];
  readonly concentrationOptions: FerrographyConcentration[] = ['Few', 'Moderate', 'Many', 'Heavy'];
  readonly sizeOptions: FerrographySize[] = [
    'Fine, <5µm',
    'Small, 5 to 15µm', 
    'Medium, 15 to 40µm', 
    'Large, 40 to 100µm', 
    'Huge, >100µm'
  ];
  readonly colorOptions: FerrographyColor[] = [
    'Red', 'Black', 'Tempered', 'Metallic', 'Straw', 'Copper', 'Brass', 'Other Color'
  ];
  readonly textureOptions: FerrographyTexture[] = [
    'Bright or Reflective', 'Dull or Oxidized', 'Pitted', 'Striated', 'Smeared', 'Amorphous', 'Other Texture'
  ];
  readonly compositionOptions: FerrographyComposition[] = [
    'Ferrous Metal', 'Cupric Metal', 'Other Metal', 'Dust', 'Organic', 'Sludge', 'Paint Chips', 'Other Material'
  ];
  readonly severityOptions: FerrographySeverity[] = [1, 2, 3, 4];
  readonly dilutionFactorOptions: FerrographyDilutionFactor[] = ['3:2', '1:10', '1:100', 'Manual'];
  
  // Visibility tracking for dynamic particle types
  particleTypeVisibility = signal<Record<string, boolean>>({});
  
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
  }
  
  private initializeForms(): void {
    // Overall form
    this.overallForm = this.fb.group({
      overallSeverity: [''],
      dilutionFactor: [''],
      customDilutionFactor: [''],
      overallComments: ['', [Validators.maxLength(1000)]],
      viewMode: ['All'],
      mediaReady: [false],
      partialSave: [false]
    });
    
    // Particle type forms array - will be populated when particle types are loaded
    this.particleTypeFormsArray = this.fb.array([]);
  }
  
  private createParticleTypeForm(particleType: string): FormGroup {
    return this.fb.group({
      particleType: [particleType],
      isVisible: [false],
      isSelected: [false],
      heat: [''],
      concentration: [''],
      sizeAvg: [''],
      sizeMax: [''],
      color: [''],
      texture: [''],
      composition: [''],
      severity: [''],
      comments: [''],
      includeCommentsInOverall: [false]
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
    
    // Track form changes for validation and output
    this.overallForm.valueChanges.subscribe(() => this.emitFormChanges());
    this.particleTypeFormsArray.valueChanges.subscribe(() => this.emitFormChanges());
  }
  
  private loadParticleTypeDefinitions(): void {
    this.isLoadingParticleTypes.set(true);
    this.particleTypesError.set(null);
    
    this.particleTypesService.getActiveParticleTypes().subscribe({
      next: (definitions: ParticleTypeDefinition[]) => {
        this.particleTypeDefinitions.set(definitions);
        
        // Extract particle type names and update dynamic list
        const particleTypeNames = definitions.map(def => def.type);
        this.dynamicParticleTypes.set(particleTypeNames);
        
        // Re-initialize the forms array with the loaded particle types
        this.initializeParticleTypeForms(particleTypeNames);
        
        this.isLoadingParticleTypes.set(false);
        console.log('Loaded particle type definitions:', definitions.length);
        
        // Load initial data after particle types are available
        this.loadInitialData();
      },
      error: (error: Error) => {
        console.error('Failed to load particle type definitions:', error);
        this.particleTypesError.set(error.message || 'Failed to load particle types');
        this.isLoadingParticleTypes.set(false);
      }
    });
  }
  
  private initializeParticleTypeForms(particleTypes: string[]): void {
    // Clear existing forms
    while (this.particleTypeFormsArray.length !== 0) {
      this.particleTypeFormsArray.removeAt(0);
    }
    
    // Add forms for each particle type
    particleTypes.forEach(particleType => {
      this.particleTypeFormsArray.push(this.createParticleTypeForm(particleType));
    });
    
    // Update visibility
    this.updateParticleTypeVisibility();
  }
  
  private loadInitialData(): void {
    const data = this.initialData();
    if (data && this.dynamicParticleTypes().length > 0) {
      this.overallForm.patchValue(data.overall);
      this.viewMode.set(data.overall.viewMode);
      
      // Match initial data to dynamic particle types
      data.particleTypes.forEach((ptData: FerrographyParticleTypeData) => {
        const index = this.dynamicParticleTypes().indexOf(ptData.particleType);
        if (index >= 0) {
          const form = this.particleTypeFormsArray.at(index);
          if (form) {
            form.patchValue(ptData);
          }
        }
      });
      
      this.updateParticleTypeVisibility();
    }
  }
  
  private updateParticleTypeVisibility(): void {
    const mode = this.viewMode();
    const visibility: Record<string, boolean> = {};
    
    this.dynamicParticleTypes().forEach((type: string, index: number) => {
      const form = this.particleTypeFormsArray.at(index);
      const isSelected = form?.get('isSelected')?.value || false;
      
      if (mode === 'All') {
        visibility[type] = true;
      } else if (mode === 'Review') {
        visibility[type] = isSelected;
      }
    });
    
    this.particleTypeVisibility.set(visibility);
  }
  
  // Public methods for template
  toggleParticleTypeVisibility(particleType: string): void {
    const index = this.dynamicParticleTypes().indexOf(particleType);
    if (index >= 0) {
      const form = this.particleTypeFormsArray.at(index);
      const currentVisibility = form?.get('isVisible')?.value;
      form?.get('isVisible')?.setValue(!currentVisibility);
    }
  }
  
  toggleParticleTypeSelection(particleType: string): void {
    const index = this.dynamicParticleTypes().indexOf(particleType);
    if (index >= 0) {
      const form = this.particleTypeFormsArray.at(index);
      const currentSelection = form?.get('isSelected')?.value;
      form?.get('isSelected')?.setValue(!currentSelection);
      this.updateParticleTypeVisibility();
    }
  }
  
  addParticleCommentToOverall(particleType: string): void {
    const index = this.dynamicParticleTypes().indexOf(particleType);
    if (index >= 0) {
      const form = this.particleTypeFormsArray.at(index);
      const comment = form?.get('comments')?.value;
      const includeFlag = form?.get('includeCommentsInOverall')?.value;
      
      if (comment && includeFlag) {
        const overallComments = this.overallForm.get('overallComments')?.value || '';
        const newComment = overallComments ? `${overallComments}\n${particleType}: ${comment}` : `${particleType}: ${comment}`;
        
        if (newComment.length <= 1000) {
          this.overallForm.get('overallComments')?.setValue(newComment);
          form?.get('includeCommentsInOverall')?.setValue(false); // Reset flag after adding
        }
      }
    }
  }
  
  getParticleTypeForm(particleType: string): FormGroup {
    const index = this.dynamicParticleTypes().indexOf(particleType);
    return this.particleTypeFormsArray.at(index) as FormGroup;
  }
  
  isParticleTypeVisible(particleType: string): boolean {
    return this.particleTypeVisibility()[particleType] || false;
  }
  
  getVisibleParticleTypesCount(): number {
    const visibility = this.particleTypeVisibility();
    return Object.values(visibility).filter(visible => visible).length;
  }
  
  getParticleTypeDefinition(particleType: string): ParticleTypeDefinition | null {
    const definitions = this.particleTypeDefinitions();
    return definitions.find(def => def.type === particleType) || null;
  }
  
  retryLoadParticleTypes(): void {
    this.loadParticleTypeDefinitions();
  }
  
  onPartialSave(): void {
    const formData = this.getFormData();
    this.partialSave.emit(formData);
  }
  
  onSave(): void {
    const formData = this.getFormData();
    this.formDataChange.emit(formData);
  }
  
  onClear(): void {
    this.overallForm.reset({
      viewMode: 'All',
      mediaReady: false,
      partialSave: false
    });
    
    this.particleTypeFormsArray.controls.forEach(control => {
      const particleType = control.get('particleType')?.value;
      control.reset({
        particleType,
        isVisible: false,
        isSelected: false,
        includeCommentsInOverall: false
      });
    });
    
    this.viewMode.set('All');
    this.updateParticleTypeVisibility();
  }
  
  private getFormData(): FerrographyFormData {
    const overallData: FerrographyOverallData = {
      ...this.overallForm.value,
      overallComments: this.overallForm.value.overallComments || ''
    };
    
    const particleTypesData: FerrographyParticleTypeData[] = this.particleTypeFormsArray.controls.map(
      control => control.value as FerrographyParticleTypeData
    );
    
    return {
      sampleId: this.sampleId(),
      overall: overallData,
      particleTypes: particleTypesData,
      // Include lab comments from shared control if provided
      labComments: this.labCommentsControl() ? [this.labCommentsControl()!.value].filter(Boolean) : undefined
    };
  }
  
  private emitFormChanges(): void {
    const formData = this.getFormData();
    this.formDataChange.emit(formData);
    
    // Emit validation state
    const validation = this.validateForm();
    this.validationChange.emit(validation);
  }
  
  private validateForm(): FerrographyFormValidation {
    const overallErrors: string[] = [];
    const particleTypeErrors: Record<string, string[]> = {};
    
    // Overall form validation
    if (this.overallForm.get('overallComments')?.errors?.['maxlength']) {
      overallErrors.push('Overall comments exceed maximum length of 1000 characters');
    }
    
    // Particle type validation
    this.dynamicParticleTypes().forEach((particleType: string) => {
      particleTypeErrors[particleType] = [];
      // Add specific validation rules as needed
    });
    
    const isValid = overallErrors.length === 0 && 
                   Object.values(particleTypeErrors).every(errors => errors.length === 0);
    
    return {
      isValid,
      overallErrors,
      particleTypeErrors,
      commentLengthWarning: this.commentLimitWarning(),
      hasUnsavedChanges: this.overallForm.dirty || this.particleTypeFormsArray.dirty
    };
  }
}

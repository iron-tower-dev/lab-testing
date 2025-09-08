import { Component, OnInit, inject, input, output, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, FormControl, Validators } from '@angular/forms';
import { SharedModule } from '../../../../../../shared-module';
import { ParticleTypeCardComponent } from './components/particle-type-card.component';
import { ParticleTypesService } from '../../../../../../shared/services/particle-types.service';
import {
  FerrographyFormData,
  FerrographyParticleTypeData,
  FerrographyOverallData,
  FERROGRAPHY_PARTICLE_TYPES,
  FerrographyParticleType,
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
  styleUrl: './ferrography-entry-form.scss'
})
export class FerrographyEntryForm implements OnInit {
  // Injected services
  private readonly particleTypesService = inject(ParticleTypesService);
  
  // Input/Output signals following Angular best practices
  sampleId = input<number>();
  initialData = input<FerrographyFormData>();
  readOnly = input<boolean>(false);
  
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
  
  // Constants for templates
  readonly particleTypes = FERROGRAPHY_PARTICLE_TYPES;
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
  
  // Visibility tracking
  particleTypeVisibility = signal<Record<FerrographyParticleType, boolean>>(
    {} as Record<FerrographyParticleType, boolean>
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
    
    // Particle type forms array
    this.particleTypeFormsArray = this.fb.array(
      this.particleTypes.map((particleType: FerrographyParticleType) => this.createParticleTypeForm(particleType))
    );
  }
  
  private createParticleTypeForm(particleType: FerrographyParticleType): FormGroup {
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
        this.isLoadingParticleTypes.set(false);
        console.log('Loaded particle type definitions:', definitions.length);
      },
      error: (error: Error) => {
        console.error('Failed to load particle type definitions:', error);
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
      
      data.particleTypes.forEach((ptData: FerrographyParticleTypeData, index: number) => {
        const form = this.particleTypeFormsArray.at(index);
        if (form) {
          form.patchValue(ptData);
        }
      });
      
      this.updateParticleTypeVisibility();
    }
  }
  
  private updateParticleTypeVisibility(): void {
    const mode = this.viewMode();
    const visibility: Record<FerrographyParticleType, boolean> = {} as any;
    
    this.particleTypes.forEach((type: FerrographyParticleType, index: number) => {
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
  toggleParticleTypeVisibility(particleType: FerrographyParticleType): void {
    const index = this.particleTypes.indexOf(particleType);
    if (index >= 0) {
      const form = this.particleTypeFormsArray.at(index);
      const currentVisibility = form?.get('isVisible')?.value;
      form?.get('isVisible')?.setValue(!currentVisibility);
    }
  }
  
  toggleParticleTypeSelection(particleType: FerrographyParticleType): void {
    const index = this.particleTypes.indexOf(particleType);
    if (index >= 0) {
      const form = this.particleTypeFormsArray.at(index);
      const currentSelection = form?.get('isSelected')?.value;
      form?.get('isSelected')?.setValue(!currentSelection);
      this.updateParticleTypeVisibility();
    }
  }
  
  addParticleCommentToOverall(particleType: FerrographyParticleType): void {
    const index = this.particleTypes.indexOf(particleType);
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
  
  getParticleTypeForm(particleType: FerrographyParticleType): FormGroup {
    const index = this.particleTypes.indexOf(particleType);
    return this.particleTypeFormsArray.at(index) as FormGroup;
  }
  
  isParticleTypeVisible(particleType: FerrographyParticleType): boolean {
    return this.particleTypeVisibility()[particleType] || false;
  }
  
  getParticleTypeDefinition(particleType: FerrographyParticleType): ParticleTypeDefinition | null {
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
      particleTypes: particleTypesData
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
    const particleTypeErrors: Record<FerrographyParticleType, string[]> = {} as any;
    
    // Overall form validation
    if (this.overallForm.get('overallComments')?.errors?.['maxlength']) {
      overallErrors.push('Overall comments exceed maximum length of 1000 characters');
    }
    
    // Particle type validation
    this.particleTypes.forEach((particleType: FerrographyParticleType) => {
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

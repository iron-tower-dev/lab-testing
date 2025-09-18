import { Component, computed, inject, input, output, signal, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SharedModule } from '../../../../../../shared-module';
import { SampleWithTestInfo } from '../../../../../enter-results.types';
import { TestStandardsService } from '../../../../../../shared/services/test-standards.service';
import { TestFormDataService } from '../../../../../../shared/services/test-form-data.service';
import { TestTypesService } from '../../../../../../shared/services/test-types.service';
import { debounceTime, Subject, takeUntil, firstValueFrom } from 'rxjs';

// Filter inspection data interface
export interface FilterInspectionData {
  sampleId?: number;
  analystInitials: string;
  testStandard: string;
  filterType: string;
  filterSize: string;
  inspectionDate: string;
  visualAppearance: string;
  colorObservation: string;
  particleSize: 'none' | 'fine' | 'medium' | 'coarse' | 'mixed';
  particleAmount: 'none' | 'light' | 'moderate' | 'heavy';
  particleType: string[];
  contamination: string;
  filterCondition: 'good' | 'fair' | 'poor';
  recommendations: string;
  photographsTaken: boolean;
  photographFileNames: string;
  labComments: string;
}

@Component({
  standalone: true,
  selector: 'app-inspect-filter-entry-form',
  imports: [SharedModule],
  templateUrl: './inspect-filter-entry-form.html',
  styleUrl: './inspect-filter-entry-form.css'
})
export class InspectFilterEntryForm implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly testStandardsService = inject(TestStandardsService);
  private readonly testFormDataService = inject(TestFormDataService);
  private readonly testTypesService = inject(TestTypesService);
  
  // Input/Output signals
  sampleData = input<SampleWithTestInfo | null>(null);
  initialData = input<FilterInspectionData | null>(null);
  
  formDataChange = output<FilterInspectionData>();
  validationChange = output<boolean>();
  partialSave = output<FilterInspectionData>();
  
  // Form group
  form!: FormGroup;
  
  // Reactive signals
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  commentCharacterCount = signal(0);
  commentLimitWarning = computed(() => this.commentCharacterCount() > 800);
  
  // Component lifecycle
  private destroy$ = new Subject<void>();
  private autoSaveSubject = new Subject<FilterInspectionData>();
  
  // Test standards - loaded from API
  testStandardOptions = signal<{value: string; label: string}[]>([]);
  
  // Filter inspection options
  readonly filterTypes = [
    'Magnetic Drain Plug',
    'Suction Screen',
    'Return Filter',
    'Bypass Filter',
    'Inline Filter',
    'Other'
  ];
  
  readonly filterSizes = [
    '10 micron',
    '25 micron',
    '40 micron',
    '100 micron',
    'Other'
  ];
  
  readonly particleTypes = [
    'Metallic',
    'Non-metallic',
    'Organic',
    'Fibers',
    'Dirt/Dust',
    'Water',
    'Corrosion products',
    'Paint chips',
    'Seal material',
    'Other'
  ];
  
  readonly colorOptions = [
    'Clear/Colorless',
    'Light Yellow',
    'Dark Yellow',
    'Amber',
    'Brown',
    'Black',
    'Red',
    'Green',
    'Blue',
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
    this.form = this.fb.group({
      analystInitials: ['', [Validators.required, Validators.maxLength(5)]],
      testStandard: ['', Validators.required],
      filterType: ['', Validators.required],
      filterSize: ['', Validators.required],
      inspectionDate: [new Date().toISOString().split('T')[0], Validators.required],
      visualAppearance: ['', Validators.required],
      colorObservation: ['', Validators.required],
      particleSize: ['none', Validators.required],
      particleAmount: ['none', Validators.required],
      particleType: [[]],
      contamination: [''],
      filterCondition: ['good', Validators.required],
      recommendations: [''],
      photographsTaken: [false],
      photographFileNames: [''],
      labComments: ['', [Validators.maxLength(1000)]]
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
      
      const testTypeResponse = await firstValueFrom(this.testTypesService.getTestTypeByCode('INSPECT_FILTER'));
      if (!testTypeResponse.success || !testTypeResponse.data) {
        throw new Error('Failed to get test type for INSPECT_FILTER');
      }
      
      const testId = testTypeResponse.data.testId;
      const standards = await firstValueFrom(this.testStandardsService.getStandardOptions(testId));
      this.testStandardOptions.set(standards);
    } catch (error) {
      console.error('Failed to load test standards for Filter Inspection:', error);
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
        const testTypeResponse = await firstValueFrom(this.testTypesService.getTestTypeByCode('INSPECT_FILTER'));
        if (testTypeResponse.success && testTypeResponse.data) {
          const testId = testTypeResponse.data.testId;
          const response = await firstValueFrom(this.testFormDataService.getFormData(sampleData.sampleId, testId));
          if (response.success && response.data && response.data.formData) {
            this.populateForm(response.data.formData as FilterInspectionData);
          }
        }
      } catch (error) {
        console.error('Failed to load saved Filter Inspection data:', error);
        // Continue with empty form
      }
    }
  }
  
  private populateForm(data: FilterInspectionData): void {
    this.form.patchValue({
      analystInitials: data.analystInitials,
      testStandard: data.testStandard,
      filterType: data.filterType,
      filterSize: data.filterSize,
      inspectionDate: data.inspectionDate,
      visualAppearance: data.visualAppearance,
      colorObservation: data.colorObservation,
      particleSize: data.particleSize,
      particleAmount: data.particleAmount,
      particleType: data.particleType,
      contamination: data.contamination,
      filterCondition: data.filterCondition,
      recommendations: data.recommendations,
      photographsTaken: data.photographsTaken,
      photographFileNames: data.photographFileNames,
      labComments: data.labComments
    });
  }
  
  private async autoSaveFormData(formData: FilterInspectionData): Promise<void> {
    if (!this.sampleData()?.sampleId || !this.form.dirty) {
      return;
    }
    
    try {
      const testTypeResponse = await firstValueFrom(this.testTypesService.getTestTypeByCode('INSPECT_FILTER'));
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
    } catch (error) {
      console.error('Auto-save failed for Filter Inspection:', error);
    }
  }
  
  // Form validation and state
  formIsValid = computed(() => {
    return this.form.valid;
  });
  
  hasUnsavedChanges = computed(() => {
    return this.form.dirty;
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
  
  private getFormData(): FilterInspectionData {
    return {
      sampleId: this.sampleData()?.sampleId,
      analystInitials: this.form.get('analystInitials')?.value || '',
      testStandard: this.form.get('testStandard')?.value || '',
      filterType: this.form.get('filterType')?.value || '',
      filterSize: this.form.get('filterSize')?.value || '',
      inspectionDate: this.form.get('inspectionDate')?.value || '',
      visualAppearance: this.form.get('visualAppearance')?.value || '',
      colorObservation: this.form.get('colorObservation')?.value || '',
      particleSize: this.form.get('particleSize')?.value || 'none',
      particleAmount: this.form.get('particleAmount')?.value || 'none',
      particleType: this.form.get('particleType')?.value || [],
      contamination: this.form.get('contamination')?.value || '',
      filterCondition: this.form.get('filterCondition')?.value || 'good',
      recommendations: this.form.get('recommendations')?.value || '',
      photographsTaken: this.form.get('photographsTaken')?.value || false,
      photographFileNames: this.form.get('photographFileNames')?.value || '',
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
        const testTypeResponse = await firstValueFrom(this.testTypesService.getTestTypeByCode('INSPECT_FILTER'));
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
      console.log('Successfully saved Filter Inspection data');
      
    } catch (error) {
      this.errorMessage.set('Failed to save data. Please try again.');
      console.error('Error saving Filter Inspection data:', error);
    } finally {
      this.isLoading.set(false);
    }
  }
  
  onClear(): void {
    this.form.reset({
      analystInitials: '',
      testStandard: '',
      filterType: '',
      filterSize: '',
      inspectionDate: new Date().toISOString().split('T')[0],
      visualAppearance: '',
      colorObservation: '',
      particleSize: 'none',
      particleAmount: 'none',
      particleType: [],
      contamination: '',
      filterCondition: 'good',
      recommendations: '',
      photographsTaken: false,
      photographFileNames: '',
      labComments: ''
    });
    
    this.errorMessage.set(null);
  }
}

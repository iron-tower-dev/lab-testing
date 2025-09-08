import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { FerrographyEntryForm } from './ferrography-entry-form';
import { ParticleTypeCardComponent } from './components/particle-type-card.component';
import { ParticleTypesService } from '../../../../../../shared/services/particle-types.service';
import { ApiService } from '../../../../../../shared/services/api.service';
import {
  FERROGRAPHY_PARTICLE_TYPES,
  FerrographyFormData,
  FerrographyParticleType,
  FerrographyViewMode,
  ParticleTypeDefinition
} from '../../../../../enter-results.types';

describe('FerrographyEntryForm', () => {
  let component: FerrographyEntryForm;
  let fixture: ComponentFixture<FerrographyEntryForm>;

  const mockParticleTypeDefinitions: ParticleTypeDefinition[] = [
    {
      id: 1,
      type: 'Rubbing Wear (Platelet)',
      description: 'Free metal particles with smooth surfaces.',
      image1: 'rwp1.jpg',
      image2: 'rwp2.jpg',
      active: '1',
      sortOrder: 0
    },
    {
      id: 2,
      type: 'Rubbing Wear',
      description: 'Flat platlets with similar dimensions.',
      image1: 'rw1.jpg',
      image2: 'rw2.jpg',
      active: '1',
      sortOrder: 1
    }
  ];

  const mockFormData: FerrographyFormData = {
    sampleId: 12345,
    overall: {
      overallSeverity: 2,
      dilutionFactor: '1:10',
      customDilutionFactor: '',
      overallComments: 'Test overall comments',
      viewMode: 'All' as FerrographyViewMode,
      mediaReady: false,
      partialSave: false
    },
    particleTypes: FERROGRAPHY_PARTICLE_TYPES.map((type: FerrographyParticleType) => ({
      particleType: type,
      isVisible: false,
      isSelected: false,
      includeCommentsInOverall: false
    }))
  };

  let mockParticleTypesService: jasmine.SpyObj<ParticleTypesService>;
  let mockApiService: jasmine.SpyObj<ApiService>;

  beforeEach(async () => {
    // Create spy objects
    mockParticleTypesService = jasmine.createSpyObj('ParticleTypesService', [
      'getActiveParticleTypes',
      'getParticleTypes',
      'getParticleTypeById',
      'getParticleTypeByTypeName',
      'searchParticleTypes',
      'createParticleType',
      'updateParticleType',
      'deleteParticleType',
      'refreshCache',
      'clearCache'
    ]);
    
    mockApiService = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);
    
    // Set up default mock return values
    mockParticleTypesService.getActiveParticleTypes.and.returnValue(of(mockParticleTypeDefinitions));
    mockParticleTypesService.getParticleTypes.and.returnValue(of(mockParticleTypeDefinitions));

    await TestBed.configureTestingModule({
      imports: [
        FerrographyEntryForm,
        ParticleTypeCardComponent,
        ReactiveFormsModule,
        NoopAnimationsModule,
        HttpClientTestingModule
      ],
      providers: [
        { provide: ParticleTypesService, useValue: mockParticleTypesService },
        { provide: ApiService, useValue: mockApiService }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FerrographyEntryForm);
    component = fixture.componentInstance;
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should initialize with correct number of particle types', () => {
      fixture.detectChanges();
      expect(component.particleTypes.length).toBe(16);
      expect(component.particleTypeFormsArray.length).toBe(16);
    });

    it('should initialize forms with default values', () => {
      fixture.detectChanges();
      
      expect(component.overallForm.get('viewMode')?.value).toBe('All');
      expect(component.overallForm.get('mediaReady')?.value).toBe(false);
      expect(component.overallForm.get('partialSave')?.value).toBe(false);
    });

    it('should load initial data when provided', () => {
      fixture.componentRef.setInput('initialData', mockFormData);
      fixture.detectChanges();
      
      expect(component.overallForm.get('overallSeverity')?.value).toBe(2);
      expect(component.overallForm.get('dilutionFactor')?.value).toBe('1:10');
      expect(component.overallForm.get('overallComments')?.value).toBe('Test overall comments');
    });
  });

  describe('Particle Type Management', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should toggle particle type visibility', () => {
      const particleType = FERROGRAPHY_PARTICLE_TYPES[0];
      const form = component.getParticleTypeForm(particleType);
      
      expect(form.get('isVisible')?.value).toBe(false);
      
      component.toggleParticleTypeVisibility(particleType);
      
      expect(form.get('isVisible')?.value).toBe(true);
    });

    it('should toggle particle type selection', () => {
      const particleType = FERROGRAPHY_PARTICLE_TYPES[0];
      const form = component.getParticleTypeForm(particleType);
      
      expect(form.get('isSelected')?.value).toBe(false);
      
      component.toggleParticleTypeSelection(particleType);
      
      expect(form.get('isSelected')?.value).toBe(true);
    });

    it('should return correct particle type form', () => {
      const particleType = FERROGRAPHY_PARTICLE_TYPES[0];
      const form = component.getParticleTypeForm(particleType);
      
      expect(form.get('particleType')?.value).toBe(particleType);
    });
    
    it('should return correct particle type definition', () => {
      const particleType = 'Rubbing Wear (Platelet)' as FerrographyParticleType;
      const definition = component.getParticleTypeDefinition(particleType);
      
      expect(definition).toBeTruthy();
      expect(definition?.type).toBe(particleType);
      expect(definition?.id).toBe(1);
    });
    
    it('should return null for unknown particle type', () => {
      const unknownType = 'Unknown Type' as FerrographyParticleType;
      const definition = component.getParticleTypeDefinition(unknownType);
      
      expect(definition).toBeNull();
    });
  });

  describe('View Mode Management', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should update view mode signal when form changes', () => {
      component.overallForm.get('viewMode')?.setValue('Review');
      
      expect(component.viewMode()).toBe('Review');
    });

    it('should show all particle types in All mode', () => {
      component.overallForm.get('viewMode')?.setValue('All');
      
      FERROGRAPHY_PARTICLE_TYPES.forEach(type => {
        expect(component.isParticleTypeVisible(type)).toBe(true);
      });
    });

    it('should show only selected particle types in Review mode', () => {
      const selectedType = FERROGRAPHY_PARTICLE_TYPES[0];
      const unselectedType = FERROGRAPHY_PARTICLE_TYPES[1];
      
      // Set one particle type as selected
      component.toggleParticleTypeSelection(selectedType);
      component.overallForm.get('viewMode')?.setValue('Review');
      
      expect(component.isParticleTypeVisible(selectedType)).toBe(true);
      expect(component.isParticleTypeVisible(unselectedType)).toBe(false);
    });
  });

  describe('Comment Management', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should track comment character count', () => {
      const testComment = 'Test comment';
      component.overallForm.get('overallComments')?.setValue(testComment);
      
      expect(component.commentCharacterCount()).toBe(testComment.length);
    });

    it('should show warning when approaching character limit', () => {
      const longComment = 'x'.repeat(950);
      component.overallForm.get('overallComments')?.setValue(longComment);
      
      expect(component.commentLimitWarning()).toBe(true);
      expect(component.commentLimitExceeded()).toBe(false);
    });

    it('should show error when exceeding character limit', () => {
      const tooLongComment = 'x'.repeat(1050);
      component.overallForm.get('overallComments')?.setValue(tooLongComment);
      
      expect(component.commentLimitWarning()).toBe(true);
      expect(component.commentLimitExceeded()).toBe(true);
    });

    it('should append particle type comment to overall comments', () => {
      const particleType = FERROGRAPHY_PARTICLE_TYPES[0];
      const form = component.getParticleTypeForm(particleType);
      const particleComment = 'Particle specific comment';
      
      form.get('comments')?.setValue(particleComment);
      form.get('includeCommentsInOverall')?.setValue(true);
      
      component.addParticleCommentToOverall(particleType);
      
      const overallComments = component.overallForm.get('overallComments')?.value;
      expect(overallComments).toContain(particleType);
      expect(overallComments).toContain(particleComment);
      expect(form.get('includeCommentsInOverall')?.value).toBe(false);
    });
  });

  describe('Form Actions', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should emit form data on save', () => {
      spyOn(component.formDataChange, 'emit');
      
      component.onSave();
      
      expect(component.formDataChange.emit).toHaveBeenCalled();
    });

    it('should emit form data on partial save', () => {
      spyOn(component.partialSave, 'emit');
      
      component.onPartialSave();
      
      expect(component.partialSave.emit).toHaveBeenCalled();
    });

    it('should clear form on clear action', () => {
      // Set some values
      component.overallForm.get('overallSeverity')?.setValue(3);
      component.overallForm.get('overallComments')?.setValue('Test comment');
      
      component.onClear();
      
      expect(component.overallForm.get('overallSeverity')?.value).toBeNull();
      expect(component.overallForm.get('overallComments')?.value).toBeNull();
      expect(component.overallForm.get('viewMode')?.value).toBe('All');
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should validate comment length', () => {
      const tooLongComment = 'x'.repeat(1050);
      component.overallForm.get('overallComments')?.setValue(tooLongComment);
      
      expect(component.overallForm.get('overallComments')?.errors?.['maxlength']).toBeTruthy();
    });

    it('should emit validation changes', () => {
      spyOn(component.validationChange, 'emit');
      
      // Trigger form change
      component.overallForm.get('overallSeverity')?.setValue(2);
      
      expect(component.validationChange.emit).toHaveBeenCalled();
    });
  });

  describe('Read-only Mode', () => {
    it('should disable form when in read-only mode', () => {
      fixture.componentRef.setInput('readOnly', true);
      fixture.detectChanges();
      
      expect(component.readOnly()).toBe(true);
    });
  });

  describe('Sample ID Input', () => {
    it('should display sample ID when provided', () => {
      const sampleId = 12345;
      fixture.componentRef.setInput('sampleId', sampleId);
      fixture.detectChanges();
      
      expect(component.sampleId()).toBe(sampleId);
    });
  });

  describe('Constants and Options', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should have correct heat options', () => {
      expect(component.heatOptions).toEqual([
        'NA', 'Blue', 'Straw', 'Purple', 'No Change', 'Melted', 'Charred'
      ]);
    });

    it('should have correct concentration options', () => {
      expect(component.concentrationOptions).toEqual([
        'Few', 'Moderate', 'Many', 'Heavy'
      ]);
    });

    it('should have correct size options', () => {
      expect(component.sizeOptions).toContain('Fine, <5µm');
      expect(component.sizeOptions).toContain('Huge, >100µm');
      expect(component.sizeOptions.length).toBe(5);
    });

    it('should have correct severity options', () => {
      expect(component.severityOptions).toEqual([1, 2, 3, 4]);
    });

    it('should have correct dilution factor options', () => {
      expect(component.dilutionFactorOptions).toEqual(['3:2', '1:10', '1:100', 'Manual']);
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should handle empty particle type comment append', () => {
      const particleType = FERROGRAPHY_PARTICLE_TYPES[0];
      const form = component.getParticleTypeForm(particleType);
      const initialComments = component.overallForm.get('overallComments')?.value;
      
      form.get('comments')?.setValue('');
      form.get('includeCommentsInOverall')?.setValue(true);
      
      component.addParticleCommentToOverall(particleType);
      
      expect(component.overallForm.get('overallComments')?.value).toBe(initialComments);
    });

    it('should not append comment when flag is false', () => {
      const particleType = FERROGRAPHY_PARTICLE_TYPES[0];
      const form = component.getParticleTypeForm(particleType);
      const initialComments = component.overallForm.get('overallComments')?.value;
      
      form.get('comments')?.setValue('Test comment');
      form.get('includeCommentsInOverall')?.setValue(false);
      
      component.addParticleCommentToOverall(particleType);
      
      expect(component.overallForm.get('overallComments')?.value).toBe(initialComments);
    });

    it('should handle invalid particle type in toggle methods', () => {
      const invalidType = 'Invalid Particle Type' as FerrographyParticleType;
      
      expect(() => {
        component.toggleParticleTypeVisibility(invalidType);
      }).not.toThrow();
      
      expect(() => {
        component.toggleParticleTypeSelection(invalidType);
      }).not.toThrow();
    });
  });
});

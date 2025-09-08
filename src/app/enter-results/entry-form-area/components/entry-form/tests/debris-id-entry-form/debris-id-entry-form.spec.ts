import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { 
  DebrisIdEntryForm, 
  DebrisIdFormData, 
  DebrisIdParticleType,
  DebrisIdFormValidation 
} from './debris-id-entry-form';
import { SharedModule } from '../../../../../../shared-module';
import { ParticleTypesService } from '../../../../../../shared/services/particle-types.service';
import { ApiService } from '../../../../../../shared/services/api.service';

describe('DebrisIdEntryForm', () => {
  let component: DebrisIdEntryForm;
  let fixture: ComponentFixture<DebrisIdEntryForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        DebrisIdEntryForm,
        ReactiveFormsModule,
        NoopAnimationsModule,
        SharedModule,
        HttpClientTestingModule
      ],
      providers: [ParticleTypesService, ApiService]
    }).compileComponents();

    fixture = TestBed.createComponent(DebrisIdEntryForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with 10 particle type forms', () => {
    expect(component.particleTypeFormsArray.length).toBe(10);
    expect(component.debrisParticleTypes.length).toBe(10);
  });

  it('should have required analyst initials field', () => {
    const analystInitials = component.overallForm.get('analystInitials');
    expect(analystInitials?.hasError('required')).toBeTruthy();
    
    analystInitials?.setValue('ABC');
    expect(analystInitials?.hasError('required')).toBeFalsy();
  });

  it('should validate analyst initials max length', () => {
    const analystInitials = component.overallForm.get('analystInitials');
    analystInitials?.setValue('ABCDEF'); // 6 characters, over the limit
    
    expect(analystInitials?.hasError('maxlength')).toBeTruthy();
    
    analystInitials?.setValue('ABCDE'); // 5 characters, at the limit
    expect(analystInitials?.hasError('maxlength')).toBeFalsy();
  });

  it('should have default test standard', () => {
    expect(component.overallForm.get('testStandard')?.value).toBe('ASTM-D7670');
  });

  it('should initialize all particle types as visible', () => {
    component.debrisParticleTypes.forEach((particleType, index) => {
      expect(component.getParticleTypeForm(index).get('isVisible')?.value).toBeTruthy();
    });
  });

  it('should track selected particle count', () => {
    expect(component.selectedParticleCount()).toBe(0);
    
    // Select first particle type
    component.getParticleTypeForm(0).get('isSelected')?.setValue(true);
    fixture.detectChanges();
    
    expect(component.selectedParticleCount()).toBe(1);
    
    // Select second particle type
    component.getParticleTypeForm(1).get('isSelected')?.setValue(true);
    fixture.detectChanges();
    
    expect(component.selectedParticleCount()).toBe(2);
  });

  it('should update particle type visibility based on view mode', () => {
    // Set to "All" mode (default)
    expect(component.viewMode()).toBe('All');
    component.debrisParticleTypes.forEach(particleType => {
      expect(component.isParticleTypeVisible(particleType)).toBeTruthy();
    });
    
    // Select one particle type and switch to "Selected" mode
    component.getParticleTypeForm(0).get('isSelected')?.setValue(true);
    component.overallForm.get('viewMode')?.setValue('Selected');
    fixture.detectChanges();
    
    expect(component.isParticleTypeVisible('Metallic Debris')).toBeTruthy();
    expect(component.isParticleTypeVisible('Organic Debris')).toBeFalsy();
  });

  it('should validate selected particle types require concentration and severity', () => {
    // Select a particle type but don't provide required fields
    const particleForm = component.getParticleTypeForm(0);
    particleForm.get('isSelected')?.setValue(true);
    
    const validation = component['validateForm']();
    expect(validation.isValid).toBeFalsy();
    expect(validation.particleTypeErrors['Metallic Debris']).toContain('Concentration is required for selected particle types');
    expect(validation.particleTypeErrors['Metallic Debris']).toContain('Severity rating is required for selected particle types');
    
    // Provide required fields
    particleForm.get('concentration')?.setValue('Moderate');
    particleForm.get('severity')?.setValue(3);
    
    const validValidation = component['validateForm']();
    expect(validValidation.particleTypeErrors['Metallic Debris']).toBeUndefined();
  });

  it('should validate observations character limit', () => {
    const particleForm = component.getParticleTypeForm(0);
    const longObservations = 'a'.repeat(501); // Over the 500 character limit
    
    particleForm.get('observations')?.setValue(longObservations);
    
    const validation = component['validateForm']();
    expect(validation.particleTypeErrors['Metallic Debris']).toContain('Observations cannot exceed 500 characters');
  });

  it('should track overall comments character count', () => {
    expect(component.commentCharacterCount()).toBe(0);
    
    component.overallForm.get('overallComments')?.setValue('Test comment');
    fixture.detectChanges();
    
    expect(component.commentCharacterCount()).toBe(12);
  });

  it('should show character count warnings', () => {
    // Test warning threshold (900+ characters)
    const warningComment = 'a'.repeat(950);
    component.overallForm.get('overallComments')?.setValue(warningComment);
    fixture.detectChanges();
    
    expect(component.commentLimitWarning()).toBeTruthy();
    expect(component.commentLimitExceeded()).toBeFalsy();
    
    // Test exceeded threshold (1000+ characters)
    const exceededComment = 'a'.repeat(1050);
    component.overallForm.get('overallComments')?.setValue(exceededComment);
    fixture.detectChanges();
    
    expect(component.commentLimitWarning()).toBeTruthy();
    expect(component.commentLimitExceeded()).toBeTruthy();
  });

  it('should select/deselect all particle types', () => {
    // Initially none selected
    expect(component.selectedParticleCount()).toBe(0);
    
    // Select all
    component.onSelectAllParticleTypes();
    expect(component.selectedParticleCount()).toBe(component.debrisParticleTypes.length);
    
    // Deselect all
    component.onSelectAllParticleTypes();
    expect(component.selectedParticleCount()).toBe(0);
  });

  it('should clear selected particle types', () => {
    // Select and populate first particle type
    const particleForm = component.getParticleTypeForm(0);
    particleForm.patchValue({
      isSelected: true,
      concentration: 'Heavy',
      severity: 4,
      observations: 'Test observation',
      recommendedAction: 'Test action'
    });
    
    expect(component.selectedParticleCount()).toBe(1);
    
    // Clear selected
    component.onClearSelectedParticleTypes();
    
    expect(component.selectedParticleCount()).toBe(0);
    expect(particleForm.get('concentration')?.value).toBe('');
    expect(particleForm.get('observations')?.value).toBe('');
  });

  it('should toggle individual particle type', () => {
    const particleForm = component.getParticleTypeForm(0);
    expect(particleForm.get('isSelected')?.value).toBeFalsy();
    
    component.onToggleParticleType(0);
    expect(particleForm.get('isSelected')?.value).toBeTruthy();
    
    component.onToggleParticleType(0);
    expect(particleForm.get('isSelected')?.value).toBeFalsy();
  });

  it('should emit form data changes', () => {
    spyOn(component.formDataChange, 'emit');
    
    component.overallForm.get('analystInitials')?.setValue('ABC');
    
    expect(component.formDataChange.emit).toHaveBeenCalled();
  });

  it('should validate overall form correctly', () => {
    // Initially invalid (no analyst initials)
    const validation = component['validateForm']();
    expect(validation.isValid).toBeFalsy();
    expect(validation.overallErrors).toContain('Analyst initials are required');
    
    // Make valid
    component.overallForm.get('analystInitials')?.setValue('ABC');
    component.getParticleTypeForm(0).patchValue({
      isSelected: true,
      concentration: 'Moderate',
      severity: 3
    });
    
    const validValidation = component['validateForm']();
    expect(validValidation.isValid).toBeTruthy();
  });

  it('should handle save operation when valid', () => {
    spyOn(component.formDataChange, 'emit');
    
    // Set up valid form
    component.overallForm.get('analystInitials')?.setValue('ABC');
    component.getParticleTypeForm(0).patchValue({
      isSelected: true,
      concentration: 'Moderate',
      severity: 3
    });
    
    component.onSave();
    
    expect(component.formDataChange.emit).toHaveBeenCalled();
    const emittedData = (component.formDataChange.emit as jasmine.Spy).calls.mostRecent().args[0];
    expect(emittedData.overall.analysisComplete).toBeTruthy();
  });

  it('should handle partial save operation', () => {
    spyOn(component.partialSave, 'emit');
    
    component.overallForm.get('analystInitials')?.setValue('ABC');
    
    component.onPartialSave();
    
    expect(component.partialSave.emit).toHaveBeenCalled();
    const emittedData = (component.partialSave.emit as jasmine.Spy).calls.mostRecent().args[0];
    expect(emittedData.overall.partialSave).toBeTruthy();
  });

  it('should handle form reset properly', () => {
    // Set up form data
    component.overallForm.get('analystInitials')?.setValue('ABC');
    component.overallForm.get('overallComments')?.setValue('Test comment');
    component.getParticleTypeForm(0).patchValue({
      isSelected: true,
      concentration: 'Heavy',
      observations: 'Test observation'
    });
    
    component.onClear();
    
    expect(component.overallForm.get('analystInitials')?.value).toBeNull();
    expect(component.overallForm.get('overallComments')?.value).toBeNull();
    expect(component.overallForm.get('testStandard')?.value).toBe('ASTM-D7670'); // Should reset to default
    expect(component.getParticleTypeForm(0).get('isSelected')?.value).toBeFalsy();
    expect(component.getParticleTypeForm(0).get('concentration')?.value).toBe('');
  });

  it('should handle sample data input', () => {
    const mockSampleData = {
      sampleId: 123,
      sampleNumber: 'DebrisID-001',
      testName: 'Debris Identification',
      eqTagNum: 'EQ-001',
      component: 'Motor',
      location: 'Plant A',
      lubeType: 'SAE 10W-30',
      techData: 'Test data',
      qualityClass: 'Premium',
      labComments: ['Test comment'],
      testReference: {
        id: 240,
        name: 'Debris Identification',
        abbrev: 'DebrisID',
        shortAbbrev: 'Debr',
        groupName: 'PHYSICAL & CHEMICAL PROPERTIES'
      }
    };

    fixture.componentRef.setInput('sampleData', mockSampleData);
    fixture.detectChanges();

    expect(component.sampleData()).toEqual(mockSampleData);
  });

  it('should handle initial data loading', () => {
    const initialData: DebrisIdFormData = {
      sampleId: 123,
      overall: {
        overallSeverity: 3,
        analystInitials: 'ABC',
        testStandard: 'ASTM-D7670',
        equipmentUsed: 'Microscope',
        magnification: '400x',
        overallComments: 'Initial test',
        recommendedActions: 'Monitor closely',
        viewMode: 'Review',
        analysisComplete: false,
        partialSave: false
      },
      particleTypes: [
        {
          particleType: 'Metallic Debris',
          isVisible: true,
          isSelected: true,
          concentration: 'Moderate',
          sizeRange: 'Medium 25-50µm',
          primaryShape: 'Angular',
          composition: 'Iron/Steel',
          severity: 3,
          observations: 'Metal particles observed',
          recommendedAction: 'Schedule maintenance',
          includeInReport: true
        }
      ]
    };

    fixture.componentRef.setInput('initialData', initialData);
    component.loadInitialData();

    expect(component.overallForm.get('analystInitials')?.value).toBe('ABC');
    expect(component.overallForm.get('overallComments')?.value).toBe('Initial test');
    expect(component.viewMode()).toBe('Review');
    expect(component.getParticleTypeForm(0).get('isSelected')?.value).toBeTruthy();
    expect(component.getParticleTypeForm(0).get('concentration')?.value).toBe('Moderate');
  });

  it('should emit validation changes', () => {
    spyOn(component.validationChange, 'emit');
    
    component.overallForm.get('analystInitials')?.setValue('ABC');
    
    expect(component.validationChange.emit).toHaveBeenCalled();
    const validation: DebrisIdFormValidation = (component.validationChange.emit as jasmine.Spy).calls.mostRecent().args[0];
    expect(validation).toBeDefined();
    expect(validation.hasUnsavedChanges).toBeTruthy();
  });

  it('should disable save button when invalid', () => {
    fixture.detectChanges();
    const saveButton = fixture.nativeElement.querySelector('button[color="primary"]');
    
    expect(saveButton.disabled).toBeTruthy();
    
    // Make form valid
    component.overallForm.get('analystInitials')?.setValue('ABC');
    component.getParticleTypeForm(0).patchValue({
      isSelected: true,
      concentration: 'Moderate',
      severity: 3
    });
    fixture.detectChanges();
    
    expect(saveButton.disabled).toBeFalsy();
  });

  it('should show validation error messages in template', () => {
    fixture.detectChanges();
    
    // Should show analyst initials error
    const errorMessages = fixture.nativeElement.querySelectorAll('.validation-summary li');
    expect(errorMessages.length).toBeGreaterThan(0);
    
    const analystError = Array.from(errorMessages).find((el: Element) => 
      el.textContent?.includes('Analyst initials are required')
    );
    expect(analystError).toBeTruthy();
  });

  afterEach(() => {
    fixture.destroy();
  });
});

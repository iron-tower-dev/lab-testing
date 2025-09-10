import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Vis40EntryForm } from './vis40-entry-form';
import { SharedModule } from '../../../../../../shared-module';
import { SampleWithTestInfo } from '../../../../../enter-results.types';
import { TestReadingsService } from '../../../../../../shared/services/test-readings.service';
import { SampleService } from '../../../../../../shared/services/sample.service';
import { TestTypesService } from '../../../../../../shared/services/test-types.service';

describe('Vis40EntryForm', () => {
  let component: Vis40EntryForm;
  let fixture: ComponentFixture<Vis40EntryForm>;
  let testReadingsServiceSpy: jasmine.SpyObj<TestReadingsService>;
  let sampleServiceSpy: jasmine.SpyObj<SampleService>;
  let testTypesServiceSpy: jasmine.SpyObj<TestTypesService>;

  const mockSampleData: SampleWithTestInfo = {
    sampleId: 123,
    sampleNumber: 'SAMPLE-123',
    testName: 'Viscosity @ 40',
    eqTagNum: 'EQ-456',
    component: 'Main Engine',
    location: 'Plant A',
    lubeType: 'ISO VG 46',
    techData: 'Standard test procedure',
    qualityClass: 'Premium',
    labComments: ['Check for contaminants'],
    testReference: {
      id: 50,
      name: 'Viscosity @ 40',
      abbrev: 'Vis@40',
      shortAbbrev: 'V 40',
      groupName: 'PHYSICAL & CHEMICAL PROPERTIES'
    }
  };

  beforeEach(async () => {
    // Create spies for the services
    testReadingsServiceSpy = jasmine.createSpyObj('TestReadingsService', 
      ['validateCalculation', 'createTestReading', 'updateTestReading']);
    sampleServiceSpy = jasmine.createSpyObj('SampleService', ['getSample']);
    testTypesServiceSpy = jasmine.createSpyObj('TestTypesService', ['getTestType']);

    // Configure the TestBed
    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        ReactiveFormsModule,
        SharedModule,
        Vis40EntryForm
      ],
      providers: [
        { provide: TestReadingsService, useValue: testReadingsServiceSpy },
        { provide: SampleService, useValue: sampleServiceSpy },
        { provide: TestTypesService, useValue: testTypesServiceSpy }
      ]
    }).compileComponents();

    // Create the component
    fixture = TestBed.createComponent(Vis40EntryForm);
    component = fixture.componentInstance;
    
    // Set up initial test conditions
    component.sampleData.set(mockSampleData);
    testReadingsServiceSpy.validateCalculation.and.returnValue({ 
      isValid: true, 
      result: 46.0
    });
    
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the form with required controls', () => {
    expect(component.form).toBeDefined();
    expect(component.form.get('analystInitials')).toBeDefined();
    expect(component.form.get('viscometerConstant')).toBeDefined();
    expect(component.form.get('testTemperature')).toBeDefined();
    expect(component.form.get('run1Time')).toBeDefined();
    expect(component.form.get('run2Time')).toBeDefined();
    expect(component.form.get('run3Time')).toBeDefined();
    expect(component.form.get('run4Time')).toBeDefined();
  });

  it('should calculate viscosity when form values change', () => {
    // Set form values
    component.form.patchValue({
      viscometerConstant: 0.1,
      run1Time: 400,
      run2Time: 410
    });
    
    // Trigger change detection
    fixture.detectChanges();
    
    // Check if calculation was performed
    expect(testReadingsServiceSpy.validateCalculation).toHaveBeenCalled();
    expect(component.averageViscosity).toBeGreaterThan(0);
  });

  it('should identify acceptable time variation', () => {
    // Set form values with close time measurements (low variation)
    component.form.patchValue({
      run1Time: 400,
      run2Time: 401
    });
    
    fixture.detectChanges();
    
    expect(component.getTimeVariation()).toBeLessThan(0.5);
    expect(component.isTimeVariationAcceptable()).toBeTrue();
  });

  it('should identify unacceptable time variation', () => {
    // Set form values with divergent time measurements (high variation)
    component.form.patchValue({
      run1Time: 400,
      run2Time: 410
    });
    
    fixture.detectChanges();
    
    expect(component.getTimeVariation()).toBeGreaterThan(0.2);
    expect(component.isTimeVariationAcceptable()).toBeFalse();
  });

  it('should reset form when onClear is called', () => {
    // Fill form with data
    component.form.patchValue({
      analystInitials: 'ABC',
      viscometerConstant: 0.1,
      testTemperature: 40.0,
      run1Time: 400,
      run2Time: 410
    });
    
    // Verify form has values
    expect(component.form.get('analystInitials')?.value).toBe('ABC');
    
    // Call clear method
    component.onClear();
    
    // Verify form was reset
    expect(component.form.get('analystInitials')?.value).toBeFalsy();
    expect(component.averageViscosity).toBe(0);
  });

  it('should categorize viscosity into ISO 3448 grade', () => {
    // Set component state for a VG 46 oil
    component.averageViscosity = 46.0;
    
    expect(component.getISO3448Grade()).toBe('VG 46');
    
    // Check another grade
    component.averageViscosity = 68.0;
    
    expect(component.getISO3448Grade()).toBe('VG 68');
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Vis100EntryForm } from './vis100-entry-form';
import { SharedModule } from '../../../../../../shared-module';
import { SampleWithTestInfo } from '../../../../../enter-results.types';
import { TestReadingsService } from '../../../../../../shared/services/test-readings.service';
import { SampleService } from '../../../../../../shared/services/sample.service';
import { TestTypesService } from '../../../../../../shared/services/test-types.service';

describe('Vis100EntryForm', () => {
  let component: Vis100EntryForm;
  let fixture: ComponentFixture<Vis100EntryForm>;
  let testReadingsServiceSpy: jasmine.SpyObj<TestReadingsService>;
  let sampleServiceSpy: jasmine.SpyObj<SampleService>;
  let testTypesServiceSpy: jasmine.SpyObj<TestTypesService>;

  const mockSampleData: SampleWithTestInfo = {
    sampleId: 124,
    sampleNumber: 'SAMPLE-124',
    testName: 'Viscosity @ 100',
    eqTagNum: 'EQ-456',
    component: 'Main Engine',
    location: 'Plant A',
    lubeType: 'ISO VG 46',
    techData: 'Standard test procedure',
    qualityClass: 'Premium',
    labComments: ['Check viscosity index'],
    testReference: {
      id: 60,
      name: 'Viscosity @ 100',
      abbrev: 'Vis@100',
      shortAbbrev: 'V 100',
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
        Vis100EntryForm
      ],
      providers: [
        { provide: TestReadingsService, useValue: testReadingsServiceSpy },
        { provide: SampleService, useValue: sampleServiceSpy },
        { provide: TestTypesService, useValue: testTypesServiceSpy }
      ]
    }).compileComponents();

    // Create the component
    fixture = TestBed.createComponent(Vis100EntryForm);
    component = fixture.componentInstance;
    
    // Set up initial test conditions
    component.sampleData.set(mockSampleData);
    testReadingsServiceSpy.validateCalculation.and.returnValue({ 
      isValid: true, 
      result: 7.8
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
    expect(component.form.get('vis40Result')).toBeDefined();
    expect(component.form.get('run1Time')).toBeDefined();
    expect(component.form.get('run2Time')).toBeDefined();
    expect(component.form.get('run3Time')).toBeDefined();
    expect(component.form.get('run4Time')).toBeDefined();
  });

  it('should calculate viscosity and viscosity index when form values change', () => {
    // Set form values
    component.form.patchValue({
      viscometerConstant: 0.01,
      vis40Result: 46.0,
      run1Time: 300,
      run2Time: 310
    });
    
    // Trigger change detection
    fixture.detectChanges();
    
    // Check if calculation was performed
    expect(testReadingsServiceSpy.validateCalculation).toHaveBeenCalled();
    expect(component.averageViscosity).toBeGreaterThan(0);
    expect(component.viscosityIndex).toBeGreaterThan(0);
  });

  it('should calculate viscosity ratio correctly', () => {
    // Set known values
    component.form.patchValue({
      vis40Result: 46.0
    });
    component.averageViscosity = 7.8;
    
    const ratio = component.getViscosityRatio();
    expect(ratio).toBeCloseTo(5.9, 1); // 46.0 / 7.8 ≈ 5.9
  });

  it('should classify viscosity index correctly', () => {
    // Test different VI ranges
    component.viscosityIndex = 30;
    expect(component.getVIClassification()).toBe('Poor VI');
    
    component.viscosityIndex = 75;
    expect(component.getVIClassification()).toBe('Fair VI');
    
    component.viscosityIndex = 105;
    expect(component.getVIClassification()).toBe('Good VI');
    
    component.viscosityIndex = 150;
    expect(component.getVIClassification()).toBe('Excellent VI');
  });

  it('should identify reasonable viscosity index values', () => {
    component.viscosityIndex = 100;
    expect(component.isViscosityIndexReasonable()).toBeTrue();
    
    component.viscosityIndex = -60; // Unreasonable
    expect(component.isViscosityIndexReasonable()).toBeFalse();
    
    component.viscosityIndex = 350; // Unreasonable
    expect(component.isViscosityIndexReasonable()).toBeFalse();
  });

  it('should identify acceptable temperature control', () => {
    // Acceptable temperature (within ±0.02°C of 100°C)
    component.form.patchValue({ testTemperature: 100.01 });
    expect(component.isTemperatureControlAcceptable()).toBeTrue();
    
    // Unacceptable temperature (outside ±0.02°C range)
    component.form.patchValue({ testTemperature: 100.05 });
    expect(component.isTemperatureControlAcceptable()).toBeFalse();
  });

  it('should reset form and calculations when onClear is called', () => {
    // Fill form with data
    component.form.patchValue({
      analystInitials: 'ABC',
      viscometerConstant: 0.01,
      testTemperature: 100.0,
      vis40Result: 46.0,
      run1Time: 300,
      run2Time: 310
    });
    component.averageViscosity = 7.8;
    component.viscosityIndex = 105;
    
    // Verify form has values
    expect(component.form.get('analystInitials')?.value).toBe('ABC');
    expect(component.averageViscosity).toBe(7.8);
    expect(component.viscosityIndex).toBe(105);
    
    // Call clear method
    component.onClear();
    
    // Verify form was reset
    expect(component.form.get('analystInitials')?.value).toBeFalsy();
    expect(component.averageViscosity).toBe(0);
    expect(component.viscosityIndex).toBe(0);
  });

  it('should show quality control checks when needed', () => {
    // Normal conditions - no QC alerts needed
    component.form.patchValue({
      testTemperature: 100.0,
      run1Time: 300,
      run2Time: 301
    });
    component.averageViscosity = 7.8;
    component.viscosityIndex = 105;
    
    expect(component.showQualityControlChecks()).toBeFalse();
    
    // Abnormal temperature - should show QC alerts
    component.form.patchValue({
      testTemperature: 100.5
    });
    
    expect(component.showQualityControlChecks()).toBeTrue();
  });
});

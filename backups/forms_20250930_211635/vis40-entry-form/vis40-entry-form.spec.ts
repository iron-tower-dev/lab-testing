import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Vis40EntryForm } from './vis40-entry-form';
import { ViscosityCalculationService } from '../../../../../../shared/services/viscosity-calculation.service';
import { CalculationService } from '../../../../../../shared/services/calculation.service';
import { SampleWithTestInfo } from '../../../../../enter-results.types';

describe('Vis40EntryForm', () => {
  let component: Vis40EntryForm;
  let fixture: ComponentFixture<Vis40EntryForm>;
  let viscCalcService: ViscosityCalculationService;

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
    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        Vis40EntryForm
      ],
      providers: [
        ViscosityCalculationService,
        CalculationService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Vis40EntryForm);
    component = fixture.componentInstance;
    viscCalcService = TestBed.inject(ViscosityCalculationService);
    
    fixture.componentRef.setInput('sampleData', mockSampleData);
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with 4 trial rows', () => {
    expect(component.form).toBeDefined();
    expect(component.trialsArray.length).toBe(4);
  });

  it('should have correct trial group structure', () => {
    const trial = component.getTrialGroup(0);
    expect(trial.get('trialNumber')).toBeDefined();
    expect(trial.get('selected')).toBeDefined();
    expect(trial.get('stopwatchTime')).toBeDefined();
    expect(trial.get('tubeCalibration')).toBeDefined();
    expect(trial.get('calculatedResult')).toBeDefined();
  });

  it('should parse and convert MM.SS.HH format on stopwatch blur', () => {
    const trial = component.getTrialGroup(0);
    
    // Set MM.SS.HH format time
    trial.patchValue({
      stopwatchTime: '3.45.67',
      tubeCalibration: 'Tube A1|0.0045'
    });
    
    component.onStopwatchTimeBlur(0);
    fixture.detectChanges();
    
    // Should convert to seconds (225.67)
    expect(trial.get('stopwatchTime')?.value).toBeCloseTo(225.67, 2);
  });

  it('should calculate viscosity result automatically', () => {
    const trial = component.getTrialGroup(0);
    
    trial.patchValue({
      stopwatchTime: 250,
      tubeCalibration: 'Tube A1|0.0045'
    });
    
    component.onTubeChange(0);
    fixture.detectChanges();
    
    // 250 * 0.0045 = 1.125, rounded to 1.13
    expect(trial.get('calculatedResult')?.value).toBe(1.13);
  });

  it('should not calculate if stopwatch time is missing', () => {
    const trial = component.getTrialGroup(0);
    
    trial.patchValue({
      stopwatchTime: '',
      tubeCalibration: 'Tube A1|0.0045'
    });
    
    component.onTubeChange(0);
    fixture.detectChanges();
    
    expect(trial.get('calculatedResult')?.value).toBe(0);
  });

  it('should not calculate if tube calibration is missing', () => {
    const trial = component.getTrialGroup(0);
    
    trial.patchValue({
      stopwatchTime: 250,
      tubeCalibration: ''
    });
    
    component.onStopwatchTimeBlur(0);
    fixture.detectChanges();
    
    expect(trial.get('calculatedResult')?.value).toBe(0);
  });

  it('should check repeatability when trials are selected', () => {
    // Setup two trials with results
    component.getTrialGroup(0).patchValue({
      selected: true,
      stopwatchTime: 250,
      tubeCalibration: 'Tube A1|0.0045',
      calculatedResult: 1.13
    });
    
    component.getTrialGroup(1).patchValue({
      selected: true,
      stopwatchTime: 252,
      tubeCalibration: 'Tube A1|0.0045',
      calculatedResult: 1.13
    });
    
    component.onTrialSelectionChange();
    fixture.detectChanges();
    
    const repeatability = component.repeatabilityResult();
    expect(repeatability).toBeTruthy();
    expect(repeatability?.isWithinLimit).toBeTrue();
  });

  it('should show repeatability warning for large differences', () => {
    // Setup two trials with very different results
    component.getTrialGroup(0).patchValue({
      selected: true,
      stopwatchTime: 250,
      tubeCalibration: 'Tube A1|0.0045',
      calculatedResult: 1.13
    });
    
    component.getTrialGroup(1).patchValue({
      selected: true,
      stopwatchTime: 300,
      tubeCalibration: 'Tube A1|0.0045',
      calculatedResult: 1.35
    });
    
    component.onTrialSelectionChange();
    fixture.detectChanges();
    
    const repeatability = component.repeatabilityResult();
    expect(repeatability).toBeTruthy();
    expect(repeatability?.isWithinLimit).toBeFalse();
    expect(repeatability?.warning).toContain('0.35%');
  });

  it('should not show repeatability with less than 2 selected trials', () => {
    component.getTrialGroup(0).patchValue({
      selected: true,
      stopwatchTime: 250,
      tubeCalibration: 'Tube A1|0.0045',
      calculatedResult: 1.13
    });
    
    component.onTrialSelectionChange();
    fixture.detectChanges();
    
    expect(component.repeatabilityResult()).toBeNull();
  });

  it('should compute selected results correctly', () => {
    component.getTrialGroup(0).patchValue({
      selected: true,
      calculatedResult: 1.13
    });
    
    component.getTrialGroup(1).patchValue({
      selected: false,
      calculatedResult: 1.20
    });
    
    component.getTrialGroup(2).patchValue({
      selected: true,
      calculatedResult: 1.15
    });
    
    fixture.detectChanges();
    
    const results = component.selectedResults();
    expect(results.length).toBe(2);
    expect(results).toContain(1.13);
    expect(results).toContain(1.15);
    expect(results).not.toContain(1.20);
  });

  it('should clear form with confirmation', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    
    // Fill in some data
    component.getTrialGroup(0).patchValue({
      stopwatchTime: '250',
      tubeCalibration: 'Tube A1|0.0045',
      calculatedResult: 1.13
    });
    
    component.clearForm();
    fixture.detectChanges();
    
    expect(window.confirm).toHaveBeenCalled();
    expect(component.getTrialGroup(0).get('calculatedResult')?.value).toBe(0);
  });

  it('should not clear form if confirmation declined', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    
    component.getTrialGroup(0).patchValue({
      stopwatchTime: '250',
      calculatedResult: 1.13
    });
    
    const originalValue = component.getTrialGroup(0).get('stopwatchTime')?.value;
    
    component.clearForm();
    fixture.detectChanges();
    
    expect(component.getTrialGroup(0).get('stopwatchTime')?.value).toBe(originalValue);
  });

  it('should save form data when valid', () => {
    spyOn(console, 'log');
    
    // Set valid data
    component.getTrialGroup(0).patchValue({
      stopwatchTime: 250,
      tubeCalibration: 'Tube A1|0.0045'
    });
    
    component.saveForm();
    
    expect(console.log).toHaveBeenCalledWith(
      'Saving viscosity @ 40°C data:',
      jasmine.any(Object)
    );
  });

  it('should warn about invalid form on save', () => {
    spyOn(console, 'warn');
    
    // Leave form empty (invalid)
    component.saveForm();
    
    expect(console.warn).toHaveBeenCalledWith('Form is invalid');
  });

  it('should confirm save with repeatability warning', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    spyOn(console, 'log');
    
    // Set up trials with poor repeatability
    component.getTrialGroup(0).patchValue({
      selected: true,
      stopwatchTime: 250,
      tubeCalibration: 'Tube A1|0.0045',
      calculatedResult: 1.13
    });
    
    component.getTrialGroup(1).patchValue({
      selected: true,
      stopwatchTime: 300,
      tubeCalibration: 'Tube A1|0.0045',
      calculatedResult: 1.35
    });
    
    component.onTrialSelectionChange();
    component.saveForm();
    
    expect(window.confirm).toHaveBeenCalled();
    expect(console.log).not.toHaveBeenCalled(); // Should not save if declined
  });

  it('should have tube calibration options', () => {
    expect(component.tubeOptions).toBeDefined();
    expect(component.tubeOptions.length).toBeGreaterThan(0);
    expect(component.tubeOptions[0].value).toBe(''); // First option is placeholder
  });
});

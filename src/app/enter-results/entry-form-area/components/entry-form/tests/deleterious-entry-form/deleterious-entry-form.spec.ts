import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SharedModule } from '../../../../../../shared-module';

import { DeleteriousEntryForm } from './deleterious-entry-form';

describe('DeleteriousEntryForm', () => {
  let component: DeleteriousEntryForm;
  let fixture: ComponentFixture<DeleteriousEntryForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        NoopAnimationsModule,
        SharedModule,
        DeleteriousEntryForm
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DeleteriousEntryForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with empty form', () => {
      expect(component.form).toBeDefined();
      expect(component.trialsFormArray).toBeDefined();
      expect(component.trialsFormArray.length).toBe(4);
    });

    it('should initialize with default values', () => {
      expect(component.form.get('testStandard')?.value).toBe('ASTM-D7216');
      expect(component.selectedTrialsCount()).toBe(0);
      expect(component.hasUnsavedChanges()).toBe(false);
    });

    it('should create 4 trial forms', () => {
      const trials = component.trialsFormArray.controls;
      expect(trials.length).toBe(4);
      
      trials.forEach((trial, index) => {
        expect(trial.get('trialNumber')?.value).toBe(index + 1);
        expect(trial.get('isSelected')?.value).toBe(false);
        expect(trial.get('testValue')?.value).toBeNull();
      });
    });
  });

  describe('Form Validation', () => {
    it('should require analyst initials', () => {
      const analystControl = component.form.get('analystInitials');
      expect(analystControl?.invalid).toBe(true);
      expect(analystControl?.hasError('required')).toBe(true);

      analystControl?.setValue('ABC');
      expect(analystControl?.valid).toBe(true);
    });

    it('should require equipment', () => {
      const equipmentControl = component.form.get('equipment');
      expect(equipmentControl?.invalid).toBe(true);
      expect(equipmentControl?.hasError('required')).toBe(true);

      equipmentControl?.setValue('Analytical Balance');
      expect(equipmentControl?.valid).toBe(true);
    });

    it('should validate temperature range', () => {
      const tempControl = component.form.get('temperature');
      
      tempControl?.setValue(10);
      expect(tempControl?.hasError('min')).toBe(true);
      
      tempControl?.setValue(40);
      expect(tempControl?.hasError('max')).toBe(true);
      
      tempControl?.setValue(22);
      expect(tempControl?.valid).toBe(true);
    });

    it('should require at least one selected trial for form validity', () => {
      // Fill required fields
      component.form.patchValue({
        analystInitials: 'ABC',
        equipment: 'Test Equipment'
      });

      expect(component.formIsValid()).toBe(false);

      // Select first trial and add test value
      component.getTrialForm(0).patchValue({ 
        isSelected: true,
        testValue: 1.234 
      });
      fixture.detectChanges();
      
      expect(component.formIsValid()).toBe(true);
    });
  });

  describe('Trial Management', () => {
    beforeEach(() => {
      // Setup basic form
      component.form.patchValue({
        analystInitials: 'ABC',
        equipment: 'Test Equipment'
      });
    });

    it('should update selected trials count', () => {
      expect(component.selectedTrialsCount()).toBe(0);
      
      component.getTrialForm(0).patchValue({ isSelected: true });
      fixture.detectChanges();
      expect(component.selectedTrialsCount()).toBe(1);
    });

    it('should select all trials', () => {
      component.onSelectAllTrials();
      fixture.detectChanges();
      
      expect(component.selectedTrialsCount()).toBe(4);
      expect(component.allTrialsSelected()).toBe(true);
    });

    it('should deselect all trials when all are selected', () => {
      // First select all
      component.onSelectAllTrials();
      fixture.detectChanges();
      expect(component.allTrialsSelected()).toBe(true);
      
      // Then deselect all
      component.onSelectAllTrials();
      fixture.detectChanges();
      expect(component.selectedTrialsCount()).toBe(0);
    });

    it('should clear selected trials', () => {
      // Select some trials
      component.getTrialForm(0).patchValue({ isSelected: true });
      component.getTrialForm(2).patchValue({ isSelected: true });
      fixture.detectChanges();
      
      expect(component.selectedTrialsCount()).toBe(2);
      
      component.onClearSelectedTrials();
      fixture.detectChanges();
      
      expect(component.selectedTrialsCount()).toBe(0);
    });
  });

  describe('Calculations', () => {
    beforeEach(() => {
      component.form.patchValue({
        analystInitials: 'ABC',
        equipment: 'Test Equipment'
      });
    });

    it('should not calculate with less than 2 trials', () => {
      component.getTrialForm(0).patchValue({ 
        isSelected: true, 
        testValue: 1.000 
      });
      fixture.detectChanges();
      
      expect(component.calculatedResults()).toBeNull();
    });

    it('should calculate statistics with 2 or more trials', () => {
      component.getTrialForm(0).patchValue({ 
        isSelected: true, 
        testValue: 1.000 
      });
      component.getTrialForm(1).patchValue({ 
        isSelected: true, 
        testValue: 2.000 
      });
      fixture.detectChanges();
      
      const results = component.calculatedResults();
      expect(results).toBeTruthy();
      expect(results!.average).toBe(1.5);
      expect(results!.stdDev).toBeGreaterThan(0);
      expect(results!.cv).toBeGreaterThan(0);
    });
  });

  describe('Form Actions', () => {
    beforeEach(() => {
      // Setup valid form
      component.form.patchValue({
        analystInitials: 'ABC',
        equipment: 'Test Equipment'
      });
      component.getTrialForm(0).patchValue({ 
        isSelected: true, 
        testValue: 1.234 
      });
      fixture.detectChanges();
    });

    it('should emit formSaved when save is called with valid form', () => {
      spyOn(component.formSaved, 'emit');
      
      component.onSave();
      
      expect(component.formSaved.emit).toHaveBeenCalled();
    });

    it('should clear form and emit formCleared', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      spyOn(component.formCleared, 'emit');
      
      component.onClear();
      
      expect(component.form.get('analystInitials')?.value).toBe(null);
      expect(component.formCleared.emit).toHaveBeenCalled();
      expect(component.hasUnsavedChanges()).toBe(false);
    });
  });
});

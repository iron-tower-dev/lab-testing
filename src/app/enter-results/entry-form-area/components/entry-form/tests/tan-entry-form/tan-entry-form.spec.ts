import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TanEntryForm } from './tan-entry-form';
import { StatusWorkflowService } from '../../../../../../shared/services/status-workflow.service';
import { StatusTransitionService } from '../../../../../../shared/services/status-transition.service';
import { TestReadingsService } from '../../../../../../shared/services/test-readings.service';
import { TANCalculationService } from '../../../../../../shared/services/tan-calculation.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { TestStatus } from '../../../../../../shared/types/status-workflow.types';

/**
 * TAN Entry Form - Status Workflow Integration Tests
 * 
 * These tests validate the integration of the status workflow system
 * into the TAN entry form component.
 */
describe('TanEntryForm - Status Workflow Integration', () => {
  let component: TanEntryForm;
  let fixture: ComponentFixture<TanEntryForm>;
  let mockStatusWorkflow: jasmine.SpyObj<StatusWorkflowService>;
  let mockStatusTransition: jasmine.SpyObj<StatusTransitionService>;
  let mockTestReadings: jasmine.SpyObj<TestReadingsService>;

  beforeEach(async () => {
    // Create mock services
    mockStatusWorkflow = jasmine.createSpyObj('StatusWorkflowService', [
      'determineEntryStatus',
      'determineReviewStatus',
      'getAvailableActions'
    ]);
    
    mockStatusTransition = jasmine.createSpyObj('StatusTransitionService', [
      'getCurrentStatus',
      'acceptResults',
      'rejectResults',
      'deleteResults',
      'markMediaReady'
    ]);
    
    mockTestReadings = jasmine.createSpyObj('TestReadingsService', [
      'loadTrials',
      'bulkSaveTrials'
    ]);

    // Default mock returns
    mockStatusTransition.getCurrentStatus.and.returnValue(of({ 
      success: true, 
      status: TestStatus.AWAITING 
    }));
    mockTestReadings.loadTrials.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [TanEntryForm],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimations(),
        { provide: StatusWorkflowService, useValue: mockStatusWorkflow },
        { provide: StatusTransitionService, useValue: mockStatusTransition },
        { provide: TestReadingsService, useValue: mockTestReadings },
        TANCalculationService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TanEntryForm);
    component = fixture.componentInstance;
  });

  describe('Component Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize form with default values', () => {
      fixture.detectChanges();
      
      expect(component.form).toBeTruthy();
      expect(component.form.get('initialBuret')?.value).toBe(0);
      expect(component.form.get('kohNormality')?.value).toBe(0.1000);
      expect(component.form.get('temperature')?.value).toBe(22);
      expect(component.form.get('testMethod')?.value).toBe('ASTM-D664');
    });

    it('should initialize signals with default values', () => {
      fixture.detectChanges();
      
      expect(component.isLoading()).toBe(false);
      expect(component.isSaving()).toBe(false);
      expect(component.saveMessage()).toBeNull();
      expect(component.currentStatus()).toBe(TestStatus.AWAITING);
    });
  });

  describe('Status Loading', () => {
    it('should load current status on initialization with sample data', () => {
      const mockStatus = { success: true, status: TestStatus.AWAITING_REVIEW };
      mockStatusTransition.getCurrentStatus.and.returnValue(of(mockStatus));
      
      component.sampleData = () => ({
        sampleId: 123,
        testReference: { id: 10, testName: 'TAN', testDescription: '' }
      } as any);
      
      fixture.detectChanges();
      
      expect(mockStatusTransition.getCurrentStatus).toHaveBeenCalledWith(123, 10);
      expect(component.currentStatus()).toBe(TestStatus.AWAITING_REVIEW);
    });

    it('should not load status if sample data is missing', () => {
      component.sampleData = () => null;
      
      fixture.detectChanges();
      
      expect(mockStatusTransition.getCurrentStatus).not.toHaveBeenCalled();
    });

    it('should default to AWAITING if status load fails', () => {
      mockStatusTransition.getCurrentStatus.and.returnValue(
        throwError(() => new Error('API error'))
      );
      
      component.sampleData = () => ({
        sampleId: 123,
        testReference: { id: 10, testName: 'TAN', testDescription: '' }
      } as any);
      
      fixture.detectChanges();
      
      expect(component.currentStatus()).toBe(TestStatus.AWAITING);
    });
  });

  describe('Data Loading', () => {
    it('should load existing trial data and populate form', (done) => {
      const mockTrials = [{
        trialNumber: 1,
        value1: 0.05,
        value2: 5.23,
        value3: 0.52,
        id1: 'ASTM-D664',
        id2: '2.0',
        id3: '0.1000',
        trialCalc: 22,
        entryId: 'ABC',
        mainComments: 'color:Pink to Green|notes:Test successful'
      }];
      
      mockTestReadings.loadTrials.and.returnValue(of(mockTrials));
      
      component.sampleData = () => ({
        sampleId: 123,
        testReference: { id: 10, testName: 'TAN', testDescription: '' }
      } as any);
      
      fixture.detectChanges();
      
      setTimeout(() => {
        expect(component.form.get('initialBuret')?.value).toBe(0.05);
        expect(component.form.get('finalBuret')?.value).toBe(5.23);
        expect(component.form.get('sampleWeight')?.value).toBe(2.0);
        expect(component.form.get('kohNormality')?.value).toBe(0.1000);
        expect(component.form.get('colorObserved')?.value).toBe('Pink to Green');
        expect(component.form.get('testNotes')?.value).toBe('Test successful');
        expect(component.enteredBy()).toBe('ABC');
        done();
      }, 50);
    });

    it('should not load data if sample is missing', () => {
      component.sampleData = () => null;
      
      fixture.detectChanges();
      
      expect(mockTestReadings.loadTrials).not.toHaveBeenCalled();
    });

    it('should handle load errors gracefully', () => {
      mockTestReadings.loadTrials.and.returnValue(
        throwError(() => new Error('Load failed'))
      );
      
      component.sampleData = () => ({
        sampleId: 123,
        testReference: { id: 10, testName: 'TAN', testDescription: '' }
      } as any);
      
      fixture.detectChanges();
      
      // Should not throw, component should remain usable
      expect(component.form).toBeTruthy();
      expect(component.isLoading()).toBe(false);
    });
  });

  describe('Action Context', () => {
    it('should compute correct action context', () => {
      component.sampleData = () => ({
        sampleId: 123,
        testReference: { id: 10, testName: 'TAN', testDescription: '' }
      } as any);
      component.currentStatus.set(TestStatus.AWAITING_REVIEW);
      component.userQualification = () => 'Q';
      component.enteredBy.set('XYZ');
      component.currentUser = () => 'ABC';
      component.mode = () => 'review';
      
      const context = component.actionContext();
      
      expect(context.testId).toBe(10);
      expect(context.sampleId).toBe(123);
      expect(context.currentStatus).toBe(TestStatus.AWAITING_REVIEW);
      expect(context.userQualification).toBe('Q');
      expect(context.enteredBy).toBe('XYZ');
      expect(context.currentUser).toBe('ABC');
      expect(context.mode).toBe('review');
      expect(context.isTraining).toBe(false);
    });

    it('should identify training users', () => {
      component.userQualification = () => 'TRAIN';
      
      const context = component.actionContext();
      
      expect(context.isTraining).toBe(true);
    });

    it('should handle missing sample data', () => {
      component.sampleData = () => null;
      
      const context = component.actionContext();
      
      expect(context.testId).toBe(10);
      expect(context.sampleId).toBe(0);
    });
  });

  describe('Save Results', () => {
    beforeEach(() => {
      component.sampleData = () => ({
        sampleId: 123,
        testReference: { id: 10, testName: 'TAN', testDescription: '' }
      } as any);
      
      component.form.patchValue({
        sampleWeight: 2.0,
        initialBuret: 0.0,
        finalBuret: 5.18,
        kohNormality: 0.1000,
        temperature: 22,
        analystInitials: 'ABC',
        testMethod: 'ASTM-D664'
      });

      fixture.detectChanges();
    });

    it('should save valid data successfully', (done) => {
      mockStatusWorkflow.determineEntryStatus.and.returnValue(TestStatus.AWAITING_REVIEW);
      mockTestReadings.bulkSaveTrials.and.returnValue(of({ success: true }));
      
      component.onAction('save');
      
      setTimeout(() => {
        expect(mockTestReadings.bulkSaveTrials).toHaveBeenCalled();
        expect(component.currentStatus()).toBe(TestStatus.AWAITING_REVIEW);
        expect(component.saveMessage()?.type).toBe('success');
        done();
      }, 100);
    });

    it('should allow partial save with incomplete data', (done) => {
      component.form.patchValue({
        sampleWeight: null,
        analystInitials: ''
      });
      
      mockStatusWorkflow.determineEntryStatus.and.returnValue(TestStatus.PARTIAL);
      mockTestReadings.bulkSaveTrials.and.returnValue(of({ success: true }));
      
      component.onAction('partial-save');
      
      setTimeout(() => {
        expect(mockTestReadings.bulkSaveTrials).toHaveBeenCalled();
        expect(component.currentStatus()).toBe(TestStatus.PARTIAL);
        expect(component.saveMessage()?.text).toContain('partially saved');
        done();
      }, 100);
    });

    it('should prevent save with invalid data', () => {
      component.form.patchValue({
        sampleWeight: null,
        finalBuret: null,
        analystInitials: ''
      });
      
      component.onAction('save');
      
      expect(mockTestReadings.bulkSaveTrials).not.toHaveBeenCalled();
      expect(component.saveMessage()?.type).toBe('error');
    });

    it('should handle save errors gracefully', (done) => {
      mockStatusWorkflow.determineEntryStatus.and.returnValue(TestStatus.AWAITING_REVIEW);
      mockTestReadings.bulkSaveTrials.and.returnValue(
        throwError(() => new Error('Network error'))
      );
      
      component.onAction('save');
      
      setTimeout(() => {
        expect(component.saveMessage()?.type).toBe('error');
        expect(component.saveMessage()?.text).toContain('Failed to save');
        expect(component.isSaving()).toBe(false);
        done();
      }, 100);
    });

    it('should save analyst initials to localStorage', (done) => {
      spyOn(localStorage, 'setItem');
      
      mockStatusWorkflow.determineEntryStatus.and.returnValue(TestStatus.AWAITING_REVIEW);
      mockTestReadings.bulkSaveTrials.and.returnValue(of({ success: true }));
      
      component.onAction('save');
      
      setTimeout(() => {
        expect(localStorage.setItem).toHaveBeenCalledWith('analystInitials', 'ABC');
        expect(component.enteredBy()).toBe('ABC');
        done();
      }, 100);
    });
  });

  describe('Accept Results', () => {
    it('should accept results successfully', (done) => {
      component.sampleData = () => ({
        sampleId: 123,
        testReference: { id: 10, testName: 'TAN', testDescription: '' }
      } as any);
      component.currentStatus.set(TestStatus.AWAITING_REVIEW);
      
      mockStatusWorkflow.determineReviewStatus.and.returnValue(TestStatus.ACCEPTED);
      mockStatusTransition.acceptResults.and.returnValue(of({
        success: true,
        newStatus: TestStatus.ACCEPTED
      }));
      
      component.onAction('accept');
      
      setTimeout(() => {
        expect(mockStatusTransition.acceptResults).toHaveBeenCalled();
        expect(component.currentStatus()).toBe(TestStatus.ACCEPTED);
        expect(component.saveMessage()?.text).toContain('accepted');
        done();
      }, 100);
    });

    it('should handle accept errors', (done) => {
      component.sampleData = () => ({
        sampleId: 123,
        testReference: { id: 10, testName: 'TAN', testDescription: '' }
      } as any);
      
      mockStatusTransition.acceptResults.and.returnValue(
        throwError(() => new Error('Accept failed'))
      );
      
      component.onAction('accept');
      
      setTimeout(() => {
        expect(component.saveMessage()?.type).toBe('error');
        expect(component.isSaving()).toBe(false);
        done();
      }, 100);
    });
  });

  describe('Reject Results', () => {
    it('should reject results with confirmation', (done) => {
      spyOn(window, 'confirm').and.returnValue(true);
      
      component.sampleData = () => ({
        sampleId: 123,
        testReference: { id: 10, testName: 'TAN', testDescription: '' }
      } as any);
      component.currentStatus.set(TestStatus.AWAITING_REVIEW);
      
      mockStatusTransition.rejectResults.and.returnValue(of({
        success: true,
        newStatus: TestStatus.AWAITING
      }));
      
      component.onAction('reject');
      
      setTimeout(() => {
        expect(mockStatusTransition.rejectResults).toHaveBeenCalled();
        expect(component.currentStatus()).toBe(TestStatus.AWAITING);
        expect(component.saveMessage()?.text).toContain('rejected');
        done();
      }, 100);
    });

    it('should cancel rejection if user declines confirmation', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      
      component.onAction('reject');
      
      expect(mockStatusTransition.rejectResults).not.toHaveBeenCalled();
    });

    it('should reset form on successful rejection', (done) => {
      spyOn(window, 'confirm').and.returnValue(true);
      
      component.sampleData = () => ({
        sampleId: 123,
        testReference: { id: 10, testName: 'TAN', testDescription: '' }
      } as any);
      
      mockStatusTransition.rejectResults.and.returnValue(of({
        success: true,
        newStatus: TestStatus.AWAITING
      }));
      
      component.form.patchValue({
        sampleWeight: 2.0,
        finalBuret: 5.0
      });
      
      component.onAction('reject');
      
      setTimeout(() => {
        expect(component.form.get('sampleWeight')?.value).toBeNull();
        expect(component.form.get('kohNormality')?.value).toBe(0.1000);
        done();
      }, 100);
    });
  });

  describe('Delete Results', () => {
    it('should delete results with confirmation', (done) => {
      spyOn(window, 'confirm').and.returnValue(true);
      
      component.sampleData = () => ({
        sampleId: 123,
        testReference: { id: 10, testName: 'TAN', testDescription: '' }
      } as any);
      
      mockStatusTransition.deleteResults.and.returnValue(of({
        success: true
      }));
      
      component.onAction('delete');
      
      setTimeout(() => {
        expect(mockStatusTransition.deleteResults).toHaveBeenCalled();
        expect(component.saveMessage()?.text).toContain('deleted');
        done();
      }, 100);
    });

    it('should cancel deletion if user declines confirmation', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      
      component.onAction('delete');
      
      expect(mockStatusTransition.deleteResults).not.toHaveBeenCalled();
    });
  });

  describe('Clear Form', () => {
    it('should clear form with confirmation', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      
      component.form.patchValue({
        sampleWeight: 2.0,
        finalBuret: 5.0,
        analystInitials: 'XYZ'
      });
      
      component.clearForm();
      
      expect(component.form.get('sampleWeight')?.value).toBeNull();
      expect(component.form.get('finalBuret')?.value).toBe('');
      expect(component.form.get('initialBuret')?.value).toBe(0);
    });

    it('should not clear form if user cancels', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      
      component.form.patchValue({
        sampleWeight: 2.0
      });
      
      component.clearForm();
      
      expect(component.form.get('sampleWeight')?.value).toBe(2.0);
    });
  });

  describe('Calculations', () => {
    it('should calculate net buret volume correctly', () => {
      component.form.patchValue({
        initialBuret: 0.50,
        finalBuret: 5.75
      });
      
      expect(component.netBuretVolume()).toBe(5.25);
    });

    it('should calculate TAN result correctly', () => {
      component.form.patchValue({
        sampleWeight: 2.0,
        initialBuret: 0.0,
        finalBuret: 5.18,
        kohNormality: 0.1000
      });
      
      const result = component.tanResult();
      
      expect(result).toBeTruthy();
      expect(result?.isValid).toBe(true);
      // TAN = (5.18 * 56.1 * 0.1) / 2.0 = 14.53
      expect(result?.result).toBeCloseTo(14.53, 1);
    });

    it('should return null for incomplete calculation data', () => {
      component.form.patchValue({
        sampleWeight: null,
        initialBuret: 0.0,
        finalBuret: 5.18,
        kohNormality: 0.1000
      });
      
      const result = component.tanResult();
      
      expect(result).toBeNull();
    });

    it('should detect negative volume as quality issue', () => {
      component.form.patchValue({
        initialBuret: 10.0,
        finalBuret: 5.0
      });
      
      expect(component.hasNegativeVolume()).toBe(true);
      expect(component.netBuretVolume()).toBe(-5.0);
    });
  });

  describe('Quality Control', () => {
    it('should show quality control checks when warnings exist', () => {
      component.form.patchValue({
        sampleWeight: 2.0,
        initialBuret: 0.0,
        finalBuret: 25.0, // High volume - might trigger warning
        kohNormality: 0.1000
      });
      
      const result = component.tanResult();
      const hasWarnings = result && result.warnings && result.warnings.length > 0;
      
      expect(component.showQualityControlChecks()).toBe(hasWarnings);
    });

    it('should return warnings array', () => {
      const warnings = component.getQualityControlWarnings();
      expect(Array.isArray(warnings)).toBe(true);
    });
  });

  describe('Save Message', () => {
    it('should display and auto-hide save messages', (done) => {
      component['showSaveMessage']('Test message', 'success');
      
      expect(component.saveMessage()).toEqual({
        text: 'Test message',
        type: 'success'
      });
      
      setTimeout(() => {
        expect(component.saveMessage()).toBeNull();
        done();
      }, 3100);
    });
  });

  describe('Comment String Building', () => {
    it('should build comments from form fields', () => {
      component.form.patchValue({
        colorObserved: 'Pink to Green',
        testNotes: 'All good',
        solvent: 'Isopropanol/Toluene',
        indicator: 'P-Naphtholbenzein'
      });
      
      const comments = component['buildCommentsString']();
      
      expect(comments).toContain('color:Pink to Green');
      expect(comments).toContain('notes:All good');
      expect(comments).toContain('solvent:Isopropanol/Toluene');
      expect(comments).toContain('indicator:P-Naphtholbenzein');
    });

    it('should omit empty fields from comments', () => {
      component.form.patchValue({
        colorObserved: '',
        testNotes: 'Test note',
        solvent: '',
        indicator: ''
      });
      
      const comments = component['buildCommentsString']();
      
      expect(comments).not.toContain('color:');
      expect(comments).toContain('notes:Test note');
    });
  });
});

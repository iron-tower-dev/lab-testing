import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActionButtons } from './action-buttons';
import { StatusWorkflowService } from '../../../shared/services/status-workflow.service';
import { ActionContext, TestStatus } from '../../../shared/types/status-workflow.types';
import { signal } from '@angular/core';

describe('ActionButtons', () => {
  let component: ActionButtons;
  let fixture: ComponentFixture<ActionButtons>;
  let mockStatusWorkflowService: jasmine.SpyObj<StatusWorkflowService>;

  const mockContext: ActionContext = {
    testId: 1,
    sampleId: 1,
    currentStatus: TestStatus.AWAITING,
    userQualification: 'Q',
    enteredBy: null,
    currentUser: 'test_user',
    mode: 'entry',
    isPartialSave: false,
    isTraining: false
  };

  beforeEach(async () => {
    const statusWorkflowSpy = jasmine.createSpyObj('StatusWorkflowService', ['getAvailableActions']);

    await TestBed.configureTestingModule({
      imports: [ActionButtons],
      providers: [
        { provide: StatusWorkflowService, useValue: statusWorkflowSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ActionButtons);
    component = fixture.componentInstance;
    mockStatusWorkflowService = TestBed.inject(StatusWorkflowService) as jasmine.SpyObj<StatusWorkflowService>;
    
    // Setup default mock return
    mockStatusWorkflowService.getAvailableActions.and.returnValue([
      { action: 'save', label: 'Save', icon: 'save' },
      { action: 'clear', label: 'Clear', icon: 'clear' }
    ]);

    // Set required input
    fixture.componentRef.setInput('context', mockContext);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should accept saving input', () => {
    fixture.componentRef.setInput('saving', true);
    fixture.detectChanges();
    expect(component.saving()).toBe(true);
  });

  it('should accept isFormValid input', () => {
    fixture.componentRef.setInput('isFormValid', true);
    fixture.detectChanges();
    expect(component.isFormValid()).toBe(true);
  });

  it('should disable all buttons when saving', () => {
    fixture.componentRef.setInput('saving', true);
    fixture.detectChanges();
    
    expect(component.isButtonDisabled('save')).toBe(true);
    expect(component.isButtonDisabled('clear')).toBe(true);
  });

  it('should disable save actions when form is invalid', () => {
    fixture.componentRef.setInput('isFormValid', false);
    fixture.detectChanges();
    
    expect(component.isButtonDisabled('save')).toBe(true);
    expect(component.isButtonDisabled('partial-save')).toBe(true);
    expect(component.isButtonDisabled('clear')).toBe(false);
  });

  it('should show saving label when saving', () => {
    fixture.componentRef.setInput('saving', true);
    fixture.detectChanges();
    
    const saveAction = { action: 'save', label: 'Save' };
    expect(component.getButtonLabel(saveAction)).toBe('Saving...');
    
    const clearAction = { action: 'clear', label: 'Clear' };
    expect(component.getButtonLabel(clearAction)).toBe('Clear');
  });

  it('should identify save actions correctly', () => {
    expect(component.isSaveAction('save')).toBe(true);
    expect(component.isSaveAction('partial-save')).toBe(true);
    expect(component.isSaveAction('clear')).toBe(false);
    expect(component.isSaveAction('delete')).toBe(false);
  });
});
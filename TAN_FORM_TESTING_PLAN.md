# TAN Form Status Workflow Integration - Testing Plan

**Date:** 2025-10-01  
**Form:** TAN (Total Acid Number) Entry Form  
**Integration Phase:** Status Workflow System (Phase 2)

## Overview

This document outlines comprehensive testing for the TAN form's status workflow integration to validate functionality before batch-processing the remaining seven modernized forms using the same pattern.

---

## Testing Objectives

1. **Validate Status Badge Display** - Ensure current status is correctly shown
2. **Test Dynamic Action Buttons** - Verify buttons appear based on context (user role, status, mode)
3. **Validate Status Transitions** - Test all workflow state changes
4. **Test Data Persistence** - Ensure form data saves and loads correctly
5. **Verify User Permissions** - Test qualified vs training vs admin access
6. **Test Edge Cases** - Partial saves, errors, concurrent edits
7. **Validate UI/UX** - Check responsiveness, loading states, error messages

---

## Test Environment Setup

### Prerequisites

```bash
# Ensure Angular dev server is running
ng serve

# Ensure backend API is running (if separate)
# Check status workflow endpoints are accessible
curl http://localhost:3000/api/status-workflow/health

# Clear browser cache and localStorage
# Open browser DevTools console to monitor errors
```

### Test Data Requirements

- **Sample with no existing data** (status: AWAITING)
- **Sample with partial data** (status: PARTIAL)
- **Sample with complete data awaiting review** (status: AWAITING_REVIEW)
- **Sample with accepted data** (status: ACCEPTED)
- **Sample with rejected data** (status: AWAITING after rejection)

### Test User Profiles

1. **Qualified Analyst (Q)** - Can enter and save data
2. **Training Analyst (TRAIN)** - Can enter but needs supervision
3. **Reviewer (Q)** - Can accept/reject results
4. **Admin** - Can delete any data

---

## Unit Tests (Automated)

### Test File: `tan-entry-form.spec.ts`

Create comprehensive unit tests for the component:

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TanEntryForm } from './tan-entry-form';
import { StatusWorkflowService } from '../../../../../../shared/services/status-workflow.service';
import { StatusTransitionService } from '../../../../../../shared/services/status-transition.service';
import { TestReadingsService } from '../../../../../../shared/services/test-readings.service';
import { of, throwError } from 'rxjs';
import { TestStatus } from '../../../../../../shared/types/status-workflow.types';

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

    await TestBed.configureTestingModule({
      imports: [TanEntryForm],
      providers: [
        { provide: StatusWorkflowService, useValue: mockStatusWorkflow },
        { provide: StatusTransitionService, useValue: mockStatusTransition },
        { provide: TestReadingsService, useValue: mockTestReadings }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TanEntryForm);
    component = fixture.componentInstance;
  });

  describe('Status Loading', () => {
    it('should load current status on initialization', () => {
      const mockStatus = { success: true, status: TestStatus.AWAITING };
      mockStatusTransition.getCurrentStatus.and.returnValue(of(mockStatus));
      
      component.sampleData.set({
        sampleId: 123,
        testReference: { id: 10, testName: 'TAN' }
      });
      
      fixture.detectChanges();
      
      expect(mockStatusTransition.getCurrentStatus).toHaveBeenCalledWith(123, 10);
      expect(component.currentStatus()).toBe(TestStatus.AWAITING);
    });

    it('should default to AWAITING if status load fails', () => {
      mockStatusTransition.getCurrentStatus.and.returnValue(
        throwError(() => new Error('API error'))
      );
      
      component.sampleData.set({
        sampleId: 123,
        testReference: { id: 10, testName: 'TAN' }
      });
      
      fixture.detectChanges();
      
      expect(component.currentStatus()).toBe(TestStatus.AWAITING);
    });
  });

  describe('Data Loading', () => {
    it('should load existing trial data and populate form', () => {
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
      
      component.sampleData.set({
        sampleId: 123,
        testReference: { id: 10, testName: 'TAN' }
      });
      
      fixture.detectChanges();
      
      expect(component.form.get('initialBuret')?.value).toBe(0.05);
      expect(component.form.get('finalBuret')?.value).toBe(5.23);
      expect(component.form.get('sampleWeight')?.value).toBe(2.0);
      expect(component.form.get('kohNormality')?.value).toBe(0.1000);
      expect(component.form.get('colorObserved')?.value).toBe('Pink to Green');
      expect(component.form.get('testNotes')?.value).toBe('Test successful');
      expect(component.enteredBy()).toBe('ABC');
    });
  });

  describe('Action Context', () => {
    it('should compute correct action context', () => {
      component.sampleData.set({
        sampleId: 123,
        testReference: { id: 10, testName: 'TAN' }
      });
      component.currentStatus.set(TestStatus.AWAITING_REVIEW);
      component.userQualification.set('Q');
      component.enteredBy.set('XYZ');
      component.currentUser.set('ABC');
      component.mode.set('review');
      
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
      component.userQualification.set('TRAIN');
      
      const context = component.actionContext();
      
      expect(context.isTraining).toBe(true);
    });
  });

  describe('Save Results', () => {
    beforeEach(() => {
      component.sampleData.set({
        sampleId: 123,
        testReference: { id: 10, testName: 'TAN' }
      });
      
      component.form.patchValue({
        sampleWeight: 2.0,
        initialBuret: 0.0,
        finalBuret: 5.18,
        kohNormality: 0.1000,
        temperature: 22,
        analystInitials: 'ABC',
        testMethod: 'ASTM-D664'
      });
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
        done();
      }, 100);
    });
  });

  describe('Accept Results', () => {
    it('should accept results successfully', (done) => {
      component.sampleData.set({
        sampleId: 123,
        testReference: { id: 10, testName: 'TAN' }
      });
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
  });

  describe('Reject Results', () => {
    it('should reject results with confirmation', (done) => {
      spyOn(window, 'confirm').and.returnValue(true);
      
      component.sampleData.set({
        sampleId: 123,
        testReference: { id: 10, testName: 'TAN' }
      });
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
  });

  describe('Delete Results', () => {
    it('should delete results with confirmation', (done) => {
      spyOn(window, 'confirm').and.returnValue(true);
      
      component.sampleData.set({
        sampleId: 123,
        testReference: { id: 10, testName: 'TAN' }
      });
      
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
      expect(result?.result).toBeCloseTo(14.53, 2);
    });

    it('should detect negative volume as quality issue', () => {
      component.form.patchValue({
        initialBuret: 10.0,
        finalBuret: 5.0
      });
      
      expect(component.hasNegativeVolume()).toBe(true);
    });
  });
});
```

---

## Integration Tests (Service Layer)

### Test Status Workflow Service

```typescript
describe('StatusWorkflowService - TAN Form Integration', () => {
  let service: StatusWorkflowService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StatusWorkflowService);
  });

  it('should determine AWAITING_REVIEW for qualified complete entry', () => {
    const context = {
      testId: 10,
      sampleId: 123,
      currentStatus: TestStatus.AWAITING,
      userQualification: 'Q',
      enteredBy: null,
      currentUser: 'ABC',
      mode: 'entry' as const,
      isPartialSave: false,
      isTraining: false
    };

    const status = service.determineEntryStatus(context);
    expect(status).toBe(TestStatus.AWAITING_REVIEW);
  });

  it('should determine PARTIAL for incomplete save', () => {
    const context = {
      testId: 10,
      sampleId: 123,
      currentStatus: TestStatus.AWAITING,
      userQualification: 'Q',
      enteredBy: null,
      currentUser: 'ABC',
      mode: 'entry' as const,
      isPartialSave: true,
      isTraining: false
    };

    const status = service.determineEntryStatus(context);
    expect(status).toBe(TestStatus.PARTIAL);
  });

  it('should determine AWAITING_SUPERVISION for training user', () => {
    const context = {
      testId: 10,
      sampleId: 123,
      currentStatus: TestStatus.AWAITING,
      userQualification: 'TRAIN',
      enteredBy: null,
      currentUser: 'TRAINEE',
      mode: 'entry' as const,
      isPartialSave: false,
      isTraining: true
    };

    const status = service.determineEntryStatus(context);
    expect(status).toBe(TestStatus.AWAITING_SUPERVISION);
  });
});
```

---

## Manual Testing Scenarios

### Scenario 1: New Entry by Qualified User

**Setup:**
- User: Qualified Analyst (Q)
- Sample: No existing data (status: AWAITING)
- Mode: Entry

**Steps:**
1. Navigate to TAN form for a new sample
2. Verify status badge shows "AWAITING" in gray
3. Enter all required form data:
   - Sample Weight: 2.00 g
   - Initial Buret: 0.00 mL
   - Final Buret: 5.18 mL
   - KOH Normality: 0.1000 N
   - Analyst Initials: ABC
4. Verify calculated TAN result appears
5. Verify action buttons show: "Save", "Partial Save", "Clear"
6. Click "Save"
7. Verify success message appears
8. Verify status badge changes to "AWAITING_REVIEW" in yellow

**Expected Results:**
- ✅ Form accepts valid data
- ✅ Calculations display correctly
- ✅ Save completes successfully
- ✅ Status transitions to AWAITING_REVIEW
- ✅ Action buttons update based on new status

---

### Scenario 2: Partial Save

**Setup:**
- User: Qualified Analyst (Q)
- Sample: No existing data
- Mode: Entry

**Steps:**
1. Navigate to TAN form
2. Enter partial data (only sample weight and initial buret)
3. Click "Partial Save"
4. Verify success message
5. Verify status badge shows "PARTIAL" in orange
6. Refresh page
7. Verify form reloads with partial data

**Expected Results:**
- ✅ Partial save accepted even with incomplete data
- ✅ Status transitions to PARTIAL
- ✅ Data persists across page reload

---

### Scenario 3: Review and Accept

**Setup:**
- User: Qualified Reviewer (Q, different from entry user)
- Sample: Has complete data (status: AWAITING_REVIEW)
- Mode: Review

**Steps:**
1. Navigate to TAN form for sample awaiting review
2. Verify status badge shows "AWAITING_REVIEW" in yellow
3. Review entered data
4. Verify action buttons show: "Accept", "Reject"
5. Click "Accept"
6. Verify success message
7. Verify status badge changes to "ACCEPTED" in green

**Expected Results:**
- ✅ Reviewer can view all entered data
- ✅ Accept button is available
- ✅ Accept completes successfully
- ✅ Status transitions to ACCEPTED

---

### Scenario 4: Review and Reject

**Setup:**
- User: Qualified Reviewer (Q)
- Sample: Has complete data (status: AWAITING_REVIEW)
- Mode: Review

**Steps:**
1. Navigate to TAN form for sample awaiting review
2. Click "Reject"
3. Confirm rejection in dialog
4. Verify form clears
5. Verify status badge changes to "AWAITING" in gray
6. Verify action buttons revert to entry mode

**Expected Results:**
- ✅ Confirmation dialog appears
- ✅ Data is cleared
- ✅ Status transitions back to AWAITING
- ✅ Form is ready for new entry

---

### Scenario 5: Training User Entry

**Setup:**
- User: Training Analyst (TRAIN)
- Sample: No existing data
- Mode: Entry

**Steps:**
1. Navigate to TAN form
2. Enter complete valid data
3. Click "Save"
4. Verify status badge shows "AWAITING_SUPERVISION" in orange
5. Verify supervision indicator is visible

**Expected Results:**
- ✅ Training user can enter data
- ✅ Status transitions to AWAITING_SUPERVISION
- ✅ System indicates need for supervisory review

---

### Scenario 6: Self-Review Prevention

**Setup:**
- User: Qualified Analyst (Q) - same user who entered data
- Sample: Has data entered by this user (status: AWAITING_REVIEW)
- Mode: Review

**Steps:**
1. Navigate to TAN form for sample the user entered
2. Verify status badge shows "AWAITING_REVIEW"
3. Verify "Accept" and "Reject" buttons are disabled or hidden
4. Verify message indicates "Cannot review own work"

**Expected Results:**
- ✅ User cannot accept/reject their own data
- ✅ Appropriate message is displayed
- ✅ Workflow prevents self-review

---

### Scenario 7: Admin Delete

**Setup:**
- User: Admin
- Sample: Has accepted data (status: ACCEPTED)
- Mode: View/Admin

**Steps:**
1. Navigate to TAN form
2. Verify status badge shows "ACCEPTED" in green
3. Verify "Delete" button is available (admin only)
4. Click "Delete"
5. Confirm deletion
6. Verify form clears
7. Verify success message

**Expected Results:**
- ✅ Admin can see delete button
- ✅ Delete requires confirmation
- ✅ Data is removed from database
- ✅ Form resets to clean state

---

### Scenario 8: Load Existing Data

**Setup:**
- Sample: Has saved TAN data

**Steps:**
1. Navigate to TAN form for sample with data
2. Wait for loading indicator
3. Verify all form fields populate correctly
4. Verify calculated fields display
5. Verify status badge shows correct status
6. Verify action buttons match current status

**Expected Results:**
- ✅ Loading indicator displays briefly
- ✅ All data loads correctly
- ✅ Calculations update automatically
- ✅ UI reflects current workflow state

---

### Scenario 9: Error Handling

**Steps:**
1. Disconnect from network or simulate API error
2. Try to save TAN data
3. Verify error message displays
4. Verify data remains in form (not lost)
5. Reconnect network
6. Retry save
7. Verify success

**Expected Results:**
- ✅ Error message is clear and helpful
- ✅ User's entered data is preserved
- ✅ User can retry after fixing issue

---

### Scenario 10: Calculation Quality Checks

**Steps:**
1. Enter data that produces negative volume:
   - Initial Buret: 10.00 mL
   - Final Buret: 5.00 mL
2. Verify quality control warning appears
3. Verify warning icon and message are visible
4. Correct the data
5. Verify warning clears

**Expected Results:**
- ✅ Quality check detects negative volume
- ✅ Warning displays prominently
- ✅ Warning clears when data is corrected

---

## Performance Testing

### Load Time Benchmarks

- ✅ **Form initialization:** < 100ms
- ✅ **Status load:** < 200ms
- ✅ **Data load:** < 300ms
- ✅ **Save operation:** < 500ms
- ✅ **Status transition:** < 400ms

### Responsiveness

- Test form on different screen sizes:
  - Desktop (1920x1080)
  - Tablet (768x1024)
  - Mobile (375x667)

---

## Browser Compatibility

Test in:
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)

---

## Accessibility Testing

- ✅ Keyboard navigation works throughout form
- ✅ Screen reader can announce form fields
- ✅ Status badge has appropriate ARIA labels
- ✅ Action buttons have descriptive labels
- ✅ Error messages are announced
- ✅ Color contrast meets WCAG AA standards

---

## Documentation Testing

- ✅ Code comments are accurate and helpful
- ✅ Type definitions match implementation
- ✅ Integration documentation matches actual behavior

---

## Regression Testing

After confirming the TAN form works correctly, verify:

1. **Other forms still work:**
   - Vis40, Vis100, etc.
   - No unintended side effects

2. **Existing features still work:**
   - Sample selection
   - Test type selection
   - Navigation

---

## Test Execution Checklist

### Pre-Testing
- [ ] Backend API is running
- [ ] Frontend dev server is running
- [ ] Test database has appropriate sample data
- [ ] Browser DevTools console is open
- [ ] Network tab is monitoring requests

### During Testing
- [ ] Record any bugs/issues found
- [ ] Note performance observations
- [ ] Capture screenshots of issues
- [ ] Document unexpected behavior

### Post-Testing
- [ ] All critical tests passed
- [ ] Known issues documented
- [ ] Performance is acceptable
- [ ] Ready for batch integration of remaining forms

---

## Success Criteria

The TAN form integration is considered successful when:

1. ✅ All automated unit tests pass
2. ✅ All manual test scenarios complete successfully
3. ✅ No critical bugs or regressions
4. ✅ Performance meets benchmarks
5. ✅ User experience is smooth and intuitive
6. ✅ Status workflow operates as designed
7. ✅ Data persistence is reliable
8. ✅ Error handling is robust

---

## Next Steps After Successful Testing

Once TAN form testing is complete and successful:

1. **Document any refinements** made during testing
2. **Update integration pattern** based on lessons learned
3. **Run batch integration script** for remaining forms
4. **Apply same testing approach** to each integrated form
5. **Create regression test suite** for ongoing validation

---

## Contact & Notes

- Testing performed by: [Your Name]
- Date completed: [Date]
- Issues found: [Link to issue tracker]
- Test results: [Pass/Fail with notes]


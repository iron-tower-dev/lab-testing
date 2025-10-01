# Gap 2: Status Workflow System
## VB.NET ASP → Angular 19+ Implementation Guide

---

## Part 1: VB.NET ASP Implementation Analysis

### A. Status Codes Used Throughout Legacy System

```vbscript
' Status codes from saveResultsFunctions.txt and enterResults.txt:
'
' X = Not started (initial state)
' A = Awaiting entry (rejected/needs entry)  
' T = Training entry (needs review by qualified tech)
' P = Partial entry (Ferrography - awaiting microscope work)
' E = Entry complete (awaiting validation by reviewer)
' S = Saved/Validated (complete - ready for reporting)
' D = Done (validated by reviewer - final state)
' C = Complete (microscope work done)
```

### B. Status Transitions in Legacy Code

#### 1. Initial Entry (enterReadings function)

```vbscript
sub enterReadings(blnPartial)
  ' Determine status based on qualification and partial save
  if status="T" or status="A" or 
     (strTestID="210" and status="P" and 
      (qualified(strTestID) = "Q/QAG" or qualified(strTestID) = "MicrE")) then
    ' Training or awaiting entry - don't validate yet
    valid="NULL"
    valdate="NULL"
  else
    ' Regular entry - mark as validated
    valid=entid
    valdate="'" & datenow & "'"
  end if
  
  ' For partial saves, don't set entry date yet
  if blnPartial=true and not(...specific conditions...) then
    entid = "NULL"
    datenow = "NULL"
  end if
  
  ' Insert/update records with determined status
  insertRecord(..., status, ...)
end sub
```

#### 2. Status Assignment Logic (saveResultsFunctions.txt lines 67-105)

```vbscript
' EXAMPLE: Ferrography (Test 210) status logic
select case Request.Form("hidMode")
  case "entry"
    select case qualified(strTestID)
      case "Q/QAG", "MicrE"
        if Request.Form("hidpartial")="y" then
          if strTestID="210" then
            status="P"  ' Partial - awaiting microscope
            enterReadings true
            markReadyForMicroscope strSampleID, strTestID, status
          else
            status = "A"  ' Awaiting
            enterReadings true
            markReadyForMicroscope strSampleID, strTestID, status
          end if
        else ' not a partial save
          if strDelete = "y" Then
            deleteSelectedRecords
          else
            if strmediaready = "y" Then
              enterReadings true
              markReadyForMicroscope strSampleID, strTestID, "E"  ' Entry complete
            else
              status="S"  ' Saved/Validated
              enterReadings false
              UpdateMTE strSampleID, strTestID, datenow
            end if
          end if
        end if
      case "TRAIN"
        if Request.Form("hidpartial")="y" then
          status="A"  ' Awaiting (partial training)
          enterReadings true
        else
          status="T"  ' Training (needs review)
          if strmediaready = "y" Then
            enterReadings true
            if strTestID = "210" then
              markReadyForMicroscope strSampleID, strTestID, "E"
            else
              markReadyForMicroscope strSampleID, strTestID, "T"
            end if
          else
            enterReadings false
            UpdateMTE strSampleID, strTestID, datenow
          end if
        end if
      case else
        strDBError="You are not authorized to enter these results"
    end select
  case "reviewaccept"
    ' Reviewer accepting results
    select case qualifiedToReview(strSampleID,strTestID)
      case "Q/QAG", "MicrE"
        if strTestID="210" and qualifiedToReview(strSampleID,strTestID) = "Q/QAG" THEN
          status="P"  ' Move to partial (awaiting MicrE)
          markReadyForMicroscope strSampleID, strTestID, status
        elseif (strTestID="120" or strTestID="180" or strTestID="240") THEN
          status="E"  ' Entry complete (awaiting microscope)
          enterReadings false
          markReadyForMicroscope strSampleID, strTestID, status
        else
          status="S"  ' Saved (final)
          validateReadings
        end if
      case else
        strDBError="You are not authorized to review these results"
    end select
  case "reviewreject"
    ' Reviewer rejecting results - back to awaiting
    select case qualifiedToReview(strSampleID,strTestID)
      case "Q/QAG", "MicrE"
        rejectReadings  ' Sets status back to "A" or "E"
      case else
        strDBError="You are not authorized to review these results"
    end select
end select
```

#### 3. Validation Function (markRecordsValid)

```vbscript
function markRecordsValid(sid,tid)
  ' Accept results - mark as Done
  strWhere="sampleid=" & sid & " AND testid=" & tid
  strSet="status='D',validateid='" & Session("USR") & "',validate='" & datenow & "'"
  sql="UPDATE testreadings SET " & strSet & " WHERE " & strWhere
  ' Execute and return success
end function
```

#### 4. Rejection Function (markRecordsRejected)

```vbscript
function markRecordsRejected(sid,tid)
  ' Delete all readings and associated data
  sql="DELETE FROM testreadings WHERE sampleid=" & sid & " AND testid=" & tid
  conn.Execute(sql)
  
  ' Delete test-specific tables
  select case tid
    case "30","40"
      sql="DELETE FROM emspectro WHERE id=" & sid & " AND testid=" & tid
    case "70"
      sql="DELETE FROM ftir WHERE sampleid=" & sid
    case "160"
      sql="DELETE FROM particlecount WHERE id=" & sid
    case "120","180","210","240"
      sql="DELETE FROM ParticleSubType WHERE sampleid=" & sid & " AND testid=" & tid
      conn.Execute(sql)
      sql="DELETE FROM ParticleType WHERE sampleid=" & sid & " AND testid=" & tid
  end select
  conn.Execute(sql)
  
  ' Re-insert placeholder record with "E" or "A" status
  if strTestID="210" then
    sql="INSERT INTO testreadings (sampleid,testid,trialnumber,status) " &
        "VALUES (" & sid & "," & tid & ",1,'E')"
  else
    sql="INSERT INTO testreadings (sampleid,testid,trialnumber,status) " &
        "VALUES (" & sid & "," & tid & ",1,'A')"
  end if
  conn.Execute(sql)
end function
```

#### 5. Microscope Ready Function

```vbscript
function markReadyForMicroscope(sid,tid,status)
  ' Update test reading status
  sql="Update testreadings set status = '" & status & "' " &
      "WHERE sampleid=" & sid & " AND testid=" & tid
  conn.Execute sql
  
  ' Update sample status to "returned"
  sql="Update UsedLubeSamples set status = 90, returnedDate = GetDate() " &
      "WHERE sampleid=" & sid
  conn.Execute sql
end function
```

### C. Button Display Logic Based on Status (enterResults.txt lines 1189-1344)

**Complex decision tree determines which buttons to show:**

```vbscript
' Variables for button HTML
acceptRejectButtons = "<td><input type=button value='Accept' ... ></td><td><input type=button value='Reject' ... ></td>"
saveButton = "<td><input type=button value='Save' ... ></td>"
partSaveButton = "<td><input type=button value='Partial Save' ... ></td>"
clearButton = "<td><input type=button value='Clear' ... ></td>"
deleteButton = "<td><input type=button value='Delete' ... ></td>"
mediaReadyButton = "<td><input type=button value='Media Ready' ... ></td>"

' Determine which buttons based on:
' - testID
' - userQualification (QQAG, MicrE, TRAIN)
' - mode (entry, review)
' - statusCode (X, A, T, P, E, S, D, C)
' - enteredQualification (who entered it)
' - hidpartial (was it a partial save)

' EXAMPLE for Ferrography (210) in Review Mode:
if strMode="review" then
  ' If (Ferrogram AND ( User has MicrE qual OR 
  '     (User has QQAG qual AND result not entered by MicrE qual) ) ) 
  ' THEN show Partial Save button
  if (strTestID="210" and ((QQAG and enteredQualification <> "MicrE") or MicrE)) then
    Response.Write partSaveButton
  end if
  
  ' If ( (Ferrogram AND User has MicrE qual AND result status "P") OR 
  '      (NOT Ferrogram AND User has MicrE qual AND result status "T" / "E") ) 
  ' THEN show Save button
  if ((strTestID="210" and MicrE and strStatusCode = "P") or
      ((strTestID <> "210") and MicrE and (strStatusCode = "T" or strStatusCode = "E"))) then
    Response.Write saveButton
  end if
  
  ' Show Accept / Reject buttons based on complex rules...
end if
```

---

## Part 2: Status State Machine Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                   STATUS WORKFLOW                             │
└──────────────────────────────────────────────────────────────┘

    [NEW SAMPLE]
         │
         v
      ┌─────┐
      │  X  │  Not Started
      └─────┘
         │
         │ [Assigned to user]
         v
      ┌─────┐
      │  A  │  Awaiting Entry / Rejected
      └─────┘
         │
         │ [User enters data]
         v
         ├─> TRAIN user? ──Yes──> ┌─────┐
         │                          │  T  │  Training (Needs Review)
         │                          └─────┘
         │                             │
         │                             │ [Reviewer accepts]
         │                             v
         │                          ┌─────┐
         │                          │  S  │  Saved/Validated
         │                          └─────┘
         │                             │
         │                             │ [Final validation]
         │                             v
         │                          ┌─────┐
         │                          │  D  │  Done (FINAL)
         │                          └─────┘
         │
         ├─> Partial save? ──Yes──> ┌─────┐
         │                           │  P  │  Partial (Awaiting microscope)
         │                           └─────┘
         │                              │
         │                              │ [Microscope work done]
         │                              v
         │                           ┌─────┐
         │                           │  E  │  Entry Complete
         │                           └─────┘
         │                              │
         │                              v
         │                           (continue below)
         │
         ├─> Full entry ──────────> ┌─────┐
         │                           │  E  │  Entry Complete (Awaiting validation)
         │                           └─────┘
         │                              │
         │                              │ [Reviewer accepts]
         │                              v
         │                           ┌─────┐
         │                           │  S  │  Saved/Validated
         │                           └─────┘
         │                              │
         │                              │ [Final validation]
         │                              v
         │                           ┌─────┐
         │                           │  D  │  Done (FINAL)
         │                           └─────┘
         │
         └─> Microscope tests? ────> ┌─────┐
                                      │  E  │  Entry Complete
                                      └─────┘
                                         │
                                         │ [Microscope complete]
                                         v
                                      ┌─────┐
                                      │  C  │  Complete (FINAL)
                                      └─────┘

         [At any E/T/P state]
              │
              │ [Reviewer rejects]
              v
           ┌─────┐
           │  A  │  Back to Awaiting
           └─────┘
```

---

## Part 3: Angular 19+ Implementation Plan

### Step 1: Define Status Workflow Types

**File:** `src/app/types/status-workflow.types.ts`

```typescript
/**
 * Test result status codes
 */
export enum TestStatus {
  NOT_STARTED = 'X',
  AWAITING = 'A',
  TRAINING = 'T',
  PARTIAL = 'P',
  ENTRY_COMPLETE = 'E',
  SAVED = 'S',
  DONE = 'D',
  COMPLETE = 'C'
}

/**
 * Display information for each status
 */
export interface StatusInfo {
  code: TestStatus;
  label: string;
  description: string;
  color: string;
  icon: string;
  isFinal: boolean;
}

/**
 * Valid status transitions
 */
export interface StatusTransition {
  from: TestStatus;
  to: TestStatus;
  action: string;
  requiresQualification?: string[];
  conditions?: string[];
}

/**
 * Action buttons available for a status
 */
export interface StatusAction {
  action: 'save' | 'partial-save' | 'media-ready' | 'accept' | 'reject' | 'delete' | 'clear';
  label: string;
  icon?: string;
  requiresQualification?: string[];
  requiresCondition?: (context: ActionContext) => boolean;
}

/**
 * Context for determining available actions
 */
export interface ActionContext {
  testId: number;
  sampleId: number;
  currentStatus: TestStatus;
  userQualification: string | null;
  enteredBy: string | null;
  currentUser: string;
  mode: 'entry' | 'review' | 'view';
  isPartialSave: boolean;
  isTraining: boolean;
}

/**
 * Result of status transition attempt
 */
export interface StatusTransitionResult {
  success: boolean;
  newStatus: TestStatus;
  message?: string;
  requiresAdditionalAction?: boolean;
}
```

### Step 2: Status Workflow Service

**File:** `src/app/services/status-workflow.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { TestStatus, StatusInfo, StatusTransition, StatusAction, ActionContext } from '../types/status-workflow.types';

@Injectable({
  providedIn: 'root'
})
export class StatusWorkflowService {
  
  /**
   * Status display information
   */
  private readonly statusInfo: Record<TestStatus, StatusInfo> = {
    [TestStatus.NOT_STARTED]: {
      code: TestStatus.NOT_STARTED,
      label: 'Not Started',
      description: 'Sample has been created but no work has begun',
      color: '#9ca3af',
      icon: '○',
      isFinal: false
    },
    [TestStatus.AWAITING]: {
      code: TestStatus.AWAITING,
      label: 'Awaiting Entry',
      description: 'Ready for data entry or has been rejected',
      color: '#f59e0b',
      icon: '⏳',
      isFinal: false
    },
    [TestStatus.TRAINING]: {
      code: TestStatus.TRAINING,
      label: 'Training',
      description: 'Entered by trainee, needs review',
      color: '#fbbf24',
      icon: '🎓',
      isFinal: false
    },
    [TestStatus.PARTIAL]: {
      code: TestStatus.PARTIAL,
      label: 'Partial Entry',
      description: 'Partially entered, awaiting microscope work',
      color: '#60a5fa',
      icon: '◐',
      isFinal: false
    },
    [TestStatus.ENTRY_COMPLETE]: {
      code: TestStatus.ENTRY_COMPLETE,
      label: 'Entry Complete',
      description: 'Data entry complete, awaiting validation',
      color: '#3b82f6',
      icon: '✓',
      isFinal: false
    },
    [TestStatus.SAVED]: {
      code: TestStatus.SAVED,
      label: 'Saved',
      description: 'Validated and saved',
      color: '#10b981',
      icon: '✓✓',
      isFinal: false
    },
    [TestStatus.DONE]: {
      code: TestStatus.DONE,
      label: 'Done',
      description: 'Final validation complete',
      color: '#059669',
      icon: '✓✓✓',
      isFinal: true
    },
    [TestStatus.COMPLETE]: {
      code: TestStatus.COMPLETE,
      label: 'Complete',
      description: 'Microscope work complete',
      color: '#8b5cf6',
      icon: '🔬',
      isFinal: true
    }
  };

  /**
   * Valid status transitions
   */
  private readonly transitions: StatusTransition[] = [
    // From NOT_STARTED
    { from: TestStatus.NOT_STARTED, to: TestStatus.AWAITING, action: 'assign' },
    
    // From AWAITING
    { from: TestStatus.AWAITING, to: TestStatus.TRAINING, action: 'enter', requiresQualification: ['TRAIN'] },
    { from: TestStatus.AWAITING, to: TestStatus.PARTIAL, action: 'partial-save', requiresQualification: ['Q', 'QAG', 'MicrE'] },
    { from: TestStatus.AWAITING, to: TestStatus.ENTRY_COMPLETE, action: 'complete-entry', requiresQualification: ['Q', 'QAG', 'MicrE'] },
    { from: TestStatus.AWAITING, to: TestStatus.SAVED, action: 'save-and-validate', requiresQualification: ['Q', 'QAG', 'MicrE'] },
    
    // From TRAINING
    { from: TestStatus.TRAINING, to: TestStatus.AWAITING, action: 'reject', requiresQualification: ['Q', 'QAG', 'MicrE'] },
    { from: TestStatus.TRAINING, to: TestStatus.SAVED, action: 'accept', requiresQualification: ['Q', 'QAG', 'MicrE'] },
    { from: TestStatus.TRAINING, to: TestStatus.ENTRY_COMPLETE, action: 'accept-microscope', requiresQualification: ['Q', 'QAG', 'MicrE'], conditions: ['microscope-test'] },
    
    // From PARTIAL
    { from: TestStatus.PARTIAL, to: TestStatus.AWAITING, action: 'reject', requiresQualification: ['Q', 'QAG', 'MicrE'] },
    { from: TestStatus.PARTIAL, to: TestStatus.ENTRY_COMPLETE, action: 'complete-microscope', requiresQualification: ['MicrE'] },
    
    // From ENTRY_COMPLETE
    { from: TestStatus.ENTRY_COMPLETE, to: TestStatus.AWAITING, action: 'reject', requiresQualification: ['Q', 'QAG', 'MicrE'] },
    { from: TestStatus.ENTRY_COMPLETE, to: TestStatus.SAVED, action: 'validate', requiresQualification: ['Q', 'QAG', 'MicrE'] },
    { from: TestStatus.ENTRY_COMPLETE, to: TestStatus.COMPLETE, action: 'complete-microscope', requiresQualification: ['MicrE'], conditions: ['microscope-test'] },
    
    // From SAVED
    { from: TestStatus.SAVED, to: TestStatus.DONE, action: 'final-validate', requiresQualification: ['QAG', 'MicrE'] }
  ];

  /**
   * Get display information for a status
   */
  getStatusInfo(status: TestStatus): StatusInfo {
    return this.statusInfo[status];
  }

  /**
   * Check if transition is valid
   */
  canTransition(from: TestStatus, to: TestStatus, userQualification: string | null): boolean {
    const transition = this.transitions.find(t => t.from === from && t.to === to);
    
    if (!transition) {
      return false;
    }
    
    if (transition.requiresQualification && userQualification) {
      return transition.requiresQualification.includes(userQualification);
    }
    
    return true;
  }

  /**
   * Get all valid next statuses from current status
   */
  getValidNextStatuses(currentStatus: TestStatus, userQualification: string | null): TestStatus[] {
    return this.transitions
      .filter(t => t.from === currentStatus)
      .filter(t => !t.requiresQualification || 
                   (userQualification && t.requiresQualification.includes(userQualification)))
      .map(t => t.to);
  }

  /**
   * Determine status for new entry based on context
   */
  determineEntryStatus(context: ActionContext): TestStatus {
    // Training user
    if (context.userQualification === 'TRAIN') {
      return context.isPartialSave ? TestStatus.AWAITING : TestStatus.TRAINING;
    }
    
    // Partial save
    if (context.isPartialSave) {
      // Ferrography partial save
      if (context.testId === 210) {
        return TestStatus.PARTIAL;
      }
      return TestStatus.AWAITING;
    }
    
    // Microscope tests
    const microscopeTests = [120, 180, 210, 240];
    if (microscopeTests.includes(context.testId)) {
      return TestStatus.ENTRY_COMPLETE;
    }
    
    // Regular save by qualified user
    if (context.userQualification === 'Q' || 
        context.userQualification === 'QAG' || 
        context.userQualification === 'MicrE') {
      return TestStatus.SAVED;
    }
    
    return TestStatus.ENTRY_COMPLETE;
  }

  /**
   * Determine status after review action
   */
  determineReviewStatus(context: ActionContext, action: 'accept' | 'reject'): TestStatus {
    if (action === 'reject') {
      // Rejection always goes back to awaiting (with data deleted)
      return TestStatus.AWAITING;
    }
    
    // Accept action
    if (context.testId === 210 && context.userQualification === 'QAG') {
      // Ferrography accepted by QAG goes to partial (awaits MicrE)
      return TestStatus.PARTIAL;
    }
    
    const microscopeTests = [120, 180, 240];
    if (microscopeTests.includes(context.testId)) {
      return TestStatus.ENTRY_COMPLETE;
    }
    
    return TestStatus.SAVED;
  }

  /**
   * Get available actions for current context
   */
  getAvailableActions(context: ActionContext): StatusAction[] {
    const actions: StatusAction[] = [];
    
    // View mode - no actions
    if (context.mode === 'view') {
      return [];
    }
    
    // Review mode
    if (context.mode === 'review') {
      return this.getReviewActions(context);
    }
    
    // Entry mode
    return this.getEntryActions(context);
  }

  /**
   * Get actions available in entry mode
   */
  private getEntryActions(context: ActionContext): StatusAction[] {
    const actions: StatusAction[] = [];
    const microscopeTests = [120, 180, 210, 240];
    const isMicroscopeTest = microscopeTests.includes(context.testId);
    
    // Partial save button
    if (context.currentStatus === TestStatus.NOT_STARTED || 
        context.currentStatus === TestStatus.AWAITING ||
        context.currentStatus === TestStatus.PARTIAL) {
      
      // Ferrography partial save rules
      if (context.testId === 210) {
        if (context.userQualification === 'TRAIN' ||
            context.userQualification === 'Q' ||
            context.userQualification === 'QAG' ||
            context.userQualification === 'MicrE') {
          actions.push({
            action: 'partial-save',
            label: 'Partial Save',
            icon: '⚡',
            requiresQualification: ['TRAIN', 'Q', 'QAG', 'MicrE']
          });
        }
      }
      
      // Viscosity partial save (Q/QAG only)
      if (context.testId === 50 || context.testId === 60) {
        if (context.userQualification === 'Q' || context.userQualification === 'QAG') {
          actions.push({
            action: 'partial-save',
            label: 'Partial Save',
            icon: '⚡',
            requiresQualification: ['Q', 'QAG']
          });
        }
      }
    }
    
    // Save button
    if (context.userQualification === 'Q' || 
        context.userQualification === 'QAG' || 
        context.userQualification === 'MicrE') {
      
      // Special logic for microscope tests
      if (isMicroscopeTest && context.userQualification === 'MicrE') {
        if (context.currentStatus === TestStatus.TRAINING ||
            context.currentStatus === TestStatus.ENTRY_COMPLETE ||
            context.currentStatus === TestStatus.PARTIAL) {
          actions.push({
            action: 'save',
            label: 'Save',
            icon: '💾',
            requiresQualification: ['MicrE']
          });
        }
      } else if (!context.isTraining || context.currentStatus !== TestStatus.COMPLETE) {
        actions.push({
          action: 'save',
          label: 'Save',
          icon: '💾',
          requiresQualification: ['Q', 'QAG', 'MicrE']
        });
      }
    }
    
    // Clear button
    if (context.testId === 210 && context.userQualification === 'TRAIN') {
      actions.push({
        action: 'clear',
        label: 'Clear',
        icon: '🗑️'
      });
    }
    
    // Media Ready button (microscope tests)
    if (isMicroscopeTest) {
      const shouldShow = 
        (context.testId !== 210 || context.currentStatus === TestStatus.NOT_STARTED) &&
        !(context.testId !== 210 && (context.currentStatus === TestStatus.ENTRY_COMPLETE || context.currentStatus === TestStatus.COMPLETE));
      
      if (shouldShow) {
        actions.push({
          action: 'media-ready',
          label: 'Media Ready',
          icon: '📊'
        });
      }
    }
    
    // Delete button
    if (context.userQualification === 'QAG' || context.userQualification === 'MicrE') {
      const canDelete = 
        (context.testId === 210 && (context.currentStatus === TestStatus.ENTRY_COMPLETE || 
                                     context.currentStatus === TestStatus.COMPLETE ||
                                     context.currentStatus === TestStatus.PARTIAL)) ||
        (context.testId !== 210 && context.currentStatus !== TestStatus.COMPLETE);
      
      if (canDelete) {
        actions.push({
          action: 'delete',
          label: 'Delete',
          icon: '❌',
          requiresQualification: ['QAG', 'MicrE']
        });
      }
    }
    
    return actions;
  }

  /**
   * Get actions available in review mode
   */
  private getReviewActions(context: ActionContext): StatusAction[] {
    const actions: StatusAction[] = [];
    const microscopeTests = [120, 180, 210, 240];
    
    // Can't review own work
    if (context.enteredBy === context.currentUser) {
      return [];
    }
    
    // Only Q/QAG/MicrE can review
    if (context.userQualification !== 'Q' && 
        context.userQualification !== 'QAG' && 
        context.userQualification !== 'MicrE') {
      return [];
    }
    
    // Ferrography specific rules
    if (context.testId === 210) {
      if (context.userQualification === 'QAG' || context.userQualification === 'MicrE') {
        // Partial save button for Q/QAG reviewing non-MicrE entry
        actions.push({
          action: 'partial-save',
          label: 'Partial Save',
          icon: '⚡'
        });
      }
      
      if (context.userQualification === 'MicrE' && context.currentStatus === TestStatus.PARTIAL) {
        actions.push({
          action: 'save',
          label: 'Save',
          icon: '💾'
        });
      }
      
      if (context.currentStatus === TestStatus.PARTIAL) {
        actions.push({
          action: 'delete',
          label: 'Delete',
          icon: '❌'
        });
      }
      
      if (context.userQualification === 'MicrE') {
        actions.push({
          action: 'accept',
          label: 'Accept',
          icon: '✅'
        });
        actions.push({
          action: 'reject',
          label: 'Reject',
          icon: '🚫'
        });
      }
    } else if (microscopeTests.includes(context.testId)) {
      // Other microscope tests
      if (context.userQualification === 'MicrE' && 
          (context.currentStatus === TestStatus.TRAINING || context.currentStatus === TestStatus.ENTRY_COMPLETE)) {
        actions.push({
          action: 'save',
          label: 'Save',
          icon: '💾'
        });
      }
      
      if (context.userQualification === 'QAG' || 
          (context.userQualification === 'MicrE' && context.currentStatus === TestStatus.TRAINING)) {
        actions.push({
          action: 'accept',
          label: 'Accept',
          icon: '✅'
        });
        actions.push({
          action: 'reject',
          label: 'Reject',
          icon: '🚫'
        });
      }
    } else {
      // Regular tests
      if (!(context.testId === 50 || context.testId === 60) || 
          context.userQualification !== 'TRAIN' || 
          context.currentStatus !== TestStatus.TRAINING) {
        actions.push({
          action: 'accept',
          label: 'Accept',
          icon: '✅'
        });
        actions.push({
          action: 'reject',
          label: 'Reject',
          icon: '🚫'
        });
      }
    }
    
    return actions;
  }

  /**
   * Check if status is final (no more changes allowed)
   */
  isFinalStatus(status: TestStatus): boolean {
    return this.statusInfo[status].isFinal;
  }
}
```

### Step 3: Status Backend API

**File:** `server/api/routes/status-transitions.ts`

```typescript
import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { db, schema } from '../db/connection';

const statusTransitions = new Hono();

// POST /api/status-transitions/transition
// Perform a status transition
statusTransitions.post('/transition', async (c) => {
  try {
    const body = await c.req.json();
    const { sampleId, testId, newStatus, userId, action } = body;
    
    // Validate required fields
    if (!sampleId || !testId || !newStatus || !userId) {
      return c.json({
        success: false,
        error: 'Missing required fields'
      }, 400);
    }
    
    // Get current test reading
    const currentReading = await db.select()
      .from(schema.testReadingsTable)
      .where(and(
        eq(schema.testReadingsTable.sampleId, sampleId),
        eq(schema.testReadingsTable.testId, testId)
      ))
      .get();
    
    if (!currentReading) {
      return c.json({
        success: false,
        error: 'Test reading not found'
      }, 404);
    }
    
    // Perform transition based on action
    let updateData: any = { status: newStatus };
    
    switch (action) {
      case 'accept':
        updateData.validateId = userId;
        updateData.valiDate = Math.floor(Date.now() / 1000);
        break;
      case 'reject':
        // Delete and recreate with awaiting status
        await db.delete(schema.testReadingsTable)
          .where(and(
            eq(schema.testReadingsTable.sampleId, sampleId),
            eq(schema.testReadingsTable.testId, testId)
          ));
        
        await db.insert(schema.testReadingsTable).values({
          sampleId,
          testId,
          trialNumber: 1,
          status: testId === 210 ? 'E' : 'A',
          trialComplete: false
        });
        
        return c.json({
          success: true,
          newStatus: testId === 210 ? 'E' : 'A',
          message: 'Results rejected and reset'
        });
      case 'save':
        updateData.entryId = userId;
        updateData.entryDate = Math.floor(Date.now() / 1000);
        break;
    }
    
    // Update status
    await db.update(schema.testReadingsTable)
      .set(updateData)
      .where(and(
        eq(schema.testReadingsTable.sampleId, sampleId),
        eq(schema.testReadingsTable.testId, testId)
      ));
    
    return c.json({
      success: true,
      newStatus,
      message: `Status transitioned to ${newStatus}`
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to transition status',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// GET /api/status-transitions/current/:sampleId/:testId
// Get current status for a test
statusTransitions.get('/current/:sampleId/:testId', async (c) => {
  try {
    const sampleId = parseInt(c.req.param('sampleId'));
    const testId = parseInt(c.req.param('testId'));
    
    const reading = await db.select()
      .from(schema.testReadingsTable)
      .where(and(
        eq(schema.testReadingsTable.sampleId, sampleId),
        eq(schema.testReadingsTable.testId, testId)
      ))
      .get();
    
    if (!reading) {
      return c.json({
        success: false,
        error: 'Test reading not found'
      }, 404);
    }
    
    return c.json({
      success: true,
      status: reading.status,
      entryId: reading.entryId,
      validateId: reading.validateId,
      entryDate: reading.entryDate,
      valiDate: reading.valiDate
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to get status',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default statusTransitions;
```

### Step 4: Status Display Component

**File:** `src/app/enter-results/components/status-badge.component.ts`

```typescript
import { Component, input, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TestStatus } from '../../types/status-workflow.types';
import { StatusWorkflowService } from '../../services/status-workflow.service';

@Component({
  selector: 'app-status-badge',
  imports: [CommonModule],
  template: `
    <div class="status-badge" [style.background-color]="statusInfo().color">
      <span class="icon">{{ statusInfo().icon }}</span>
      <span class="label">{{ statusInfo().label }}</span>
    </div>
    @if (showDescription()) {
      <div class="status-description">
        {{ statusInfo().description }}
      </div>
    }
  `,
  styles: [`
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      font-weight: 600;
      color: white;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }
    
    .status-description {
      margin-top: 0.5rem;
      font-size: 0.875rem;
      color: #6b7280;
      font-style: italic;
    }
  `]
})
export class StatusBadgeComponent {
  private statusService = inject(StatusWorkflowService);
  
  status = input.required<TestStatus>();
  showDescription = input<boolean>(false);
  
  statusInfo = computed(() => 
    this.statusService.getStatusInfo(this.status())
  );
}
```

### Step 5: Action Buttons Component

**File:** `src/app/enter-results/components/action-buttons.component.ts`

```typescript
import { Component, input, output, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActionContext } from '../../types/status-workflow.types';
import { StatusWorkflowService } from '../../services/status-workflow.service';

@Component({
  selector: 'app-action-buttons',
  imports: [CommonModule],
  template: `
    <div class="action-buttons">
      @for (action of availableActions(); track action.action) {
        <button 
          class="action-button"
          [class.primary]="action.action === 'save' || action.action === 'accept'"
          [class.danger]="action.action === 'delete' || action.action === 'reject'"
          (click)="actionClicked.emit(action.action)">
          @if (action.icon) {
            <span class="icon">{{ action.icon }}</span>
          }
          {{ action.label }}
        </button>
      }
    </div>
  `,
  styles: [`
    .action-buttons {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    
    .action-button {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      background-color: white;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
    }
    
    .action-button:hover {
      background-color: #f3f4f6;
    }
    
    .action-button.primary {
      background-color: #3b82f6;
      color: white;
      border-color: #3b82f6;
    }
    
    .action-button.primary:hover {
      background-color: #2563eb;
    }
    
    .action-button.danger {
      background-color: #ef4444;
      color: white;
      border-color: #ef4444;
    }
    
    .action-button.danger:hover {
      background-color: #dc2626;
    }
  `]
})
export class ActionButtonsComponent {
  private statusService = inject(StatusWorkflowService);
  
  context = input.required<ActionContext>();
  actionClicked = output<string>();
  
  availableActions = computed(() => 
    this.statusService.getAvailableActions(this.context())
  );
}
```

---

## Part 4: Migration Checklist

- [ ] Define status workflow types
- [ ] Implement StatusWorkflowService
- [ ] Create status transition API endpoints
- [ ] Create StatusBadgeComponent
- [ ] Create ActionButtonsComponent
- [ ] Integrate with entry form
- [ ] Add status transition handling
- [ ] Test all transition paths
- [ ] Test authorization integration
- [ ] Document status workflow
- [ ] Train users on new workflow

---

## Summary

This implementation provides:
- ✅ Complete 7-state workflow (X→A→T→P→E→S→D→C)
- ✅ Context-aware action buttons
- ✅ Status-based UI changes
- ✅ Integration with authorization system
- ✅ Validation of transitions
- ✅ Visual status indicators
- ✅ Test-specific workflow rules

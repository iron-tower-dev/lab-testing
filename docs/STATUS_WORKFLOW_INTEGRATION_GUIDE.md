# Status Workflow System Integration Guide

**Date:** 2025-10-01  
**Status:** Implementation Guide  
**Purpose:** Step-by-step guide to integrate status workflow into test entry forms

---

## Overview

The Status Workflow System enables proper laboratory workflow with:
- **8 status states** (X → A → T → P → E → S → D → C)
- **User qualification-based permissions** (Q/QAG/MicrE/TRAIN)
- **Mode-based UI** (entry/review/view)
- **Dynamic action buttons** (Save/Accept/Reject/Delete)
- **Status transitions** (entry → review → accept/reject)

---

## Architecture Components

### 1. Services (Already Implemented ✅)

- **`StatusWorkflowService`** - Business logic for status transitions
- **`StatusTransitionService`** - HTTP client for status API
- **Backend API** - `/api/status-transitions/*` endpoints

### 2. UI Components (Already Implemented ✅)

- **`StatusBadge`** - Color-coded status display
- **`ActionButtons`** - Context-aware action buttons

### 3. Types (Already Implemented ✅)

- **`TestStatus`** - Status enum (X/A/T/P/E/S/D/C)
- **`ActionContext`** - Context for determining available actions
- **`StatusTransitionRequest`** - API request payload

---

## Integration Steps

### Step 1: Update Form Component TypeScript

Add the necessary imports and inject services:

```typescript
// Add to imports
import { StatusWorkflowService } from '../../../../../../shared/services/status-workflow.service';
import { StatusTransitionService } from '../../../../../../shared/services/status-transition.service';
import { TestStatus, ActionContext } from '../../../../../../shared/types/status-workflow.types';
import { ActionButtons } from '../../../../../components/action-buttons/action-buttons';

// Update @Component decorator
@Component({
  // ... existing config ...
  imports: [SharedModule, ActionButtons] // Add ActionButtons
})

// Inject services in class
export class YourFormComponent implements OnInit {
  private statusWorkflow = inject(StatusWorkflowService);
  private statusTransition = inject(StatusTransitionService);
  
  // Add input signals for mode and user info
  mode = input<'entry' | 'review' | 'view'>('entry');
  userQualification = input<string | null>('Q'); // TODO: Get from auth service
  currentUser = input<string>('current_user'); // TODO: Get from auth service
  
  // Add status signal
  currentStatus = signal<TestStatus>(TestStatus.AWAITING);
  
  // Update saveMessage type for better UX
  saveMessage = signal<{ text: string; type: 'success' | 'error' } | null>(null);
  
  // Add action context computed
  actionContext = computed<ActionContext>(() => {
    const sample = this.sampleData();
    return {
      testId: sample?.testReference?.id || 10,
      sampleId: sample?.sampleId || 0,
      currentStatus: this.currentStatus(),
      userQualification: this.userQualification(),
      enteredBy: null, // Loaded from existing data
      currentUser: this.currentUser(),
      mode: this.mode(),
      isPartialSave: false,
      isTraining: this.userQualification() === 'TRAIN'
    };
  });
}
```

### Step 2: Load Current Status on Init

```typescript
ngOnInit(): void {
  this.initializeForm();
  this.loadCurrentStatus(); // Add this
  this.loadExistingData();
}

/**
 * Load current status from API
 */
private loadCurrentStatus(): void {
  const sampleInfo = this.sampleData();
  if (!sampleInfo?.sampleId || !sampleInfo?.testReference?.id) {
    return;
  }
  
  this.statusTransition
    .getCurrentStatus(sampleInfo.sampleId, sampleInfo.testReference.id)
    .subscribe({
      next: (response) => {
        if (response.success && response.status) {
          this.currentStatus.set(response.status as TestStatus);
        }
      },
      error: (error) => {
        console.error('Failed to load status:', error);
        this.currentStatus.set(TestStatus.AWAITING);
      }
    });
}
```

### Step 3: Update Save Logic to Use Dynamic Status

Replace hardcoded status 'E' with dynamic status determination:

```typescript
/**
 * Save results with proper status handling
 */
private saveResults(isPartialSave: boolean = false): void {
  if (!this.form.valid && !isPartialSave) {
    this.showSaveMessage('Please fill in all required fields', 'error');
    return;
  }
  
  const sampleInfo = this.sampleData();
  if (!sampleInfo?.sampleId || !sampleInfo?.testReference?.id) {
    this.showSaveMessage('No sample selected', 'error');
    return;
  }
  
  // Determine new status based on context
  const context = this.actionContext();
  context.isPartialSave = isPartialSave;
  const newStatus = this.statusWorkflow.determineEntryStatus(context);
  
  this.isSaving.set(true);
  
  const trial = {
    sampleId: sampleInfo.sampleId,
    testId: sampleInfo.testReference.id,
    trialNumber: 1,
    // ... other fields ...
    trialComplete: !isPartialSave,
    status: newStatus, // Use dynamic status
    entryId: this.form.get('analystInitials')?.value,
    entryDate: Date.now()
  };
  
  this.testReadingsService.bulkSaveTrials([trial]).subscribe({
    next: () => {
      this.currentStatus.set(newStatus); // Update local status
      this.isSaving.set(false);
      
      const message = isPartialSave 
        ? 'Results partially saved' 
        : 'Results saved successfully';
      this.showSaveMessage(message, 'success');
      
      // Save analyst initials
      const initials = this.form.get('analystInitials')?.value;
      if (initials) {
        localStorage.setItem('analystInitials', initials);
      }
    },
    error: (error) => {
      console.error('Save error:', error);
      this.isSaving.set(false);
      this.showSaveMessage('Failed to save results', 'error');
    }
  });
}
```

### Step 4: Add Action Handler

Add a handler for action button clicks:

```typescript
/**
 * Handle action button clicks
 */
onAction(action: string): void {
  switch (action) {
    case 'save':
      this.saveResults(false);
      break;
    case 'partial-save':
      this.saveResults(true);
      break;
    case 'accept':
      this.acceptResults();
      break;
    case 'reject':
      this.rejectResults();
      break;
    case 'delete':
      this.deleteResults();
      break;
    case 'clear':
      this.clearForm();
      break;
    case 'media-ready':
      this.markMediaReady();
      break;
  }
}
```

### Step 5: Implement Review Actions

Add methods for reviewer actions (accept/reject):

```typescript
/**
 * Accept results (reviewer action)
 */
private acceptResults(): void {
  const sampleInfo = this.sampleData();
  if (!sampleInfo?.sampleId || !sampleInfo?.testReference?.id) return;
  
  this.isSaving.set(true);
  
  const context = this.actionContext();
  const newStatus = this.statusWorkflow.determineReviewStatus(context, 'accept');
  
  this.statusTransition
    .acceptResults(sampleInfo.sampleId, sampleInfo.testReference.id, newStatus, this.currentUser())
    .subscribe({
      next: (result) => {
        if (result.success) {
          this.currentStatus.set(result.newStatus);
          this.showSaveMessage('Results accepted', 'success');
        }
        this.isSaving.set(false);
      },
      error: (error) => {
        console.error('Accept error:', error);
        this.isSaving.set(false);
        this.showSaveMessage('Failed to accept results', 'error');
      }
    });
}

/**
 * Reject results (reviewer action)
 */
private rejectResults(): void {
  if (!confirm('Are you sure you want to reject these results? All data will be deleted.')) {
    return;
  }
  
  const sampleInfo = this.sampleData();
  if (!sampleInfo?.sampleId || !sampleInfo?.testReference?.id) return;
  
  this.isSaving.set(true);
  
  this.statusTransition
    .rejectResults(sampleInfo.sampleId, sampleInfo.testReference.id, this.currentUser())
    .subscribe({
      next: (result) => {
        if (result.success) {
          this.currentStatus.set(result.newStatus);
          this.form.reset();
          this.showSaveMessage('Results rejected and reset', 'success');
        }
        this.isSaving.set(false);
      },
      error: (error) => {
        console.error('Reject error:', error);
        this.isSaving.set(false);
        this.showSaveMessage('Failed to reject results', 'error');
      }
    });
}

/**
 * Delete results (admin action)
 */
private deleteResults(): void {
  if (!confirm('Are you sure you want to delete these results?')) {
    return;
  }
  
  const sampleInfo = this.sampleData();
  if (!sampleInfo?.sampleId || !sampleInfo?.testReference?.id) return;
  
  this.isSaving.set(true);
  
  this.statusTransition
    .deleteResults(sampleInfo.sampleId, sampleInfo.testReference.id, this.currentUser())
    .subscribe({
      next: (result) => {
        if (result.success) {
          this.form.reset();
          this.showSaveMessage('Results deleted', 'success');
        }
        this.isSaving.set(false);
      },
      error: (error) => {
        console.error('Delete error:', error);
        this.isSaving.set(false);
        this.showSaveMessage('Failed to delete results', 'error');
      }
    });
}
```

### Step 6: Add Microscopy Support (If Applicable)

For microscopy tests (120, 180, 210, 240):

```typescript
/**
 * Mark media ready for microscopy
 */
private markMediaReady(): void {
  const sampleInfo = this.sampleData();
  if (!sampleInfo?.sampleId || !sampleInfo?.testReference?.id) return;
  
  this.isSaving.set(true);
  
  this.statusTransition
    .markMediaReady(sampleInfo.sampleId, sampleInfo.testReference.id, this.currentUser())
    .subscribe({
      next: (result) => {
        if (result.success) {
          this.currentStatus.set(result.newStatus);
          this.showSaveMessage('Media marked as ready', 'success');
        }
        this.isSaving.set(false);
      },
      error: (error) => {
        console.error('Media ready error:', error);
        this.isSaving.set(false);
        this.showSaveMessage('Failed to mark media ready', 'error');
      }
    });
}
```

### Step 7: Update Template (HTML)

Add status badge and action buttons to your form template:

```html
<div class="form-container">
  <!-- Loading Overlay -->
  @if (isLoading() || isSaving()) {
    <div class="loading-overlay">
      <mat-spinner diameter="50"></mat-spinner>
      <p>{{ isSaving() ? 'Saving...' : 'Loading...' }}</p>
    </div>
  }
  
  <!-- Save Message -->
  @if (saveMessage()) {
    <div class="save-message" [class.success]="saveMessage()!.type === 'success'" 
                                [class.error]="saveMessage()!.type === 'error'">
      <mat-icon>{{ saveMessage()!.type === 'success' ? 'check_circle' : 'error' }}</mat-icon>
      <span>{{ saveMessage()!.text }}</span>
    </div>
  }
  
  <!-- Form Header with Status -->
  <div class="form-header">
    <h2>Test Entry Form</h2>
    <app-status-badge [status]="currentStatus()" [showDescription]="true" />
  </div>
  
  <!-- Form Fields -->
  <form [formGroup]="form">
    <!-- Your existing form fields -->
  </form>
  
  <!-- Action Buttons (Dynamic based on context) -->
  <div class="form-actions">
    <app-action-buttons 
      [context]="actionContext()"
      (actionClicked)="onAction($event)" />
  </div>
</div>
```

### Step 8: Update CSS for Save Messages

Add styles for success/error messages:

```css
.save-message {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1001;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  animation: slideIn 0.3s ease-out;
  font-weight: 500;
}

.save-message.success {
  background-color: #10b981;
  color: white;
}

.save-message.error {
  background-color: #ef4444;
  color: white;
}

.save-message mat-icon {
  font-size: 1.5rem;
  width: 1.5rem;
  height: 1.5rem;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.form-actions {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}
```

---

## Status Determination Logic

### Entry Mode Status

The `determineEntryStatus()` method determines the new status based on:

1. **User Qualification**:
   - `TRAIN` → **T** (Training) or **A** (Awaiting) if partial
   - `Q/QAG/MicrE` → **S** (Saved) or **E** (Entry Complete) for microscopy tests

2. **Partial Save**:
   - Ferrography (210) → **P** (Partial)
   - Others → **A** (Awaiting)

3. **Microscopy Tests** (120, 180, 210, 240):
   - Always → **E** (Entry Complete)

### Review Mode Status

The `determineReviewStatus()` method determines status after review:

1. **Accept**:
   - Ferrography by QAG → **P** (awaits MicrE)
   - Microscopy tests (120, 180, 240) → **E** (Entry Complete)
   - Regular tests → **S** (Saved)

2. **Reject**:
   - Ferrography → **E** (Entry Complete)
   - Others → **A** (Awaiting)

---

## Status Badge Colors

| Status | Color | Icon | Description |
|--------|-------|------|-------------|
| **X** Not Started | Gray (#9ca3af) | ○ | Initial state |
| **A** Awaiting | Amber (#f59e0b) | ⏳ | Ready for entry or rejected |
| **T** Training | Yellow (#fbbf24) | 🎓 | Trainee entry, needs review |
| **P** Partial | Blue (#60a5fa) | ◐ | Awaiting microscope work |
| **E** Entry Complete | Blue (#3b82f6) | ✓ | Awaiting validation |
| **S** Saved | Green (#10b981) | ✓✓ | Validated and saved |
| **D** Done | Dark Green (#059669) | ✓✓✓ | Final validation complete |
| **C** Complete | Purple (#8b5cf6) | 🔬 | Microscope work complete |

---

## Action Button Display Logic

### Entry Mode

| Status | Q/QAG/MicrE | TRAIN | Actions Shown |
|--------|-------------|-------|---------------|
| X, A | ✅ | ✅ | Save, Partial Save (some tests) |
| T | ❌ | ✅ | Clear (Ferrography only) |
| P | ✅ | ❌ | Save, Delete (QAG/MicrE) |
| E | ✅ (MicrE) | ❌ | Save (microscopy tests) |

### Review Mode

| Status | Reviewer | Actions Shown |
|--------|----------|---------------|
| T | Q/QAG/MicrE | Accept, Reject |
| P | MicrE | Save, Accept, Reject, Delete |
| E | Q/QAG | Accept, Reject |

**Note**: Can't review own work (`enteredBy === currentUser`)

---

## Testing Checklist

### Entry Mode Tests
- [ ] Save as qualified user (Q/QAG) → Status S
- [ ] Save as trainee (TRAIN) → Status T
- [ ] Partial save → Appropriate status (P for Ferrography, A for others)
- [ ] Microscopy test save → Status E
- [ ] Delete as QAG/MicrE works
- [ ] Action buttons appear/disappear based on status

### Review Mode Tests
- [ ] Accept training entry → Status S or E (microscopy)
- [ ] Reject entry → Data deleted, status reset
- [ ] Cannot review own work
- [ ] Ferrography special logic (Q→P, MicrE→C)
- [ ] Accept/Reject buttons only for reviewers

### Status Transitions
- [ ] X → A → T → S (trainee workflow)
- [ ] X → A → E → S (microscopy workflow)
- [ ] X → A → S (qualified direct workflow)
- [ ] Status badge updates after save
- [ ] Status persists across page reloads

---

## Common Issues & Solutions

### Issue 1: Hardcoded Status 'E'
**Problem**: Old code has `status: 'E'` hardcoded  
**Solution**: Replace with `status: newStatus` from `determineEntryStatus()`

### Issue 2: No Status Updates
**Problem**: Status doesn't update after save  
**Solution**: Call `this.currentStatus.set(newStatus)` after successful save

### Issue 3: Wrong Buttons Showing
**Problem**: Action buttons don't match user qualification  
**Solution**: Ensure `userQualification` input is set correctly

### Issue 4: Can Review Own Work
**Problem**: User can accept/reject their own entries  
**Solution**: Set `enteredBy` from loaded trial data, check in review logic

### Issue 5: No Status Badge
**Problem**: Status badge not visible  
**Solution**: Add `<app-status-badge [status]="currentStatus()" />` to template

---

## Next Steps

1. **Integrate into all 21 forms** following this guide
2. **Add authentication service** to provide real user qualification
3. **Add authorization guards** to routes (separate GAP #1)
4. **Test all status transitions** with different user roles
5. **Update form submission workflow** in parent components

---

_Document Version: 1.0_  
_Last Updated: 2025-10-01_  
_For Questions: See STATUS_WORKFLOW_SYSTEM documentation_

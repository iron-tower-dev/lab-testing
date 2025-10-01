# Manual Integration Steps - Start Here

Since you're ready to integrate, here's the manual process to integrate each form systematically.

---

## ✅ Current Status
- TAN form: ✅ Integrated (use as reference)
- 20 forms to integrate

---

## 🚀 Let's Start with the First Form: vis40-entry-form

### Step 1: Open Files in Your Editor

```bash
# Open the form you're integrating
code src/app/enter-results/entry-form-area/components/entry-form/tests/vis40-entry-form/vis40-entry-form.ts
code src/app/enter-results/entry-form-area/components/entry-form/tests/vis40-entry-form/vis40-entry-form.html

# Keep TAN form open as reference
code src/app/enter-results/entry-form-area/components/entry-form/tests/tan-entry-form/tan-entry-form.ts
code src/app/enter-results/entry-form-area/components/entry-form/tests/tan-entry-form/tan-entry-form.html
```

---

### Step 2: TypeScript Changes (vis40-entry-form.ts)

#### A. Add Imports (at the top, after existing imports)

```typescript
import { StatusWorkflowService } from '../../../../../../shared/services/status-workflow.service';
import { StatusTransitionService } from '../../../../../../shared/services/status-transition.service';
import { TestStatus, ActionContext } from '../../../../../../shared/types/status-workflow.types';
import { ActionButtons } from '../../../../../components/action-buttons/action-buttons';
```

#### B. Update @Component Decorator

Find the `@Component` decorator and add `ActionButtons` to the imports array:

```typescript
@Component({
  standalone: true,
  selector: 'app-vis40-entry-form',
  templateUrl: './vis40-entry-form.html',
  styleUrls: ['./vis40-entry-form.css'],
  imports: [SharedModule, ActionButtons]  // ← Add ActionButtons here
})
```

#### C. Inject Services (after existing inject statements)

```typescript
export class Vis40EntryForm implements OnInit {
  // ... existing injects ...
  
  private statusWorkflow = inject(StatusWorkflowService);
  private statusTransition = inject(StatusTransitionService);
```

#### D. Add Status Signals (after existing signals)

```typescript
  // Status workflow
  currentStatus = signal<TestStatus>(TestStatus.AWAITING);
  enteredBy = signal<string | null>(null);
```

#### E. Add Action Context (after signals)

```typescript
  actionContext = computed<ActionContext>(() => ({
    testId: this.sampleData()?.testReference?.id || 14, // Vis40 test ID
    sampleId: this.sampleData()?.sampleId || 0,
    currentStatus: this.currentStatus(),
    userQualification: this.userQualification(),
    enteredBy: this.enteredBy(),
    currentUser: this.currentUser(),
    mode: this.mode(),
    isPartialSave: false,
    isTraining: this.userQualification() === 'TRAIN'
  }));
```

#### F. Update ngOnInit()

Find the `ngOnInit()` method and add `loadCurrentStatus()` call:

```typescript
  ngOnInit(): void {
    this.initializeForm();
    this.loadCurrentStatus();  // ← Add this line
    this.loadExistingData();
  }
```

#### G. Add loadCurrentStatus() Method

Copy this entire method from TAN form (around line 120-140):

```typescript
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

#### H. Update loadExistingData()

In the existing `loadExistingData()` method, where trial data is loaded, add:

```typescript
  // After loading trial data
  if (trial.entryId) {
    this.enteredBy.set(trial.entryId);
  }
```

#### I. Update Save Method

Find your save method (might be `saveResults()`, `save()`, etc.) and add:

```typescript
  private saveResults(isPartialSave: boolean = false): void {
    // ... existing validation ...
    
    // ADD: Determine new status
    const context = this.actionContext();
    context.isPartialSave = isPartialSave;
    const newStatus = this.statusWorkflow.determineEntryStatus(context);
    
    const trial = {
      // ... existing fields ...
      status: newStatus,  // ← Add this
      entryId: this.form.get('analystInitials')?.value,
      entryDate: Date.now()
    };
    
    this.testReadingsService.bulkSaveTrials([trial]).subscribe({
      next: () => {
        this.currentStatus.set(newStatus);  // ← Add this
        // ... rest of success handling ...
      }
    });
  }
```

#### J. Add onAction() Handler

Copy this entire method from TAN form (around line 202-226):

```typescript
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

#### K. Add Accept/Reject/Delete Methods

Copy these three methods from TAN form (lines 309-411):

```typescript
  private acceptResults(): void {
    // Copy from TAN form
  }
  
  private rejectResults(): void {
    // Copy from TAN form
  }
  
  private deleteResults(): void {
    // Copy from TAN form
  }
  
  private markMediaReady(): void {
    // Copy from TAN form (if applicable)
  }
```

---

### Step 3: HTML Template Changes (vis40-entry-form.html)

#### A. Add Status Badge to Header

Find the form header (or create one at the top) and add:

```html
<div class="form-header">
  <h2>Viscosity @ 40°C Entry Form</h2>
  <app-status-badge [status]="currentStatus()" [showDescription]="false" />
</div>
```

#### B. Add Action Buttons at Bottom

Before the closing `</div>` of your form container, add:

```html
<div class="form-actions">
  <app-action-buttons 
    [context]="actionContext()"
    (actionClicked)="onAction($event)" />
</div>
```

---

### Step 4: CSS (Optional - if needed)

If the form doesn't have header styles, add to vis40-entry-form.css:

```css
.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e0e0e0;
}

.form-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 500;
  color: #333;
}
```

---

### Step 5: Test Compilation

```bash
ng build --configuration=development
```

**If it compiles successfully:** ✅ Move to next form!  
**If there are errors:** Fix them (check for typos, missing imports, etc.)

---

## 📋 Checklist for vis40-entry-form

- [ ] Added 4 imports (StatusWorkflowService, StatusTransitionService, TestStatus/ActionContext, ActionButtons)
- [ ] Added ActionButtons to @Component imports
- [ ] Injected 2 services (statusWorkflow, statusTransition)
- [ ] Added 2 signals (currentStatus, enteredBy)
- [ ] Added actionContext computed signal
- [ ] Updated ngOnInit() with loadCurrentStatus() call
- [ ] Added loadCurrentStatus() method
- [ ] Updated loadExistingData() to set enteredBy
- [ ] Updated save method with status determination
- [ ] Added onAction() handler
- [ ] Added accept/reject/delete/markMediaReady methods
- [ ] Added status badge to HTML header
- [ ] Added action buttons to HTML bottom
- [ ] Build compiles successfully

---

## ✅ After vis40-entry-form is Done

### Repeat for Next Forms:

#### Phase 1 (High Priority):
1. ✅ vis40-entry-form
2. ⏳ vis100-entry-form (NEXT - same test ID: 15)
3. ⏳ flash-pt-entry-form (test ID: 16)
4. ⏳ kf-entry-form (test ID: 17)
5. ⏳ tbn-entry-form (test ID: 11)
6. ⏳ gr-pen60-entry-form
7. ⏳ gr-drop-pt-entry-form

---

## 💡 Tips

1. **Keep TAN form open** - It's your working template
2. **Copy large blocks** - Don't retype methods, copy them
3. **Test after each form** - `ng build --configuration=development`
4. **Take breaks** - Every 2-3 forms
5. **Pattern is identical** - Once you do vis40, others are the same

---

## 🆘 Common Issues

### "Cannot find module 'StatusWorkflowService'"
- Check import path (count the `../` - should be 7 levels up)

### "Property 'currentStatus' does not exist"
- Make sure you added the signal declaration

### "ActionButtons is not a NgModule"
- Ensure ActionButtons is in the imports array of @Component

### Build fails with template errors
- Check you added the components to HTML correctly
- Ensure closing tags match

---

## Quick Start Command

```bash
# Start with vis40-entry-form
code src/app/enter-results/entry-form-area/components/entry-form/tests/vis40-entry-form/vis40-entry-form.ts

# Keep TAN as reference
code src/app/enter-results/entry-form-area/components/entry-form/tests/tan-entry-form/tan-entry-form.ts
```

---

**Ready? Start integrating vis40-entry-form now!** 🚀

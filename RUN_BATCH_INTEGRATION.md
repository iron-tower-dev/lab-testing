# Running the Batch Integration Script - Quick Guide

**Current Status:** Ready to run  
**Date:** 2025-10-01

---

## Pre-Flight Check ✅

- [x] Script exists: `batch-integrate-all-forms.sh`
- [x] Script is executable
- [x] TAN form is integrated (template ready)
- [x] 20 forms need integration

---

## What Will Happen

The script will:

1. **Check each form** to see if it's already integrated (skip if done)
2. **For each form not yet integrated:**
   - Show you form information
   - Ask if you want to proceed
   - Create a backup
   - Generate an integration checklist
   - **PAUSE** and wait for you to manually integrate
   - Verify compilation after your changes

3. **Process forms in 3 phases:**
   - **Phase 1:** 7 high-priority forms
   - **Phase 2:** 7 medium-priority forms  
   - **Phase 3:** 6 low-priority forms

---

## How to Run

### In Fish Shell (your current shell):

```fish
cd /home/derrick/projects/testing/lab-testing
bash ./batch-integrate-all-forms.sh
```

**Note:** Use `bash` explicitly since it's a bash script and you're in fish shell.

---

## What You'll Do During Integration

For each form, the script will pause and you'll need to:

### 1. Open the Form Files

```fish
# The script will tell you which files to edit
# Example for vis40-entry-form:
code src/app/enter-results/entry-form-area/components/entry-form/tests/vis40-entry-form/vis40-entry-form.ts
code src/app/enter-results/entry-form-area/components/entry-form/tests/vis40-entry-form/vis40-entry-form.html
```

### 2. Reference TAN Form

```fish
# Keep TAN form open as reference:
code src/app/enter-results/entry-form-area/components/entry-form/tests/tan-entry-form/tan-entry-form.ts
```

### 3. Copy/Adapt These Elements from TAN:

**In TypeScript (.ts file):**

```typescript
// 1. Add imports (around line 1-12)
import { StatusWorkflowService } from '../../../../../../shared/services/status-workflow.service';
import { StatusTransitionService } from '../../../../../../shared/services/status-transition.service';
import { TestStatus, ActionContext } from '../../../../../../shared/types/status-workflow.types';
import { ActionButtons } from '../../../../../components/action-buttons/action-buttons';

// 2. Add to imports array in @Component decorator
imports: [SharedModule, ActionButtons]

// 3. Inject services (after existing injects)
private statusWorkflow = inject(StatusWorkflowService);
private statusTransition = inject(StatusTransitionService);

// 4. Add signals (after existing signals)
currentStatus = signal<TestStatus>(TestStatus.AWAITING);
enteredBy = signal<string | null>(null);

// 5. Add action context (after signals)
actionContext = computed<ActionContext>(() => ({
  testId: this.sampleData()?.testReference?.id || [APPROPRIATE_TEST_ID],
  sampleId: this.sampleData()?.sampleId || 0,
  currentStatus: this.currentStatus(),
  userQualification: this.userQualification(),
  enteredBy: this.enteredBy(),
  currentUser: this.currentUser(),
  mode: this.mode(),
  isPartialSave: false,
  isTraining: this.userQualification() === 'TRAIN'
}));

// 6. Update ngOnInit to add:
this.loadCurrentStatus();  // Add this line

// 7. Add loadCurrentStatus() method (copy from TAN)

// 8. Update loadExistingData() to add:
this.enteredBy.set(trial.entryId);  // Where trial data is loaded

// 9. Update save method to add:
const context = this.actionContext();
context.isPartialSave = isPartialSave;
const newStatus = this.statusWorkflow.determineEntryStatus(context);
// ... in trial object:
status: newStatus,
// ... after save success:
this.currentStatus.set(newStatus);

// 10. Add onAction() method (copy from TAN)
// 11. Add accept/reject/delete methods (copy from TAN)
```

**In HTML Template:**

```html
<!-- Add to form header (near the top) -->
<div class="form-header">
  <h2>[Form Name] Entry Form</h2>
  <app-status-badge [status]="currentStatus()" [showDescription]="false" />
</div>

<!-- Add before closing </div> of form container -->
<div class="form-actions">
  <app-action-buttons 
    [context]="actionContext()"
    (actionClicked)="onAction($event)" />
</div>
```

### 4. Press Enter When Done

After making changes, press Enter in the terminal and the script will verify compilation.

---

## Integration Checklist (Use This)

For each form:

- [ ] Added imports (StatusWorkflowService, StatusTransitionService, ActionButtons)
- [ ] Injected services
- [ ] Added currentStatus and enteredBy signals
- [ ] Added actionContext computed signal
- [ ] Added loadCurrentStatus() method
- [ ] Updated ngOnInit() to call loadCurrentStatus()
- [ ] Updated loadExistingData() to set enteredBy
- [ ] Updated save logic with status determination
- [ ] Added onAction() handler
- [ ] Added accept/reject/delete methods
- [ ] Updated HTML with status badge in header
- [ ] Updated HTML with action buttons
- [ ] Added ActionButtons to component imports
- [ ] Verified compilation succeeds

---

## Time Estimates

- **Per form:** 25-35 minutes
- **Phase 1 (7 forms):** 3-5 hours
- **Phase 2 (7 forms):** 3-5 hours
- **Phase 3 (6 forms):** 2.5-4 hours

**Tips:**
- Take breaks between phases
- Don't rush - accuracy is important
- Test compilation after each form
- Keep TAN form open as reference

---

## If Something Goes Wrong

### Build Fails

```fish
# Fix the TypeScript errors shown
# Common issues:
# - Missing imports
# - Typos in method names
# - Incorrect paths
```

### Need to Start Over on a Form

```fish
# Backups are in: backups/forms_[timestamp]/[form-name]/
# Just restore from backup and try again
```

### Script Gets Stuck

Press Ctrl+C to stop, then:

```fish
# Resume where you left off - script tracks progress
bash ./batch-integrate-all-forms.sh
```

---

## After Each Phase

The script will ask if you want to continue to the next phase. You can:
- Continue immediately (press 'y')
- Stop and take a break (press 'n')
- Resume later by running the script again

---

## Testing After Integration

After each form is integrated:

```fish
# Quick test - just verify it compiles
ng build --configuration=development

# Full test - test in browser
ng serve
# Navigate to the form and check:
# - Form loads
# - Status badge appears
# - Save works
# - Action buttons show
```

---

## Ready to Start?

```fish
# Navigate to project root
cd /home/derrick/projects/testing/lab-testing

# Run the script
bash ./batch-integrate-all-forms.sh
```

The script will guide you through everything!

---

## Quick Reference: Test IDs

When setting up actionContext, use these test IDs:

- TAN: 10
- Vis40: 14  
- Vis100: 15
- Flash Point: 16
- KF Water: 17
- TBN: 11
- Grease Penetration: (check database)
- Grease Dropping Point: (check database)
- Ferrography: 12
- RBOT: (check database)
- Spectroscopy: 13
- (Others: check your test-types table)

---

**Good luck! You've got this! 🚀**

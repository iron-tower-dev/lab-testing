# Integration Checklist: vis40-entry-form

**Date:** 2025-09-30
**Status:** In Progress

## Pre-Integration
- [ ] Form backed up
- [ ] Form uses signals (modernized)
- [ ] TAN pattern reviewed

## Code Changes
- [ ] Imports added (StatusWorkflowService, StatusTransitionService, etc.)
- [ ] Services injected
- [ ] Status signals added (currentStatus, enteredBy)
- [ ] Action context computed signal added
- [ ] loadCurrentStatus() method added
- [ ] loadExistingData() updated to capture enteredBy
- [ ] Save logic updated with status determination
- [ ] onAction() handler added
- [ ] Accept/reject/delete methods added

## Template Changes
- [ ] Status badge added to header
- [ ] Action buttons component added
- [ ] ActionButtons imported in component

## Style Changes
- [ ] Form header styles added/updated

## Testing
- [ ] TypeScript compiles without errors
- [ ] Form loads in browser
- [ ] Status badge displays
- [ ] Save functionality works
- [ ] Action buttons appear
- [ ] Status transitions correctly

## Post-Integration
- [ ] Quick smoke test passed
- [ ] No console errors
- [ ] Ready for full testing

## Notes

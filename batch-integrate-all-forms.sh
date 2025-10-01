#!/bin/bash

# Comprehensive Batch Integration Script for All Modernized Forms
# Integrates status workflow into all 20 remaining test entry forms

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "================================================================"
echo "  Batch Status Workflow Integration for All Modernized Forms"
echo "================================================================"
echo ""

# Check if we're in the right directory
if [ ! -f "angular.json" ]; then
    echo -e "${RED}Error: Must be run from lab-testing project root${NC}"
    exit 1
fi

# Base path for forms
FORMS_DIR="src/app/enter-results/entry-form-area/components/entry-form/tests"

# Define all forms to integrate (prioritized)
declare -a HIGH_PRIORITY=(
    "vis40-entry-form"
    "vis100-entry-form"
    "flash-pt-entry-form"
    "kf-entry-form"
    "tbn-entry-form"
    "gr-pen60-entry-form"
    "gr-drop-pt-entry-form"
)

declare -a MEDIUM_PRIORITY=(
    "ferrography-entry-form"
    "rbot-entry-form"
    "inspect-filter-entry-form"
    "tfout-entry-form"
    "deleterious-entry-form"
    "rust-entry-form"
    "spectroscopy-entry-form"
)

declare -a LOW_PRIORITY=(
    "oil-content-entry-form"
    "rheometry-entry-form"
    "debris-id-entry-form"
    "d-inch-entry-form"
    "pcnt-entry-form"
    "vpr-entry-form"
)

# Function to check if form exists
check_form_exists() {
    local form_dir="$1"
    if [ ! -d "$FORMS_DIR/$form_dir" ]; then
        echo -e "${RED}❌ Form directory not found: $form_dir${NC}"
        return 1
    fi
    
    if [ ! -f "$FORMS_DIR/$form_dir/${form_dir}.ts" ]; then
        echo -e "${RED}❌ Form component not found: $form_dir.ts${NC}"
        return 1
    fi
    
    return 0
}

# Function to check if already integrated
is_already_integrated() {
    local form_file="$1"
    if grep -q "StatusWorkflowService" "$form_file" && \
       grep -q "StatusTransitionService" "$form_file" && \
       grep -q "currentStatus.*signal" "$form_file"; then
        return 0
    fi
    return 1
}

# Function to backup form
backup_form() {
    local form_dir="$1"
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_dir="backups/forms_${timestamp}"
    
    mkdir -p "$backup_dir"
    cp -r "$FORMS_DIR/$form_dir" "$backup_dir/"
    echo -e "${GREEN}✓ Backed up to: $backup_dir/$form_dir${NC}"
}

# Function to display form info
display_form_info() {
    local form_dir="$1"
    local form_file="$FORMS_DIR/$form_dir/${form_dir}.ts"
    
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Form: $form_dir${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    # Check if modernized (using signals)
    if grep -q "signal\|computed" "$form_file"; then
        echo -e "Modernization: ${GREEN}✓ Uses signals${NC}"
    else
        echo -e "Modernization: ${YELLOW}⚠ Legacy (needs modernization first)${NC}"
    fi
    
    # Check if already integrated
    if is_already_integrated "$form_file"; then
        echo -e "Status Workflow: ${GREEN}✓ Already integrated${NC}"
        echo -e "${YELLOW}Skipping (already done)${NC}"
        return 1
    else
        echo -e "Status Workflow: ${RED}❌ Pending${NC}"
    fi
    
    # Show file stats
    local lines=$(wc -l < "$form_file")
    echo "File size: $lines lines"
    
    return 0
}

# Function to create integration checklist
create_integration_checklist() {
    local form_dir="$1"
    local checklist_file="INTEGRATION_CHECKLIST_${form_dir}.md"
    
    cat > "$checklist_file" << EOF
# Integration Checklist: $form_dir

**Date:** $(date +%Y-%m-%d)
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
EOF

    echo -e "${GREEN}✓ Created checklist: $checklist_file${NC}"
}

# Function to integrate a form
integrate_form() {
    local form_dir="$1"
    local form_file="$FORMS_DIR/$form_dir/${form_dir}.ts"
    
    echo ""
    echo -e "${YELLOW}➜ Starting integration for: $form_dir${NC}"
    
    # Display form info and check if should proceed
    if ! display_form_info "$form_dir"; then
        return 0
    fi
    
    # Confirm before proceeding
    echo ""
    read -p "Proceed with integration? [y/N] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Skipped by user${NC}"
        return 0
    fi
    
    # Backup
    backup_form "$form_dir"
    
    # Create checklist
    create_integration_checklist "$form_dir"
    
    echo ""
    echo -e "${BLUE}Manual integration steps:${NC}"
    echo "1. Open: $form_file"
    echo "2. Reference: src/app/enter-results/entry-form-area/components/entry-form/tests/tan-entry-form/tan-entry-form.ts"
    echo "3. Follow: INTEGRATION_CHECKLIST_${form_dir}.md"
    echo "4. Use TAN form as template for:"
    echo "   - Import statements"
    echo "   - Service injection"
    echo "   - Status signals"
    echo "   - Action context"
    echo "   - loadCurrentStatus() method"
    echo "   - onAction() method and handlers"
    echo "   - Save logic modifications"
    echo ""
    echo "5. Update template: $FORMS_DIR/$form_dir/${form_dir}.html"
    echo "   - Add status badge to header"
    echo "   - Add action buttons at bottom"
    echo ""
    echo "6. Test compilation: ng build --configuration=development"
    echo ""
    
    read -p "Press Enter when integration is complete..."
    
    # Verify compilation
    echo -e "${BLUE}Verifying compilation...${NC}"
    if ng build --configuration=development 2>&1 | grep -q "error"; then
        echo -e "${RED}❌ Build failed - please fix errors${NC}"
        return 1
    else
        echo -e "${GREEN}✓ Build successful${NC}"
    fi
    
    # Check if integration looks complete
    if is_already_integrated "$form_file"; then
        echo -e "${GREEN}✓ Integration appears complete${NC}"
        echo -e "${GREEN}✓ Form: $form_dir - DONE${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠ Integration incomplete - StatusWorkflow imports not found${NC}"
        return 1
    fi
}

# Main execution
main() {
    echo -e "${BLUE}Phase 1: High Priority Forms${NC}"
    echo "These are the most commonly used tests"
    echo ""
    
    for form in "${HIGH_PRIORITY[@]}"; do
        integrate_form "$form"
    done
    
    echo ""
    echo -e "${BLUE}Phase 1 Complete!${NC}"
    read -p "Continue to Phase 2 (Medium Priority)? [y/N] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Stopping after Phase 1${NC}"
        exit 0
    fi
    
    echo ""
    echo -e "${BLUE}Phase 2: Medium Priority Forms${NC}"
    echo ""
    
    for form in "${MEDIUM_PRIORITY[@]}"; do
        integrate_form "$form"
    done
    
    echo ""
    echo -e "${BLUE}Phase 2 Complete!${NC}"
    read -p "Continue to Phase 3 (Low Priority)? [y/N] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Stopping after Phase 2${NC}"
        exit 0
    fi
    
    echo ""
    echo -e "${BLUE}Phase 3: Low Priority Forms${NC}"
    echo ""
    
    for form in "${LOW_PRIORITY[@]}"; do
        integrate_form "$form"
    done
    
    echo ""
    echo "================================================================"
    echo -e "${GREEN}✓ All forms integration complete!${NC}"
    echo "================================================================"
    echo ""
    echo "Summary:"
    echo "- High priority: ${#HIGH_PRIORITY[@]} forms"
    echo "- Medium priority: ${#MEDIUM_PRIORITY[@]} forms"
    echo "- Low priority: ${#LOW_PRIORITY[@]} forms"
    echo ""
    echo "Next steps:"
    echo "1. Review integration checklists"
    echo "2. Run comprehensive tests"
    echo "3. Perform smoke tests on each form"
    echo "4. Document any issues found"
    echo ""
}

# Run main function
main

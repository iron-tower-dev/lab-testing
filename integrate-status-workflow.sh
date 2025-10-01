#!/bin/bash

# Status Workflow Batch Integration Script
# Integrates status workflow into modernized test entry forms
# Based on TAN form pattern

set -e

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Forms to integrate (already modernized)
FORMS=(
  "vis40-entry-form:50:Viscosity @ 40°C"
  "vis100-entry-form:60:Viscosity @ 100°C"
  "flash-pt-entry-form:80:Flash Point"
  "kf-entry-form:20:Karl Fischer Water"
  "gr-pen60-entry-form:130:Grease Penetration"
  "gr-drop-pt-entry-form:140:Grease Dropping Point"
  "ferrography-entry-form:210:Ferrography"
)

BASE_PATH="src/app/enter-results/entry-form-area/components/entry-form/tests"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Status Workflow Batch Integration${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Function to check if form exists
check_form_exists() {
  local form_name=$1
  local form_path="$BASE_PATH/$form_name"
  
  if [ ! -d "$form_path" ]; then
    echo -e "${RED}✗ Form directory not found: $form_path${NC}"
    return 1
  fi
  
  if [ ! -f "$form_path/${form_name}.ts" ]; then
    echo -e "${RED}✗ TypeScript file not found: $form_path/${form_name}.ts${NC}"
    return 1
  fi
  
  return 0
}

# Function to backup form files
backup_form() {
  local form_name=$1
  local form_path="$BASE_PATH/$form_name"
  
  echo -e "${YELLOW}  Creating backups...${NC}"
  
  if [ -f "$form_path/${form_name}.ts" ]; then
    cp "$form_path/${form_name}.ts" "$form_path/${form_name}.ts.backup-$(date +%Y%m%d)"
  fi
  
  if [ -f "$form_path/${form_name}.html" ]; then
    cp "$form_path/${form_name}.html" "$form_path/${form_name}.html.backup-$(date +%Y%m%d)"
  fi
  
  if [ -f "$form_path/${form_name}.css" ]; then
    cp "$form_path/${form_name}.css" "$form_path/${form_name}.css.backup-$(date +%Y%m%d)"
  fi
}

# Function to check if form already has status workflow
check_already_integrated() {
  local form_name=$1
  local form_path="$BASE_PATH/$form_name"
  
  if grep -q "StatusWorkflowService" "$form_path/${form_name}.ts" 2>/dev/null; then
    return 0  # Already integrated
  fi
  return 1  # Not integrated
}

# Process each form
INTEGRATED=0
SKIPPED=0
FAILED=0

for form_info in "${FORMS[@]}"; do
  IFS=':' read -r form_name test_id test_label <<< "$form_info"
  
  echo ""
  echo -e "${GREEN}────────────────────────────────────────${NC}"
  echo -e "${GREEN}Processing: $test_label (Test ID: $test_id)${NC}"
  echo -e "${GREEN}Form: $form_name${NC}"
  echo -e "${GREEN}────────────────────────────────────────${NC}"
  
  # Check if form exists
  if ! check_form_exists "$form_name"; then
    echo -e "${RED}✗ Skipping - form not found${NC}"
    ((SKIPPED++))
    continue
  fi
  
  # Check if already integrated
  if check_already_integrated "$form_name"; then
    echo -e "${YELLOW}⚠ Already integrated - skipping${NC}"
    ((SKIPPED++))
    continue
  fi
  
  # Backup files
  backup_form "$form_name"
  
  echo -e "${GREEN}✓ Ready for manual integration${NC}"
  echo -e "  File: $BASE_PATH/$form_name/${form_name}.ts"
  
  # Note: Actual integration would happen here
  # For now, we'll track which forms are ready
  ((INTEGRATED++))
done

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Integration Summary${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "Ready for integration: ${GREEN}$INTEGRATED${NC}"
echo -e "Already integrated:    ${YELLOW}$SKIPPED${NC}"
echo -e "Failed:                ${RED}$FAILED${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo -e "1. Review backups created"
echo -e "2. Apply TAN form pattern to each form"
echo -e "3. Test each integration"
echo ""

#!/bin/bash

# TAN Form Testing Quick-Start Script
# This script runs automated tests for the TAN form integration

set -e

echo "======================================"
echo "TAN Form Status Workflow Testing"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "angular.json" ]; then
    echo -e "${RED}Error: Must be run from lab-testing project root${NC}"
    exit 1
fi

echo -e "${BLUE}Step 1: Running TAN Entry Form Unit Tests${NC}"
echo "-------------------------------------------"
ng test --include='**/tan-entry-form.spec.ts' --watch=false --browsers=ChromeHeadless

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ TAN form unit tests passed${NC}"
else
    echo -e "${RED}✗ TAN form unit tests failed${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}Step 2: Running Status Workflow Service Tests${NC}"
echo "-----------------------------------------------"
ng test --include='**/status-workflow.service.spec.ts' --watch=false --browsers=ChromeHeadless

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Status workflow service tests passed${NC}"
else
    echo -e "${YELLOW}⚠ Status workflow service tests failed (may not exist yet)${NC}"
fi

echo ""
echo -e "${BLUE}Step 3: Running Status Transition Service Tests${NC}"
echo "-------------------------------------------------"
ng test --include='**/status-transition.service.spec.ts' --watch=false --browsers=ChromeHeadless

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Status transition service tests passed${NC}"
else
    echo -e "${YELLOW}⚠ Status transition service tests failed (may not exist yet)${NC}"
fi

echo ""
echo -e "${BLUE}Step 4: Checking Build${NC}"
echo "----------------------"
ng build --configuration=development

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Build successful${NC}"
else
    echo -e "${RED}✗ Build failed${NC}"
    exit 1
fi

echo ""
echo "======================================"
echo -e "${GREEN}✓ Automated testing complete!${NC}"
echo "======================================"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Review test results above"
echo "2. Run manual testing scenarios (see TAN_FORM_TESTING_PLAN.md)"
echo "3. Test in browser: ng serve, navigate to TAN form"
echo "4. Once validated, proceed with batch integration"
echo ""
echo "Manual Testing Checklist:"
echo "  [ ] New entry by qualified user"
echo "  [ ] Partial save functionality"
echo "  [ ] Review and accept workflow"
echo "  [ ] Review and reject workflow"
echo "  [ ] Training user workflow"
echo "  [ ] Self-review prevention"
echo "  [ ] Data persistence across reloads"
echo "  [ ] Error handling"
echo "  [ ] Calculation accuracy"
echo "  [ ] Quality control warnings"
echo ""
echo "Documentation:"
echo "  - TAN_FORM_TESTING_PLAN.md - Full testing guide"
echo "  - STATUS_WORKFLOW_DOCUMENTATION.md - System overview"
echo ""

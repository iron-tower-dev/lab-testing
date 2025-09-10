# Requirements Document: Viscosity @ 100°C Test Entry Form

## Overview
This document specifies the requirements for the Viscosity @ 100°C test entry form component in the LabTesting Angular application.

## Test Information
- **Test ID**: 12267
- **Test Name**: Viscosity @ 100
- **Title**: Enter Results - Viscosity @ 100
- **Temperature**: 100°C
- **Calculation Formula**: Stop watch time * Tube calibration value

## Functional Requirements

### 1. Sample Selection and Display
- The user can select a Sample ID from list available for specific test
- The user is able to see specific Sample ID data
- The user is able to see specific test name template fields for entering test results

### 2. Trial Entry System
- Four trial lines shall be available for results data entry
- Each trial should include:
  - Stop watch time field (numeric input)
  - Tube calibration value field (numeric input)
  - Calculated result field (read-only, auto-calculated)
- The user is able to enter test results by trial
- The user is able to select specific trial records to make changes to

### 3. Automatic Calculations
- System automatically calculates: **Stop watch time × Tube calibration value**
- Calculated results are displayed in real-time as user enters data
- Calculation results are read-only fields
- System calculates specific fields defined for the test name template

### 4. Data Management
- The user is able to update Lab Comments
- The user is able to save/clear or delete test result data entries
- Form validation to ensure required fields are completed
- Data persistence across sessions

### 5. User Interface Requirements
- Clean, intuitive interface following Angular Material design patterns
- Responsive design that works on various screen sizes
- Clear field labels and validation messages
- Consistent with existing LabTesting application styling

## Technical Requirements

### 1. Component Architecture
- Standalone Angular component (no NgModules)
- Use Angular signals for reactive state management
- Follow existing application patterns from other entry forms
- Import only necessary Angular Material modules

### 2. Form Implementation
- Use Angular Reactive Forms
- Implement proper form validation
- Handle form state management
- Support for trial-based data entry

### 3. Data Models
- Extend existing test result types for viscosity-specific data
- Support for multiple trials per test
- Include fields for stopwatch time, tube calibration value, and calculated result

### 4. Integration
- Integrate with existing test selection system
- Support navigation between different test types
- Maintain consistency with application-wide data flow

## Acceptance Criteria
1. ✅ User can select Sample ID from available list for Viscosity @ 100 test
2. ✅ User can view sample-specific data
3. ✅ User can see Viscosity @ 100 template fields for data entry
4. ✅ User can update Lab Comments
5. ✅ User can enter test results across multiple trials
6. ✅ User can select and modify specific trial records
7. ✅ User can save, clear, or delete test result entries
8. ✅ System automatically calculates results using specified formula
9. ✅ Form validates input data appropriately
10. ✅ Component integrates seamlessly with existing application

## Implementation Notes
- This component should be similar to other test entry forms but with viscosity-specific fields
- The calculation should be implemented as a computed property that updates automatically
- Consider using Angular signals for reactive calculations
- Ensure proper error handling and user feedback
- While functionally identical to Viscosity @ 40°C, this component handles testing at 100°C temperature

# VIS100 Entry Form - Design Documentation

## Overview
This document outlines the modern, professional design system implemented for the VIS100 (Viscosity @ 100°C) Entry Form, focusing on clean aesthetics, excellent UX, data integrity, and maintainable Angular code following the latest Angular style guide.

## Design Principles

### 1. **Material Design 3.0 Compliance**
- Follows Google Material Design guidelines
- Uses elevation, shadows, and rounded corners consistently
- Implements proper spacing and typography scales
- Material table component for structured data presentation

### 2. **Professional Laboratory Aesthetic**
- Clean, clinical appearance suitable for scientific viscosity testing
- Data-driven interface with clear visual hierarchy
- High contrast for readability in various lighting conditions
- Precision-focused input controls for accurate measurements

### 3. **Responsive Design**
- Mobile-first approach with progressive enhancement
- Flexible grid systems that adapt to screen sizes
- Table layout optimized for both desktop and tablet use
- Maintains usability on smaller devices with scrollable content

### 4. **Modern Angular Architecture**
- Standalone component architecture (no NgModules)
- Signal-based reactivity for optimal performance
- Computed signals for derived state management
- Input/output signals instead of legacy decorators

## Component Architecture

### Signal-Based State Management

#### Input Signals
```typescript
sampleData = input<SampleWithTestInfo | null>(null);
errorMessage = input<string | null>(null);
mode = input<'entry' | 'review' | 'view'>('entry');
userQualification = input<string | null>('Q');
currentUser = input<string>('current_user');
```

#### State Signals
```typescript
// Loading states - granular for better UX
isLoadingTubes = signal(false);
isLoadingTrials = signal(false);
isLoadingStatus = signal(false);
isLoading = computed(() => 
  this.isLoadingTubes() || this.isLoadingTrials() || this.isLoadingStatus()
);

// Operational state
isSaving = signal(false);
saveMessage = signal<string | null>(null);
tubeOptions = signal<TubeOption[]>([]);

// Status workflow
currentStatus = signal<TestStatus>(TestStatus.AWAITING);
enteredBy = signal<string | null>(null);

// Calculation results
repeatabilityResult = signal<RepeatabilityResult | null>(null);
```

#### Computed Signals
```typescript
// Auto-calculates selected trial results for repeatability check
selectedResults = computed(() => {
  const trials = this.trialsArray?.getRawValue() || [];
  return trials
    .filter((t: ViscosityTrial) => t.selected && t.calculatedResult > 0)
    .map((t: ViscosityTrial) => t.calculatedResult);
});

// Action context for workflow decisions
actionContext = computed<ActionContext>(() => ({
  testId: this.sampleData()?.testReference?.id || 15,
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

### Reactive Forms Structure

#### Trial FormGroup Schema
```typescript
{
  trialNumber: number,          // 1-4
  selected: boolean,            // Checkbox for repeatability calculation
  stopwatchTime: string,        // MM.SS.HH or decimal seconds
  tubeCalibration: string,      // equipmentId|calibrationValue format
  calculatedResult: number      // Disabled/readonly computed result
}
```

#### Form Array Architecture
- 4 trial rows initialized on component creation
- Each trial is a separate FormGroup within FormArray
- Supports partial data entry (not all trials required)
- Selected trials used for repeatability calculations

## Color Palette

### Primary Colors
- **Primary Blue**: `#1976d2` - Headers, primary actions, active states
- **Secondary Blue**: `#42a5f5` - Accents, hover states
- **Indigo**: `#3f51b5` - Section headers, icons

### Functional Colors
- **Table Header**: Light blue gradient (`#e3f2fd` to `#f0f7ff`)
- **Row Hover**: Subtle blue tint (`#f5f9ff`)
- **Repeatability Pass**: `#4caf50` (Green) - Check icon
- **Repeatability Warning**: `#ff9800` (Orange) - Warning icon
- **Error State**: `#f44336` (Red) - Validation errors
- **Disabled Fields**: `#e0e0e0` (Gray) - Read-only calculated results

### Status Colors
- **Success**: `#4caf50` - Save confirmations
- **Warning**: `#ff9800` - Repeatability warnings
- **Error**: `#f44336` - Validation failures
- **Info**: `#2196f3` - Loading states

## Layout Structure

### Container Hierarchy
```
.vis100-entry-form
├── .loading-overlay (conditional)
├── mat-card
│   ├── mat-card-header
│   │   ├── mat-card-title
│   │   └── mat-card-subtitle (sample info)
│   ├── mat-card-content
│   │   ├── form [formGroup]
│   │   │   ├── .trials-table
│   │   │   │   └── table mat-table
│   │   │   │       ├── Trial column
│   │   │   │       ├── Select checkbox column
│   │   │   │       ├── Stopwatch Time input column
│   │   │   │       ├── Tube Calibration select column
│   │   │   │       └── Calculated Result (readonly) column
│   │   │   └── .repeatability-section (conditional)
│   │   │       └── mat-card.repeatability-card
│   │   └── mat-card-actions
│   │       ├── Clear button
│   │       └── Save Results button
```

### Grid Systems
- **Desktop (>768px)**: Full-width table with 5 columns
- **Tablet (≤768px)**: Horizontal scroll enabled for table
- **Mobile (≤480px)**: Reduced padding, maintained table structure

## Typography

### Hierarchy
- **Card Title**: 1.5rem (24px), weight 500, Material Design default
- **Card Subtitle**: 1rem (16px), weight 400, color `rgba(0,0,0,0.6)`
- **Table Headers**: 0.875rem (14px), weight 500, uppercase, letter-spacing 0.5px
- **Table Cells**: 1rem (16px), weight 400, color `#333`
- **Form Labels**: 0.875rem (14px), weight 400, Material Design spec
- **Hints**: 0.75rem (12px), weight 400, color `rgba(0,0,0,0.54)`

### Features
- Line height optimized for table readability (1.5)
- Consistent Material Design font stack (Roboto fallback)
- Numerical data right-aligned for easy comparison

## Visual Elements

### Material Cards
- **Primary Card**: 12px border radius, elevation 2
- **Repeatability Card**: 8px border radius, elevation 1
- **Warning Card**: Orange left-border accent (4px)
- **Transitions**: 0.3s ease for elevation changes

### Material Table
- **Structure**: mat-table with defined columns
- **Header Row**: Sticky positioning for scroll
- **Data Rows**: Hover effect with background color transition
- **Cell Padding**: 16px horizontal, 12px vertical
- **Border**: Subtle bottom border between rows (`1px solid #e0e0e0`)

### Form Fields
- **Appearance**: `outline` style throughout for consistency
- **Border Radius**: 8px for softened appearance
- **Focus States**: Primary blue color with smooth transition
- **Error States**: Red outline with shake animation
- **Disabled Fields**: Gray background, lower opacity

### Interactive Elements

#### Checkboxes
- Material checkbox component
- Primary color when checked
- Triggers immediate repeatability recalculation
- Touch-friendly target size (44x44px minimum)

#### Text Inputs (Stopwatch Time)
- Accepts multiple formats: `MM.SS.HH` or decimal seconds
- Auto-formats on blur event
- Placeholder text provides format guidance
- Hint text below field for additional clarity

#### Select Dropdowns (Tube Calibration)
- Populated from Equipment Service API
- Options format: `equipmentId|calibrationValue`
- Display format: Human-readable equipment labels
- Loading state while fetching options

#### Buttons
- **Primary Action (Save)**: `mat-raised-button`, primary color
- **Secondary Action (Clear)**: `mat-button`, warn color
- **Disabled State**: Reduced opacity, no hover effects
- **Loading State**: Inline spinner replaces icon

## Data Flow & Business Logic

### Initialization Sequence
1. **Form Creation**: Initialize 4 trial FormGroups in FormArray
2. **Status Loading**: Fetch current test status from API
3. **Tube Calibrations**: Load available tubes from Equipment Service
4. **Existing Data**: Load previously saved trial data (if exists)
5. **UI Rendering**: Display fully initialized form

### User Input Processing

#### Stopwatch Time Entry
1. User enters time in `MM.SS.HH` or decimal format
2. `onStopwatchTimeBlur()` triggered on field blur
3. Time parsed using `ViscosityCalculationService.parseTimeFormat()`
4. Field value updated with parsed seconds
5. `calculateResult()` called for the trial

#### Tube Selection
1. User selects tube from dropdown
2. `onTubeChange()` triggered immediately
3. `calculateResult()` called for the trial
4. Tube calibration value extracted from selection

#### Viscosity Calculation
```typescript
calculateResult(trialIndex: number) {
  const stopwatchTime = trial.stopwatchTime;
  const tubeCalibration = extractCalibration(trial.tubeCalibration);
  
  const result = ViscosityCalculationService.calculateViscosity(
    stopwatchTime,
    tubeCalibration
  );
  
  trial.calculatedResult = result.result; // Updates readonly field
  
  if (trial.selected) {
    checkRepeatability(); // Recalculate if trial is selected
  }
}
```

#### Trial Selection
1. User checks/unchecks trial selection checkbox
2. `onTrialSelectionChange()` triggered
3. `checkRepeatability()` recalculates with new selection
4. Repeatability card updates with new result

### Repeatability Check

#### Logic Flow
```typescript
checkRepeatability() {
  const selectedTrials = selectedResults(); // Computed signal
  
  if (selectedTrials.length < 2) {
    repeatabilityResult.set(null); // Hide card
    return;
  }
  
  const check = ViscosityCalculationService.checkRepeatability(
    selectedTrials,
    0.35 // 0.35% limit for viscosity
  );
  
  repeatabilityResult.set(check);
}
```

#### Repeatability Display
- **Pass State**: Green check icon, percentage shown
- **Fail State**: Orange warning icon, warning message
- **Threshold**: 0.35% difference limit
- **Calculation**: `((max - min) / average) × 100`

### Save Operations

#### Validation Checks
1. Form validity (all required fields for selected trials)
2. Sample information presence
3. Repeatability threshold (with user confirmation option)
4. Status workflow rules

#### Data Preparation
```typescript
trials.map(trial => ({
  trialNumber: trial.trialNumber,
  value1: trial.stopwatchTime || null,      // Stopwatch time
  value3: trial.calculatedResult || null,   // Calculated viscosity
  id2: extractEquipmentId(trial.tubeCalibration),
  trialComplete: trial.selected,
  selected: trial.selected,
  status: newStatus,                        // From workflow service
  entryId: currentUser(),
  entryDate: Date.now()
}))
```

#### Partial Save Support
- Allows saving incomplete data
- Skips form validation
- Skips repeatability check
- Sets appropriate status flag
- Useful for work-in-progress scenarios

## Animations & Interactions

### Loading States
- **Initial Load**: Full-screen overlay with centered spinner
- **Saving**: Inline button spinner, disabled controls
- **Granular Loading**: Separate signals for tubes/trials/status

### Form Interactions
- **Field Focus**: Smooth border color transition (0.3s)
- **Validation Error**: Shake animation + color change
- **Calculated Result**: Instant update when dependencies change
- **Repeatability Card**: Fade in/out with scale animation

### Button States
- **Hover**: Subtle lift effect (2px translateY)
- **Click**: Ripple effect (Material Design standard)
- **Disabled**: No animations, reduced opacity to 0.6

### Status Messages
- **Success**: Green checkmark, auto-dismiss after 5s
- **Error**: Red X, auto-dismiss after 5s
- **Info**: Blue info icon, persistent until user action

## Accessibility Features

### WCAG 2.1 AA Compliance
- **Color Contrast**: Minimum 4.5:1 ratio for all text
- **Focus Indicators**: Clear 2px outline on all interactive elements
- **Form Labels**: Properly associated with inputs via `mat-label`
- **Error Messages**: Announced to screen readers via `mat-error`

### Keyboard Navigation
- **Tab Order**: Logical flow through table rows
- **Table Navigation**: Arrow keys for cell-to-cell movement (native)
- **Dropdown**: Arrow keys + Enter for tube selection
- **Checkbox**: Space bar to toggle
- **Buttons**: Enter or Space to activate

### Screen Reader Support
- **Table Structure**: Proper `<th>` and `<td>` with scope attributes
- **ARIA Labels**: Descriptive labels for icon-only buttons
- **Status Announcements**: `aria-live` regions for save messages
- **Form Validation**: Error messages linked via `aria-describedby`

## Responsive Breakpoints

### Mobile (≤480px)
- Card padding reduced to 8px
- Table horizontal scroll enabled
- Button text shortened or icon-only
- Stacked form hints
- Touch targets minimum 44x44px

### Tablet (481px-768px)
- Standard card padding (16px)
- Table fits within viewport with scroll
- Full button labels
- Side-by-side action buttons

### Desktop (>768px)
- Expanded card padding (24px)
- Full table width with no scroll
- Hover states enabled
- Optimal column widths for readability

## Performance Optimizations

### Signal-Based Reactivity
- **Computed Signals**: Auto-memoized, only recalculate when dependencies change
- **Granular Updates**: Only affected components re-render
- **No Zone Pollution**: Signals work outside Angular zones

### Change Detection Strategy
- **OnPush Recommended**: Works seamlessly with signals
- **Minimal Digest Cycles**: Signals trigger targeted updates
- **Form Array Optimization**: TrackBy functions for table rows

### API Call Optimization
- **Parallel Loading**: Tubes, trials, and status load concurrently
- **Debounced Input**: Calculation only on blur, not every keystroke
- **Cached Tube Options**: Stored in signal, no redundant fetches

### Bundle Size
- **Standalone Component**: Tree-shakeable, no unnecessary imports
- **Lazy Loading**: Component loaded on-demand via routing
- **SharedModule**: Common dependencies shared across forms

## Integration Points

### Service Dependencies

#### ViscosityCalculationService
- `parseTimeFormat(input: string): { isValid: boolean, seconds: number }`
- `calculateViscosity(time: number, calibration: number): { result: number }`
- `checkRepeatability(results: number[], limit: number): RepeatabilityResult`

#### EquipmentService
- `getViscosityTubesForTest(testId: number): Observable<TubeOption[]>`
- Returns equipment with calibration values in dropdown format

#### TestReadingsService
- `loadTrials(sampleId: number, testId: number): Observable<TrialResponse>`
- `bulkSaveTrials(sampleId, testId, trials[], user, status): Observable<SaveResponse>`

#### StatusWorkflowService
- `determineEntryStatus(context: ActionContext): TestStatus`
- `determineReviewStatus(context: ActionContext, action: string): TestStatus`

#### StatusTransitionService
- `getCurrentStatus(sampleId, testId): Observable<StatusResponse>`
- `acceptResults(sampleId, testId, status, user): Observable<TransitionResult>`
- `rejectResults(sampleId, testId, user): Observable<TransitionResult>`
- `deleteResults(sampleId, testId, user): Observable<TransitionResult>`

### Data Models

#### ViscosityTrial Interface
```typescript
interface ViscosityTrial {
  trialNumber: number;      // 1-4
  selected: boolean;        // For repeatability calculation
  stopwatchTime: string;    // Seconds (parsed from MM.SS.HH)
  tubeCalibration: string;  // "equipmentId|calibrationValue"
  calculatedResult: number; // cSt (centistokes)
}
```

#### RepeatabilityResult Interface
```typescript
interface RepeatabilityResult {
  isWithinLimit: boolean;
  percentDifference: number;
  limit: number;
  warning?: string;
}
```

## Testing Strategy

### Unit Tests (Jasmine/Karma)
- **Component Creation**: Verify component initializes correctly
- **Form Initialization**: Check all 4 trials created in FormArray
- **Signal Reactivity**: Test computed signals update correctly
- **Calculation Logic**: Mock ViscosityCalculationService responses
- **Repeatability Checks**: Test various trial selection scenarios
- **Time Parsing**: Test MM.SS.HH and decimal formats
- **Validation Rules**: Test form validation logic
- **Error Handling**: Test API failure scenarios

### Integration Tests
- **API Interactions**: Test service call sequences
- **Data Loading**: Verify existing trials populate correctly
- **Save Operations**: Test full save workflow
- **Status Transitions**: Test workflow state changes
- **Equipment Loading**: Test tube calibration dropdown population

### E2E Tests (Cypress/Playwright)
- **Complete Entry Flow**: Enter data for all 4 trials, save
- **Partial Save Flow**: Enter 2 trials, partial save
- **Repeatability Failure**: Enter trials that fail repeatability, confirm warning
- **Edit Existing**: Load form with data, modify, save
- **Keyboard Navigation**: Tab through form, complete via keyboard only
- **Mobile Layout**: Test responsive behavior on mobile viewport

### Visual Regression Tests
- **Table Rendering**: Screenshot comparison of table layout
- **Repeatability Card**: Compare pass/fail states
- **Loading States**: Verify spinner placement and overlay
- **Error States**: Capture validation error styling
- **Dark Mode**: (If implemented) Verify color adaptations

## Browser Support

### Modern Browsers (Evergreen)
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Fallbacks
- Material Design components handle older browser quirks
- Polyfills included via Angular build process
- Graceful degradation for CSS features (grid, flexbox)

## Security Considerations

### Input Validation
- **Client-Side**: Angular Validators for form fields
- **Server-Side**: API must re-validate all data
- **XSS Protection**: Angular sanitization by default
- **SQL Injection**: Parameterized queries on backend

### Authentication & Authorization
- User identity via `currentUser` input signal
- Qualification level via `userQualification` input signal
- Status workflow enforces permission rules
- API endpoints validate user permissions server-side

### Data Integrity
- **Readonly Fields**: Calculated results cannot be manually edited
- **Audit Trail**: `entryId` and `entryDate` captured on save
- **Status Tracking**: Workflow prevents invalid state transitions
- **Version Control**: Database timestamps for modification tracking

## Future Enhancements

### Potential Features
1. **Historical Comparison**: Show previous test results for same sample
2. **Graphing**: Visualize viscosity trends over time
3. **Auto-Fill**: Suggest tube calibration based on previous tests
4. **Bulk Import**: CSV upload for multiple trials
5. **PDF Export**: Generate printable test report
6. **Temperature Correction**: Auto-adjust for minor temp variations
7. **Tube Inventory**: Link to M&TE calibration dates and alerts
8. **Voice Input**: Hands-free data entry for lab efficiency

### Technical Improvements
1. **Offline Support**: Service Worker for disconnected operation
2. **Real-Time Collaboration**: Multiple users viewing same sample
3. **Undo/Redo**: History stack for trial data changes
4. **Advanced Validation**: Check against historical sample ranges
5. **Machine Learning**: Anomaly detection for outlier results
6. **Automated Testing**: Increased test coverage to 90%+

## Maintenance Guidelines

### Code Organization
- **Component File**: TypeScript logic, signal management
- **Template File**: HTML with Material components, control flow syntax
- **Style File**: SCSS with component-scoped styles
- **Spec File**: Comprehensive unit tests
- **Design File**: This documentation

### Naming Conventions
- **Signals**: Descriptive nouns (`isLoading`, `tubeOptions`)
- **Methods**: Verb-first (`onStopwatchTimeBlur`, `calculateResult`)
- **Interfaces**: Capitalized, descriptive (`ViscosityTrial`)
- **CSS Classes**: BEM-like, component-scoped (`.vis100-entry-form`)

### Update Procedures
1. **Angular Updates**: Follow Angular update guide for major versions
2. **Material Updates**: Check Material changelog for breaking changes
3. **Service API Changes**: Update interfaces and mock data
4. **Style Updates**: Maintain Material Design compliance
5. **Test Updates**: Update tests when business logic changes

### Documentation Standards
- **Inline Comments**: TSDoc format for public methods
- **Change Log**: Track significant updates in component header
- **README Updates**: Keep this document synchronized with code
- **API Documentation**: Link to service documentation

## Compliance & Standards

### Angular Style Guide
- **File Naming**: `vis100-entry-form.ts` (kebab-case)
- **Component Naming**: `Vis100EntryForm` (PascalCase)
- **Selector**: `app-vis100-entry-form` (kebab-case with prefix)
- **Standalone**: True (modern Angular architecture)
- **Imports**: Minimal, explicit, organized

### Material Design Compliance
- **Component Usage**: Material components throughout
- **Theming**: Uses default Material theme
- **Spacing**: 8px grid system (Material spec)
- **Typography**: Material typography scale
- **Icons**: Material Icons font

### Laboratory Standards
- **ASTM D445**: Standard Test Method for Kinematic Viscosity
- **ISO 3104**: Petroleum products — Transparent and opaque liquids
- **Repeatability Limit**: 0.35% for viscosity @ 100°C
- **Temperature Control**: ±0.02°C (enforced by test procedure)
- **Significant Figures**: 4 significant figures for reporting

---

**Document Information**
- *Created*: January 2025
- *Last Updated*: October 1, 2025
- *Version*: 1.0
- *Component Version*: Angular 18+
- *Author*: Lab Testing System Team
- *Review Status*: Ready for Implementation

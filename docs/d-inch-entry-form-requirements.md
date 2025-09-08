# D-inch Entry Form - Requirements Document

## Overview

This document defines the requirements for the D-inch Entry Form component (Work Item #12285) within the Angular laboratory testing application. The D-inch test is a standard laboratory test that requires specific data entry fields and follows the common trial-based entry pattern used throughout the application.

## Work Item Details

- **Work Item ID**: 12285
- **Title**: Enter Results - D-inch
- **Test Code**: DInch
- **Component Path**: `src/app/enter-results/entry-form-area/components/entry-form/tests/d-inch-entry-form/`

## Functional Requirements

### Core Functionality

1. **Sample Selection Integration**
   - Form loads when DInch test code is selected in the entry-form-area
   - Integrates with existing sample selection panel
   - Displays sample-specific data and metadata

2. **Trial-Based Data Entry**
   - Four trial lines available for data entry (Trial 1, Trial 2, Trial 3, Trial 4)
   - Each trial can have independent data entry
   - Support for partial trial completion

3. **Form Fields**
   - Standard trial-based entry fields following application patterns
   - Support for numeric data entry with appropriate validation
   - Comments field with character limits

4. **Data Persistence**
   - Save individual trial results
   - Clear functionality to reset form
   - Delete functionality for removing results
   - Auto-save capabilities for partial entries

5. **Navigation Features**
   - Common navigation menu integration (Save/Clear/Delete)
   - Historical record view showing last 12 sample IDs
   - Ability to select multiple trial records for batch operations

### User Interface Requirements

1. **Layout**
   - Consistent with other test entry forms
   - Material Design components following application theme
   - Responsive design for different screen sizes
   - Proper form field grouping and spacing

2. **Validation**
   - Real-time field validation
   - Error message display for invalid values
   - Required field indicators
   - Range validation for numeric fields

3. **Accessibility**
   - WCAG 2.1 AA compliance
   - Proper ARIA labels and descriptions
   - Keyboard navigation support
   - Screen reader compatibility

## Acceptance Criteria

Based on Work Item #12285, the following acceptance criteria must be met:

✅ **AC1**: The user can select a Sample ID from list available for specific test  
✅ **AC2**: The user is able to see specific Sample ID data  
✅ **AC3**: The user is able to see specific test name template fields for entering test results  
✅ **AC4**: The user is able to update Lab Comments  
✅ **AC5**: The user is able to enter in test results by trial  
✅ **AC6**: The user is able to select specific trial records to make changes to  
✅ **AC7**: The user is able to save/clear or delete test result data entries  
✅ **AC8**: The system calculates specific fields define for the test name template  

## Technical Requirements

### Angular Framework Requirements

1. **Modern Angular APIs**
   - Use Angular 20+ standalone component architecture
   - Implement input/output signals instead of legacy @Input/@Output decorators
   - Follow Angular style guide naming conventions

2. **Component Structure**
   - Standalone component with selective imports
   - Reactive forms using FormBuilder
   - Signal-based state management
   - OnPush change detection strategy

3. **Dependencies**
   - Angular Material for UI components
   - Shared module for common functionality
   - TypeScript with strict typing

### Form Implementation

1. **Reactive Forms**
   - FormBuilder for form construction
   - FormArray for trial data if applicable
   - Built-in and custom validators
   - Form state tracking and validation

2. **State Management**
   - Angular signals for reactive UI updates
   - Computed signals for derived state
   - Proper form subscription management

3. **Data Types**
   - Strong TypeScript interfaces for form data
   - Integration with existing enter-results.types.ts
   - Proper serialization/deserialization

## Integration Requirements

### Entry Form Area Integration

The D-inch entry form must integrate with the existing entry-form-area component:

1. **Component Registration**
   - Import DInchEntryForm in entry-form.ts
   - Add component to imports array
   - Register in component template with proper test code check

2. **Test Code Mapping**
   - Component loads when `testCode() === 'DInch'`
   - Proper test reference to test code conversion
   - Backward compatibility with migration utilities

### Data Service Integration

1. **Test Readings Service**
   - Integration for saving/loading test results
   - Historical data retrieval for last 12 samples
   - Batch operations support

2. **Sample Data Service**
   - Access to sample metadata
   - Lab comments integration
   - Status tracking

## File Structure Requirements

The component must follow the established file structure pattern:

```
src/app/enter-results/entry-form-area/components/entry-form/tests/d-inch-entry-form/
├── d-inch-entry-form.ts          # Main component class
├── d-inch-entry-form.html        # Component template
├── d-inch-entry-form.scss        # Component styles
└── d-inch-entry-form.spec.ts     # Unit tests
```

## Quality Standards

1. **Code Quality**
   - TypeScript strict mode compliance
   - ESLint and Prettier formatting
   - Comprehensive unit test coverage (>80%)
   - Angular best practices adherence

2. **Performance**
   - OnPush change detection for optimization
   - Lazy loading where applicable
   - Efficient DOM updates using Angular's built-in optimizations
   - Memory management with proper subscription cleanup

3. **Maintainability**
   - Clear component documentation
   - Self-documenting code with meaningful names
   - Separation of concerns
   - Reusable utility functions

## Testing Requirements

1. **Unit Tests**
   - Component initialization testing
   - Form validation testing
   - User interaction testing
   - Error scenario testing
   - Mock service integration testing

2. **Integration Tests**
   - Entry form area integration
   - Sample selection integration
   - Data service communication
   - Navigation functionality

## Future Considerations

1. **Extensibility**
   - Support for additional field types
   - Custom validation rules
   - Enhanced calculation capabilities
   - Advanced reporting features

2. **Performance Optimization**
   - Virtual scrolling for large datasets
   - Caching strategies for historical data
   - Optimized change detection

3. **User Experience Enhancements**
   - Auto-save functionality
   - Keyboard shortcuts
   - Drag-and-drop capabilities
   - Export functionality

## Dependencies and Constraints

### Angular Dependencies
- Angular 20+
- Angular Material
- Angular Forms (Reactive Forms)
- RxJS for reactive programming

### Application Dependencies
- SharedModule for common components
- Enter-results types for data models
- Test readings service
- Sample data service

### Browser Support
- Modern browsers supporting ES2022
- Mobile browser compatibility
- Accessibility standard compliance

## Conclusion

This requirements document provides the foundation for implementing the D-inch Entry Form component following the established patterns in the laboratory testing application. The implementation should prioritize consistency with existing components while ensuring the specific needs of D-inch testing are met according to the work item specifications.

The component will serve as a template for other standard test entry forms and should demonstrate best practices for Angular development using modern APIs and patterns.

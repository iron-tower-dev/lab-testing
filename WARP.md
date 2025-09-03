# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is an Angular 20 application called "LabTesting" for managing laboratory test result entry. It's a modern Angular standalone application using Angular Material for UI components and follows current Angular best practices with standalone components.

## Development Commands

### Build and Development
- **Start development server**: `ng serve` or `npm start`
  - Runs at http://localhost:4200 with hot reload
- **Build for production**: `ng build`
  - Outputs to `dist/` directory with optimization
- **Build for development with watch**: `ng build --watch --configuration development`

### Testing
- **Run all tests**: `ng test` or `npm test`
  - Uses Karma with Jasmine for unit testing
  - Tests run in Chrome by default
- **Run tests for a specific component**: `ng test --include="**/component-name.spec.ts"`
- **Run tests in headless mode**: `ng test --browsers=ChromeHeadless --watch=false`

### Code Generation
- **Generate component**: `ng generate component component-name`
  - Components use SCSS by default (configured in angular.json)
  - New components will be standalone by default
- **Generate service**: `ng generate service service-name`
- **Generate other schematics**: `ng generate --help` for full list

## Architecture Overview

### Application Structure
- **Bootstrap**: Uses `bootstrapApplication()` with standalone components (not NgModules)
- **Routing**: Two main routes:
  - `/` - Home page with navigation
  - `/enter-results` - Main laboratory result entry interface
- **Component Architecture**: All components are standalone, importing only what they need

### Key Components

#### EnterResults Component (`src/app/enter-results/`)
The main feature component with a two-phase UI:
1. **Test Selection Phase**: Shows `TestTypeList` for initial test type selection
2. **Data Entry Phase**: Shows `SampleSelectionPanel` and `EntryFormArea` after test selection

#### Child Components:
- `TestTypeList` - Displays available test types for selection
- `SampleSelectionPanel` - Handles sample selection and test type changes
- `EntryFormArea` - Main form for data entry
- `TestTypeSelection` - Reusable test type selector using Angular signals

#### Shared Architecture:
- `SharedModule` - Exports commonly used Angular Material modules and forms
- `enter-results.types.ts` - Comprehensive type definitions for test data models

### Data Models (TestCode Types)
The application supports 24 different test types including:
- TAN (TAN by Color Indication)
- KF (Water Content by Karl Fischer)
- Spectroscopy tests (Standard/Large)
- Viscosity tests (40°C/100°C)
- FTIR, Flash Point, Ferrography, etc.

### Component Communication
- Uses Angular signals for reactive state management (`TestTypeSelection`)
- Output events for component communication (`selectedTestTypeChange`)
- Input properties for data passing between parent/child components

### Styling
- **Global styles**: `src/styles.scss`
- **Component styles**: Each component has its own `.scss` file
- **UI Framework**: Angular Material with custom theming
- **Style language**: SCSS configured by default

### Testing Strategy
- **Unit Tests**: Jasmine with Angular TestBed
- **Component Testing**: Tests component creation, state changes, and DOM rendering
- **Testing Patterns**: 
  - Component initialization tests
  - State change verification
  - DOM element presence checks
  - Event emission testing

## Development Notes

### TypeScript Configuration
- Uses strict TypeScript settings with `noImplicitReturns`, `noFallthroughCasesInSwitch`
- Experimental decorators enabled for Angular
- Target: ES2022 with module preservation

### Build Configuration
- Production builds use output hashing for caching
- Bundle size limits: 500kB warning, 1MB error for initial bundles
- Component styles limited to 4kB warning, 8kB error
- Development builds include source maps and disable optimization

### Code Style
- Prettier configured with 100-character line width
- Single quotes preferred
- Special Angular HTML parser configuration for templates

### File Structure Patterns
- Components follow the pattern: `component-name.ts`, `component-name.html`, `component-name.scss`, `component-name.spec.ts`
- Each feature has its own directory with related components as subdirectories
- Shared functionality extracted to `shared-module.ts`
- Type definitions in dedicated `.types.ts` files

# Particle Components

This folder contains components for managing particle information in the ferrography entry form, including both particle type cards and particle subtype cards.

## Components

### ParticleSubtypeCardComponent
The main component that displays a collapsible card containing particle type information and selection controls for particle subtype properties.

**Usage:**
```html
<app-particle-subtype-card
  [particleType]="particleTypeData"
  [subtypeCategories]="categoryDefinitions"
  [subtypeDefinitions]="subtypeDefinitions"
  [initialSelections]="existingSelections"
  [readOnly]="false"
  (selectionsChange)="onSelectionsChange($event)"
></app-particle-subtype-card>
```

**Inputs:**
- `particleType` (required): `ParticleTypeDefinition` - Information about the particle type from the database
- `subtypeCategories` (required): `ParticleSubTypeCategory[]` - Available categories (Severity, Heat, Concentration, etc.)
- `subtypeDefinitions` (required): `ParticleSubTypeDefinition[]` - Available options for each category
- `initialSelections` (optional): `ParticleSubTypeSelection[]` - Pre-selected values
- `readOnly` (optional): `boolean` - Disable form editing (default: false)

**Outputs:**
- `selectionsChange`: Emitted when user makes selections, provides `ParticleSubTypeSelection[]`

### ParticleTypeCardComponent
A comprehensive card component that displays particle type information and provides form controls for particle analysis. This component was refactored from the original inline cards in the ferrography-entry-form.

**Usage:**
```html
<app-particle-type-card
  [particleType]="particleType"
  [particleTypeDefinition]="particleTypeDefinition"
  [particleForm]="particleForm"
  [isVisible]="isVisible"
  [readOnly]="false"
  [heatOptions]="heatOptions"
  [concentrationOptions]="concentrationOptions"
  [sizeOptions]="sizeOptions"
  [colorOptions]="colorOptions"
  [textureOptions]="textureOptions"
  [compositionOptions]="compositionOptions"
  [severityOptions]="severityOptions"
  (selectionToggle)="onSelectionToggle($event)"
  (visibilityToggle)="onVisibilityToggle($event)"
  (addCommentToOverall)="onAddCommentToOverall($event)">
</app-particle-type-card>
```

**Inputs:**
- `particleType` (required): `FerrographyParticleType` - The particle type name
- `particleTypeDefinition` (optional): `ParticleTypeDefinition | null` - Database information for the particle type
- `particleForm` (required): `FormGroup` - Reactive form for the particle type
- `isVisible` (optional): `boolean` - Whether the card is visible based on view mode
- `readOnly` (optional): `boolean` - Disable form editing
- Various option arrays for dropdown selections

**Outputs:**
- `selectionToggle`: Emitted when particle type is selected/deselected
- `visibilityToggle`: Emitted when particle type visibility is toggled
- `addCommentToOverall`: Emitted when comment should be added to overall comments

### ParticleTypeHeaderComponent
A header component that displays particle type information including type name, description, and images from the database.

**Usage:**
```html
<app-particle-type-header [particleType]="particleTypeData"></app-particle-type-header>
```

**Inputs:**
- `particleType` (required): `ParticleTypeDefinition` - Particle type information from database

## Data Structure

The components expect data that matches the database schema:

### ParticleTypeDefinition
```typescript
interface ParticleTypeDefinition {
  id: number;
  type: string;
  description: string;
  image1: string;
  image2: string;
  active: string;
  sortOrder: number | null;
}
```

### ParticleSubTypeCategory
```typescript
interface ParticleSubTypeCategory {
  id: number;
  description: string;  // e.g., "Severity", "Heat", "Concentration"
  active: string;
  sortOrder: number;
}
```

### ParticleSubTypeDefinition
```typescript
interface ParticleSubTypeDefinition {
  particleSubTypeCategoryId: number;
  value: number;
  description: string;  // e.g., "NA", "Blue", "Few", "Moderate"
  active: string;
  sortOrder: number | null;
}
```

### ParticleSubTypeSelection
```typescript
interface ParticleSubTypeSelection {
  categoryId: number;
  selectedValue: number | null;
}
```

## Features

- **Responsive Design**: Components adapt to different screen sizes
- **Angular Material Integration**: Uses Material Design components and styling
- **Collapsible Interface**: Card body can be expanded/collapsed to save space
- **Form Validation**: Tracks form state and validation
- **Performance Optimized**: Uses trackBy functions and Angular signals
- **Accessibility**: Includes proper ARIA attributes and keyboard navigation
- **Testing**: Comprehensive test coverage with Jasmine/Karma

## API Integration

The components are designed to work with data from these database tables:
- `particle_type_definition_table`: Particle type information
- `particle_sub_type_category_definition_table`: Available categories
- `particle_sub_type_definition_table`: Options for each category

## Images

Particle images should be placed in `/assets/particle-images/` directory. The header component will automatically construct the image paths based on the `image1` and `image2` fields from the database.

## Testing

Run tests with:
```bash
ng test --include="**/particle-*.component.spec.ts"
```

Both components have comprehensive test suites covering:
- Component creation and initialization
- Input/output functionality
- Form validation and state management
- User interactions
- Responsive behavior
- Edge cases and error conditions

## Refactoring Notes

### Component Extraction
The `ParticleTypeCardComponent` was created as part of a refactoring effort to extract the inline particle type cards from the `ferrography-entry-form.html` template. This improves:

- **Code Reusability**: The card can now be reused in other contexts
- **Maintainability**: Particle type logic is encapsulated in a dedicated component
- **Testing**: Each component can be tested in isolation
- **Performance**: Better change detection and optimization opportunities

### Database Integration
The `ParticleTypeHeaderComponent` was updated to display information from the `particle_type_definition_table` including:
- Type name and description from database
- Associated images (image1, image2 fields)
- Proper fallback when database information is not available

### Template Changes
The main ferrography entry form template was simplified from complex inline cards to:

```html
<app-particle-type-card
  *ngFor="let particleType of particleTypes"
  [particleType]="particleType"
  [particleTypeDefinition]="getParticleTypeDefinition(particleType)"
  [particleForm]="getParticleTypeForm(particleType)"
  <!-- other inputs -->
  (selectionToggle)="toggleParticleTypeSelection($event)"
  (visibilityToggle)="toggleParticleTypeVisibility($event)"
  (addCommentToOverall)="addParticleCommentToOverall($event)">
</app-particle-type-card>
```

export interface MTEquipmentResponse {
  equipName: string | null;
  dueDate: Date | null;
}

export interface ParticleSubTypeResponse {
  category: string;
  definitions: string[];
}

export interface ParticleTypeResponse {
  id: number;
  type: string;
  description: string;
  image1: string;
  image2: string;
}

/**
 * Particle type definition from database
 */
export interface ParticleTypeDefinition {
  id: number;
  type: string;
  description: string;
  image1: string;
  image2: string;
  active: string;
  sortOrder: number | null;
}

/**
 * Particle subtype category definition
 */
export interface ParticleSubTypeCategory {
  id: number;
  description: string;
  active: string;
  sortOrder: number;
}

/**
 * Particle subtype definition for selection options
 */
export interface ParticleSubTypeDefinition {
  particleSubTypeCategoryId: number;
  value: number;
  description: string;
  active: string;
  sortOrder: number | null;
}

/**
 * User selection for particle subtype properties
 */
export interface ParticleSubTypeSelection {
  categoryId: number;
  selectedValue: number | null;
}

export interface FerrogramTestResultResponse {
  sampleId: number | null;
  testReading1: string | null;
  testReading2: string | null;
  particleTypeDefinitionId: number | null;
  status: string | null;
  comments: string | null;
  heat: number | null;
  concentration: number | null;
  sizeAve: number | null;
  sizeMax: number | null;
  color: number | null;
  texture: number | null;
  compostion: number | null;
  severity: number | null;
}

// ==========================================
// Ferrography-specific Types
// ==========================================

export type FerrographyHeat = 'NA' | 'Blue' | 'Straw' | 'Purple' | 'No Change' | 'Melted' | 'Charred';
export type FerrographyConcentration = 'Few' | 'Moderate' | 'Many' | 'Heavy';
export type FerrographySize = 'Fine, <5µm' | 'Small, 5 to 15µm' | 'Medium, 15 to 40µm' | 'Large, 40 to 100µm' | 'Huge, >100µm';
export type FerrographyColor = 'Red' | 'Black' | 'Tempered' | 'Metallic' | 'Straw' | 'Copper' | 'Brass' | 'Other Color';
export type FerrographyTexture = 'Bright or Reflective' | 'Dull or Oxidized' | 'Pitted' | 'Striated' | 'Smeared' | 'Amorphous' | 'Other Texture';
export type FerrographyComposition = 'Ferrous Metal' | 'Cupric Metal' | 'Other Metal' | 'Dust' | 'Organic' | 'Sludge' | 'Paint Chips' | 'Other Material';
export type FerrographySeverity = 1 | 2 | 3 | 4;
export type FerrographyDilutionFactor = '3:2' | '1:10' | '1:100' | 'Manual';
export type FerrographyViewMode = 'All' | 'Review';

/**
 * Predefined particle types for ferrography analysis
 */
export const FERROGRAPHY_PARTICLE_TYPES = [
  'Rubbing Wear (Platelet)',
  'Rubbing Wear',
  'Black Oxide',
  'Dark Metallo-Oxide',
  'Abrasive Wear',
  'Rework',
  'Severe Wear Particles',
  'Chunks',
  'Spheres',
  'Red Oxide (Rust)',
  'Non Ferrous Metal',
  'Corrosive',
  'Non Metallic Crystalline',
  'Non Metallic Amorphous',
  'Friction Polymer',
  'Fibers'
] as const;

export type FerrographyParticleType = typeof FERROGRAPHY_PARTICLE_TYPES[number];

/**
 * Individual particle type analysis data
 */
export interface FerrographyParticleTypeData {
  particleType: FerrographyParticleType;
  isVisible: boolean;
  isSelected: boolean;
  heat?: FerrographyHeat;
  concentration?: FerrographyConcentration;
  sizeAvg?: FerrographySize;
  sizeMax?: FerrographySize;
  color?: FerrographyColor;
  texture?: FerrographyTexture;
  composition?: FerrographyComposition;
  severity?: FerrographySeverity;
  comments?: string;
  includeCommentsInOverall: boolean;
}

/**
 * Overall ferrography test results data
 */
export interface FerrographyOverallData {
  overallSeverity?: FerrographySeverity;
  dilutionFactor?: FerrographyDilutionFactor;
  customDilutionFactor?: string;
  overallComments: string;
  viewMode: FerrographyViewMode;
  mediaReady: boolean;
  partialSave: boolean;
}

/**
 * Complete ferrography test entry form data
 */
export interface FerrographyFormData {
  sampleId?: number;
  overall: FerrographyOverallData;
  particleTypes: FerrographyParticleTypeData[];
  labComments?: string[];
}

/**
 * Ferrography form validation state
 */
export interface FerrographyFormValidation {
  isValid: boolean;
  overallErrors: string[];
  particleTypeErrors: Record<FerrographyParticleType, string[]>;
  commentLengthWarning: boolean;
  hasUnsavedChanges: boolean;
}

export interface ResultsHeaderResponse {
  sampleId: number;
  tagNumber: string | null;
  lubeType: string | null;
  newUsedFlag: number | null;
  qualityClass: string | null;
  compCode: string | null;
  compName: string | null;
  locCode: string | null;
  locName: string | null;
  labComments: string[] | null;
}

/**
 * Enhanced sample information with test context
 * Used for displaying comprehensive sample details in the entry form header
 */
export interface SampleWithTestInfo {
  sampleId: number;
  sampleNumber: string;
  testName: string;
  eqTagNum: string | null;
  component: string | null;
  location: string | null;
  lubeType: string | null;
  techData: string | null;
  qualityClass: string | null;
  labComments: string[] | null;
  testReference: TestReference;
}

/**
 * Sample database response for test-specific samples
 */
export interface SampleTestResponse {
  sampleId: number;
  sampleNumber: string;
  testId: number;
  testName: string;
  eqTagNum?: string;
  component?: string;
  location?: string;
  lubeType?: string;
  techData?: string;
  qualityClass?: string;
  labComments?: string[];
  status: string;
  priority: number;
  assignedDate: Date;
}

/**
 * @deprecated Use TestReference, TestLookupKey, or TestDefinition instead.
 * This type is kept for backward compatibility during migration.
 */
export type TestCode =
  | 'TAN'
  | 'KF'
  | 'SpecStd'
  | 'SpecLrg'
  | 'Vis40'
  | 'Vis100'
  | 'FTIR'
  | 'FlashPt'
  | 'TBN'
  | 'InspectFilter'
  | 'GrPen60'
  | 'GrDropPt'
  | 'Pcnt'
  | 'RBOT'
  | 'FltrRes'
  | 'Ferrography'
  | 'Rust'
  | 'TFOUT'
  | 'DebrisID'
  | 'Deleterious'
  | 'Rheometry'
  | 'DInch'
  | 'OilContent'
  | 'VPR';

/**
 * @deprecated Use TestDefinition with proper database lookup instead.
 * This mapping is kept for backward compatibility during migration.
 */
export const testCodeToType: Record<TestCode, string> = {
  TAN: 'TAN by Color Indication',
  KF: 'Water Content by Karl Fischer',
  SpecStd: 'Emission Spectroscopy - Standard',
  SpecLrg: 'Emission Spectroscopy - Large',
  Vis40: 'Viscosity - 40°C',
  Vis100: 'Viscosity - 100°C',
  FTIR: 'FTIR',
  FlashPt: 'Flash Point',
  TBN: 'TBN by Auto Titration',
  InspectFilter: 'Inspect Filter',
  GrPen60: 'Grease Penetration - 60°C',
  GrDropPt: 'Grease Drop Point',
  Pcnt: 'Particle Count',
  RBOT: 'Rheology - Brookfield',
  FltrRes: 'Filter Residue',
  Ferrography: 'Ferrography',
  Rust: 'Rust',
  TFOUT: 'TFOUT',
  DebrisID: 'Debris Identification',
  Deleterious: 'Deleterious',
  Rheometry: 'Rheometry',
  DInch: 'Diameter Inch',
  OilContent: 'Oil Content',
  VPR: 'Varnish Potential Rating',
};

// ==========================================
// Test Identification Types
// ==========================================

/**
 * Complete test definition from the database
 * Corresponds to the test_table schema
 */
export interface TestDefinition {
  id: number;
  name: string | null;
  testStandId: number | null;
  sampleVolumeRequired: number | null;
  exclude: string | null;
  abbrev: string | null;
  displayedGroupId: number | null;
  groupName: string | null;
  lab: boolean;
  schedule: boolean;
  shortAbbrev: string | null;
}

/**
 * Test identifier that can be used to look up a test by id, name, or abbreviation
 * Only one of these properties needs to be provided
 */
export interface TestIdentifier {
  id?: number;
  name?: string;
  abbrev?: string;
  shortAbbrev?: string;
}

/**
 * Union type for different ways to identify a test
 */
export type TestLookupKey = 
  | { id: number }
  | { name: string }
  | { abbrev: string }
  | { shortAbbrev: string };

/**
 * Utility type to get the key used for test lookup
 */
export type TestLookupType = 'id' | 'name' | 'abbrev' | 'shortAbbrev';

/**
 * Test information with lookup context
 * Includes the original lookup key and full test definition
 */
export interface TestInfo {
  lookupKey: TestLookupKey;
  lookupType: TestLookupType;
  test: TestDefinition;
}

/**
 * Minimal test reference for component communication
 * Contains just enough info to identify and display a test
 */
export interface TestReference {
  id: number;
  name: string | null;
  abbrev: string | null;
  shortAbbrev: string | null;
  groupName: string | null;
}

/**
 * Test selection state for UI components
 */
export interface TestSelection {
  reference: TestReference;
  isSelected: boolean;
  isEnabled: boolean;
}

/**
 * Test lookup result that includes search metadata
 */
export interface TestLookupResult {
  found: boolean;
  test?: TestDefinition;
  searchValue: string | number;
  searchType: TestLookupType;
  matches?: TestDefinition[]; // For cases where search returns multiple results
}

/**
 * Helper type for test filtering in components
 */
export interface TestFilter {
  groupName?: string;
  lab?: boolean;
  schedule?: boolean;
  searchTerm?: string;
}

/**
 * Test group information
 */
export interface TestGroup {
  id: number | null;
  name: string | null;
  tests: TestReference[];
  testCount: number;
}

/**
 * Type guards and utility functions
 */
export namespace TestIdentifierUtils {
  /**
   * Type guard to check if a TestLookupKey is an ID lookup
   */
  export function isIdLookup(key: TestLookupKey): key is { id: number } {
    return 'id' in key && typeof key.id === 'number';
  }

  /**
   * Type guard to check if a TestLookupKey is a name lookup
   */
  export function isNameLookup(key: TestLookupKey): key is { name: string } {
    return 'name' in key && typeof key.name === 'string';
  }

  /**
   * Type guard to check if a TestLookupKey is an abbrev lookup
   */
  export function isAbbrevLookup(key: TestLookupKey): key is { abbrev: string } {
    return 'abbrev' in key && typeof key.abbrev === 'string';
  }

  /**
   * Type guard to check if a TestLookupKey is a shortAbbrev lookup
   */
  export function isShortAbbrevLookup(key: TestLookupKey): key is { shortAbbrev: string } {
    return 'shortAbbrev' in key && typeof key.shortAbbrev === 'string';
  }

  /**
   * Get the lookup type from a TestLookupKey
   */
  export function getLookupType(key: TestLookupKey): TestLookupType {
    if (isIdLookup(key)) return 'id';
    if (isNameLookup(key)) return 'name';
    if (isAbbrevLookup(key)) return 'abbrev';
    if (isShortAbbrevLookup(key)) return 'shortAbbrev';
    throw new Error('Invalid TestLookupKey');
  }

  /**
   * Get the lookup value from a TestLookupKey
   */
  export function getLookupValue(key: TestLookupKey): string | number {
    if (isIdLookup(key)) return key.id;
    if (isNameLookup(key)) return key.name;
    if (isAbbrevLookup(key)) return key.abbrev;
    if (isShortAbbrevLookup(key)) return key.shortAbbrev;
    throw new Error('Invalid TestLookupKey');
  }

  /**
   * Create a TestReference from a TestDefinition
   */
  export function toTestReference(test: TestDefinition): TestReference {
    return {
      id: test.id,
      name: test.name,
      abbrev: test.abbrev,
      shortAbbrev: test.shortAbbrev,
      groupName: test.groupName
    };
  }

  /**
   * Create a display name for a test (prioritizes name, then abbrev, then shortAbbrev, then ID)
   */
  export function getDisplayName(test: TestDefinition | TestReference): string {
    return test.name || test.abbrev || test.shortAbbrev || `Test #${test.id}`;
  }

  /**
   * Create a TestLookupKey from an identifier object
   */
  export function createLookupKey(identifier: TestIdentifier): TestLookupKey {
    if (identifier.id !== undefined) {
      return { id: identifier.id };
    }
    if (identifier.name !== undefined) {
      return { name: identifier.name };
    }
    if (identifier.abbrev !== undefined) {
      return { abbrev: identifier.abbrev };
    }
    if (identifier.shortAbbrev !== undefined) {
      return { shortAbbrev: identifier.shortAbbrev };
    }
    throw new Error('TestIdentifier must have at least one property defined');
  }
}

// ==========================================
// Migration Utilities (Temporary)
// ==========================================

/**
 * Sample data that maps legacy TestCode values to TestReference objects
 * This is temporary data for the migration - in production this should come from the database
 */
export const LEGACY_TEST_CODE_TO_REFERENCE: Record<TestCode, TestReference> = {
  TAN: { id: 10, name: 'TAN by Color Indication', abbrev: 'TAN', shortAbbrev: 'TAN', groupName: 'PHYSICAL & CHEMICAL PROPERTIES' },
  KF: { id: 20, name: 'Water - KF', abbrev: 'K-F', shortAbbrev: 'K-F', groupName: 'PHYSICAL & CHEMICAL PROPERTIES' },
  SpecStd: { id: 30, name: 'Emission Spectroscopy - Standard', abbrev: 'Spec-Std', shortAbbrev: 'S Sp', groupName: 'ELEMENTS--STD' },
  SpecLrg: { id: 40, name: 'Emission Spectroscopy - Large', abbrev: 'Spec-Lrg', shortAbbrev: 'L Sp', groupName: 'ELEMENTS--LARGE' },
  Vis40: { id: 50, name: 'Viscosity @ 40', abbrev: 'Vis@40', shortAbbrev: 'V 40', groupName: 'PHYSICAL & CHEMICAL PROPERTIES' },
  Vis100: { id: 60, name: 'Viscosity @ 100', abbrev: 'Vis@100', shortAbbrev: 'V 100', groupName: 'PHYSICAL & CHEMICAL PROPERTIES' },
  FTIR: { id: 70, name: 'FT-IR', abbrev: 'FT-IR', shortAbbrev: 'FT-IR', groupName: 'INFRARED SPECTROSCOPY' },
  FlashPt: { id: 80, name: 'Flash Point', abbrev: 'Flash Pt.', shortAbbrev: 'Fl Pt', groupName: 'PHYSICAL & CHEMICAL PROPERTIES' },
  TBN: { id: 110, name: 'TBN by Auto Titration', abbrev: 'TBN', shortAbbrev: 'TBN', groupName: 'PHYSICAL & CHEMICAL PROPERTIES' },
  InspectFilter: { id: 120, name: 'Inspect Filter', abbrev: 'InspectFilte', shortAbbrev: 'I F', groupName: 'PHYSICAL & CHEMICAL PROPERTIES' },
  GrPen60: { id: 130, name: 'Grease Penetration Worked', abbrev: 'Gr.Pen/60', shortAbbrev: 'GP 60', groupName: 'PHYSICAL & CHEMICAL PROPERTIES' },
  GrDropPt: { id: 140, name: 'Grease Dropping Point', abbrev: 'Gr.DropPt', shortAbbrev: 'GD Pt', groupName: 'PHYSICAL & CHEMICAL PROPERTIES' },
  Pcnt: { id: 160, name: 'Particle Count', abbrev: 'PCnt', shortAbbrev: 'PC', groupName: 'PARTICLE COUNT' },
  RBOT: { id: 170, name: 'RBOT', abbrev: 'RBOT', shortAbbrev: 'R BOT', groupName: 'PHYSICAL & CHEMICAL PROPERTIES' },
  FltrRes: { id: 180, name: 'Filter Residue', abbrev: 'FltrRes', shortAbbrev: 'F Res', groupName: 'PHYSICAL & CHEMICAL PROPERTIES' },
  Ferrography: { id: 210, name: 'Ferrography', abbrev: 'Ferrography', shortAbbrev: 'Fer', groupName: 'WEAR PARTICLE ANALYSIS' },
  Rust: { id: 220, name: 'Rust', abbrev: 'Rust', shortAbbrev: 'Rust', groupName: 'PHYSICAL & CHEMICAL PROPERTIES' },
  TFOUT: { id: 230, name: 'TFOUT', abbrev: 'TFOUT', shortAbbrev: 'TF OUT', groupName: 'PHYSICAL & CHEMICAL PROPERTIES' },
  DebrisID: { id: 240, name: 'Debris Identification', abbrev: 'DebrisID', shortAbbrev: 'Debr', groupName: 'PHYSICAL & CHEMICAL PROPERTIES' },
  Deleterious: { id: 250, name: 'Deleterious', abbrev: 'Deleterious', shortAbbrev: 'Del', groupName: 'PHYSICAL & CHEMICAL PROPERTIES' },
  Rheometry: { id: 270, name: 'Rheometer', abbrev: 'Rheometer', shortAbbrev: 'Rheo', groupName: 'RHEOMETER' },
  DInch: { id: 284, name: 'D-inch', abbrev: 'D-inch', shortAbbrev: 'D-in', groupName: 'MISCELLANEOUS' },
  OilContent: { id: 285, name: 'Oil Content', abbrev: 'Oil Content', shortAbbrev: 'Oil C', groupName: 'MISCELLANEOUS' },
  VPR: { id: 286, name: 'Varnish Potential Rating', abbrev: 'VPR', shortAbbrev: 'VPR', groupName: 'MISCELLANEOUS' },
};

/**
 * Migration utilities namespace
 * @deprecated These functions are for temporary use during migration from TestCode to new type system
 */
export namespace MigrationUtils {
  /**
   * Convert legacy TestCode to TestReference
   * @deprecated Use proper database lookup instead
   */
  export function testCodeToReference(testCode: TestCode): TestReference {
    return LEGACY_TEST_CODE_TO_REFERENCE[testCode];
  }

  /**
   * Convert TestReference back to legacy TestCode (for backward compatibility)
   * @deprecated This should not be needed once migration is complete
   */
  export function referenceToTestCode(reference: TestReference): TestCode | null {
    for (const [code, ref] of Object.entries(LEGACY_TEST_CODE_TO_REFERENCE)) {
      // Match by ID first (most reliable)
      if (ref.id === reference.id) {
        return code as TestCode;
      }
      // Match by abbrev, handling whitespace
      if (ref.abbrev && reference.abbrev && 
          ref.abbrev.trim() === reference.abbrev.trim()) {
        return code as TestCode;
      }
      // Match by shortAbbrev as fallback
      if (ref.shortAbbrev && reference.shortAbbrev && 
          ref.shortAbbrev.trim() === reference.shortAbbrev.trim()) {
        return code as TestCode;
      }
    }
    return null;
  }

  /**
   * Get all test references as options for dropdowns/selects
   * @deprecated Use proper database service instead
   */
  export function getAllTestOptions(): Array<{ reference: TestReference; label: string }> {
    return Object.entries(LEGACY_TEST_CODE_TO_REFERENCE).map(([code, reference]) => ({
      reference,
      label: TestIdentifierUtils.getDisplayName(reference)
    }));
  }

  /**
   * Create sample data for a given test reference
   * @deprecated Replace with actual database service
   */
  export function generateSampleIds(testReference: TestReference): string[] {
    const abbrev = testReference.abbrev || testReference.shortAbbrev || `T${testReference.id}`;
    return [101, 102, 103, 104].map(n => `${abbrev}-${n}`);
  }
}

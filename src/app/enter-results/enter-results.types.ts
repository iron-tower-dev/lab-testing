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
 * Individual particle type analysis data
 */
export interface FerrographyParticleTypeData {
  particleType: string; // Now dynamically loaded from database
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
  particleTypeErrors: Record<string, string[]>;
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

// ==========================================
// Test Helper Functions for Testing
// ==========================================

/**
 * Helper functions to create TestReference instances for testing purposes.
 * These replace the deprecated LEGACY_TEST_CODE_TO_REFERENCE constant.
 */
export const TestHelpers = {
  createTANReference(): TestReference {
    return { id: 10, name: 'TAN by Color Indication', abbrev: 'TAN', shortAbbrev: null, groupName: 'Chemical' };
  },
  createKFReference(): TestReference {
    return { id: 20, name: 'Water Content by Karl Fischer', abbrev: 'KF', shortAbbrev: null, groupName: 'Chemical' };
  },
  createSpecStdReference(): TestReference {
    return { id: 30, name: 'Emission Spectroscopy - Standard', abbrev: 'SpecStd', shortAbbrev: null, groupName: 'Spectroscopy' };
  },
  createSpecLrgReference(): TestReference {
    return { id: 40, name: 'Emission Spectroscopy - Large', abbrev: 'SpecLrg', shortAbbrev: null, groupName: 'Spectroscopy' };
  },
  createVis40Reference(): TestReference {
    return { id: 50, name: 'Viscosity - 40°C', abbrev: 'Vis40', shortAbbrev: null, groupName: 'Physical' };
  },
  createVis100Reference(): TestReference {
    return { id: 60, name: 'Viscosity - 100°C', abbrev: 'Vis100', shortAbbrev: null, groupName: 'Physical' };
  },
  createFlashPtReference(): TestReference {
    return { id: 80, name: 'Flash Point', abbrev: 'FlashPt', shortAbbrev: null, groupName: 'Physical' };
  },
  createTBNReference(): TestReference {
    return { id: 110, name: 'TBN by Auto Titration', abbrev: 'TBN', shortAbbrev: null, groupName: 'Chemical' };
  },
  createInspectFilterReference(): TestReference {
    return { id: 120, name: 'Inspect Filter', abbrev: 'InspectFilter', shortAbbrev: null, groupName: 'Physical' };
  },
  createGrPen60Reference(): TestReference {
    return { id: 130, name: 'Grease Penetration - 60°C', abbrev: 'GrPen60', shortAbbrev: null, groupName: 'Grease' };
  },
  createGrDropPtReference(): TestReference {
    return { id: 140, name: 'Grease Drop Point', abbrev: 'GrDropPt', shortAbbrev: null, groupName: 'Grease' };
  },
  createPcntReference(): TestReference {
    return { id: 160, name: 'Particle Count', abbrev: 'Pcnt', shortAbbrev: null, groupName: 'Physical' };
  },
  createRBOTReference(): TestReference {
    return { id: 170, name: 'RBOT', abbrev: 'RBOT', shortAbbrev: null, groupName: 'Chemical' };
  },
  createFerrographyReference(): TestReference {
    return { id: 210, name: 'Ferrography', abbrev: 'Ferrography', shortAbbrev: null, groupName: 'Particle Analysis' };
  },
  createRustReference(): TestReference {
    return { id: 220, name: 'Rust', abbrev: 'Rust', shortAbbrev: null, groupName: 'Chemical' };
  },
  createTFOUTReference(): TestReference {
    return { id: 230, name: 'TFOUT', abbrev: 'TFOUT', shortAbbrev: null, groupName: 'Chemical' };
  },
  createDebrisIDReference(): TestReference {
    return { id: 240, name: 'Debris Identification', abbrev: 'DebrisID', shortAbbrev: null, groupName: 'Particle Analysis' };
  },
  createDeleteriousReference(): TestReference {
    return { id: 250, name: 'Deleterious', abbrev: 'Deleterious', shortAbbrev: null, groupName: 'Chemical' };
  },
  createRheometryReference(): TestReference {
    return { id: 270, name: 'Rheometry', abbrev: 'Rheometry', shortAbbrev: null, groupName: 'Physical' };
  },
  createDInchReference(): TestReference {
    return { id: 284, name: 'Diameter Inch', abbrev: 'DInch', shortAbbrev: null, groupName: 'Physical' };
  },
  createOilContentReference(): TestReference {
    return { id: 285, name: 'Oil Content', abbrev: 'OilContent', shortAbbrev: null, groupName: 'Chemical' };
  },
  createVPRReference(): TestReference {
    return { id: 286, name: 'Varnish Potential Rating', abbrev: 'VPR', shortAbbrev: null, groupName: 'Chemical' };
  }
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
// Deleterious Test Types
// ==========================================

/**
 * Individual trial data for deleterious analysis
 */
export interface DeleteriousTrial {
  trialNumber: number;
  testValue: number | null;
  notes: string;
  isSelected: boolean;
}

/**
 * Complete deleterious test entry form data
 */
export interface DeleteriousFormData {
  sampleId?: number;
  analystInitials: string;
  testStandard: string;
  testConditions: {
    temperature?: number;
    humidity?: number;
    equipment: string;
  };
  trials: DeleteriousTrial[];
  labComments: string;
  overallResult?: {
    averageValue: number;
    standardDeviation: number;
    coefficientOfVariation: number;
  };
}

/**
 * Deleterious form validation state
 */
export interface DeleteriousFormValidation {
  isValid: boolean;
  overallErrors: string[];
  trialErrors: Record<number, string[]>;
  hasUnsavedChanges: boolean;
}

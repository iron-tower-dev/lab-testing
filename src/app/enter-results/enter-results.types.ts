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
  TAN: { id: 1, name: 'TAN by Color Indication', abbrev: 'TAN', shortAbbrev: 'TAN', groupName: 'Chemical Analysis' },
  KF: { id: 2, name: 'Water Content by Karl Fischer', abbrev: 'KF', shortAbbrev: 'KF', groupName: 'Chemical Analysis' },
  SpecStd: { id: 3, name: 'Emission Spectroscopy - Standard', abbrev: 'SpecStd', shortAbbrev: 'SS', groupName: 'Spectroscopy' },
  SpecLrg: { id: 4, name: 'Emission Spectroscopy - Large', abbrev: 'SpecLrg', shortAbbrev: 'SL', groupName: 'Spectroscopy' },
  Vis40: { id: 5, name: 'Viscosity - 40°C', abbrev: 'Vis40', shortAbbrev: 'V40', groupName: 'Physical Properties' },
  Vis100: { id: 6, name: 'Viscosity - 100°C', abbrev: 'Vis100', shortAbbrev: 'V100', groupName: 'Physical Properties' },
  FTIR: { id: 7, name: 'FTIR', abbrev: 'FTIR', shortAbbrev: 'FTIR', groupName: 'Spectroscopy' },
  FlashPt: { id: 8, name: 'Flash Point', abbrev: 'FlashPt', shortAbbrev: 'FP', groupName: 'Physical Properties' },
  TBN: { id: 9, name: 'TBN by Auto Titration', abbrev: 'TBN', shortAbbrev: 'TBN', groupName: 'Chemical Analysis' },
  InspectFilter: { id: 10, name: 'Inspect Filter', abbrev: 'InspectFilter', shortAbbrev: 'IF', groupName: 'Visual Inspection' },
  GrPen60: { id: 11, name: 'Grease Penetration - 60°C', abbrev: 'GrPen60', shortAbbrev: 'GP60', groupName: 'Grease Testing' },
  GrDropPt: { id: 12, name: 'Grease Drop Point', abbrev: 'GrDropPt', shortAbbrev: 'GDP', groupName: 'Grease Testing' },
  Pcnt: { id: 13, name: 'Particle Count', abbrev: 'Pcnt', shortAbbrev: 'PC', groupName: 'Contamination' },
  RBOT: { id: 14, name: 'Rheology - Brookfield', abbrev: 'RBOT', shortAbbrev: 'RB', groupName: 'Physical Properties' },
  FltrRes: { id: 15, name: 'Filter Residue', abbrev: 'FltrRes', shortAbbrev: 'FR', groupName: 'Contamination' },
  Ferrography: { id: 16, name: 'Ferrography', abbrev: 'Ferrography', shortAbbrev: 'FER', groupName: 'Wear Analysis' },
  Rust: { id: 17, name: 'Rust', abbrev: 'Rust', shortAbbrev: 'RUST', groupName: 'Corrosion' },
  TFOUT: { id: 18, name: 'TFOUT', abbrev: 'TFOUT', shortAbbrev: 'TFO', groupName: 'Thermal Stability' },
  DebrisID: { id: 19, name: 'Debris Identification', abbrev: 'DebrisID', shortAbbrev: 'DID', groupName: 'Wear Analysis' },
  Deleterious: { id: 20, name: 'Deleterious', abbrev: 'Deleterious', shortAbbrev: 'DEL', groupName: 'Contamination' },
  Rheometry: { id: 21, name: 'Rheometry', abbrev: 'Rheometry', shortAbbrev: 'RHE', groupName: 'Physical Properties' },
  DInch: { id: 22, name: 'Diameter Inch', abbrev: 'DInch', shortAbbrev: 'DI', groupName: 'Physical Properties' },
  OilContent: { id: 23, name: 'Oil Content', abbrev: 'OilContent', shortAbbrev: 'OC', groupName: 'Chemical Analysis' },
  VPR: { id: 24, name: 'Varnish Potential Rating', abbrev: 'VPR', shortAbbrev: 'VPR', groupName: 'Chemical Analysis' },
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
      if (ref.id === reference.id || ref.abbrev === reference.abbrev) {
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

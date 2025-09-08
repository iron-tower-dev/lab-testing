// Test script to debug the referenceToTestCode function
import { MigrationUtils, LEGACY_TEST_CODE_TO_REFERENCE } from '../src/app/enter-results/enter-results.types.js';

console.log('=== Testing referenceToTestCode function ===');

// Get the DebrisID reference from the legacy mapping
const debrisIdReference = LEGACY_TEST_CODE_TO_REFERENCE.DebrisID;
console.log('DebrisID reference from mapping:', debrisIdReference);

// Test the conversion back to test code
const convertedCode = MigrationUtils.referenceToTestCode(debrisIdReference);
console.log('Converted test code:', convertedCode);

// Test with a mock sample data that might come from the sample service
const mockSampleReference = {
  id: 240,
  name: 'Debris Identification',
  abbrev: 'DebrisID',
  shortAbbrev: 'Debr',
  groupName: 'PHYSICAL & CHEMICAL PROPERTIES'
};

const mockConvertedCode = MigrationUtils.referenceToTestCode(mockSampleReference);
console.log('Mock sample converted code:', mockConvertedCode);

// Test with variations that might come from API
const apiReference1 = {
  id: 240,
  name: 'Debris Identification',
  abbrev: 'DebrisID',
  shortAbbrev: 'Debr',
  groupName: 'PHYSICAL & CHEMICAL PROPERTIES'
};

const apiReference2 = {
  id: 240,
  name: 'Debris Identification (Special Template)',
  abbrev: 'DebrisID',
  shortAbbrev: 'Debr',
  groupName: 'PHYSICAL & CHEMICAL PROPERTIES'
};

console.log('API Reference 1 code:', MigrationUtils.referenceToTestCode(apiReference1));
console.log('API Reference 2 code:', MigrationUtils.referenceToTestCode(apiReference2));

console.log('=== End Test ===');

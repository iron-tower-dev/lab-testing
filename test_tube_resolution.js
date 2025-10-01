// Test script to verify tube calibration resolution logic
// This simulates the fix implemented in the vis40-entry-form

console.log('Testing tube calibration resolution logic...\n');

// Mock tubeOptions (what would be loaded from the service)
const tubeOptions = [
  { value: '', label: 'Select Tube' },
  { value: 'TUBE-A1|0.0045', label: 'Tube A1 (0.0045)' },
  { value: 'TUBE-B2|0.0052', label: 'Tube B2 (0.0052)' },
  { value: 'TUBE-C3|0.0038', label: 'Tube C3 (0.0038)' },
];

// Mock reading data (what comes from the database)
const testReadings = [
  { id2: 'TUBE-A1', value2: 0.0045, trialNumber: 1, value1: 120.5, value3: 0.54225 },
  { id2: 'TUBE-B2', value2: null, trialNumber: 2, value1: 115.2, value3: 0.59904 },
  { id2: 'TUBE-C3', value2: 0.0038, trialNumber: 3, value1: 130.1, value3: 0.49438 },
];

function resolveTubeCalibration(reading, tubeOptions) {
  let tubeCalibrationValue = '';
  
  if (reading.id2 && reading.value2) {
    // If we have both equipmentId and calibration value, use them
    tubeCalibrationValue = `${reading.id2}|${reading.value2}`;
    console.log(`  Case 1: Using id2 + value2 = "${tubeCalibrationValue}"`);
  } else if (reading.id2) {
    // Find matching tube option by equipmentId
    const matchingTube = tubeOptions.find(option => 
      option.value && option.value.startsWith(`${reading.id2}|`)
    );
    tubeCalibrationValue = matchingTube?.value || '';
    console.log(`  Case 2: Found matching tube = "${tubeCalibrationValue}"`);
  }
  
  return tubeCalibrationValue;
}

// Test each reading
testReadings.forEach((reading, index) => {
  console.log(`Test ${index + 1}: Reading for ${reading.id2}`);
  const result = resolveTubeCalibration(reading, tubeOptions);
  console.log(`  Result: "${result}"`);
  
  // Check if the result would match a mat-select option
  const matchesOption = tubeOptions.some(option => option.value === result);
  console.log(`  ✅ Matches mat-select option: ${matchesOption}`);
  console.log('');
});

console.log('Test completed!');
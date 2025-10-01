# Phase 3: Test-Specific Calculations - In Progress 🚧

**Date:** 2025-09-30  
**Status:** CORE SERVICES COMPLETE, INTEGRATION IN PROGRESS

---

## ✅ Completed So Far

### 1. VB.NET Analysis Complete ✅
Analyzed legacy viscosity calculation logic from `enterResults.txt` lines 733-833:
- Time parsing function (MM.SS.HH format)
- Calculation formula (time × tube constant)
- Repeatability checking (0.35% limit)
- Q/QAG enforcement vs TRAIN warning

### 2. Base CalculationService Created ✅
**File:** `src/app/shared/services/calculation.service.ts`

Provides common calculation utilities:
- ✅ `round()` - Round to specified decimals
- ✅ `percentDifference()` - Calculate % difference
- ✅ `isInRange()` - Range validation
- ✅ `parseNumeric()` - Safe number parsing
- ✅ `validateRequiredValues()` - Presence validation
- ✅ `average()` - Array average
- ✅ `standardDeviation()` - Standard deviation
- ✅ `coefficientOfVariation()` - CV calculation
- ✅ `extractPipedValue()` - Parse "Description|Value" format
- ✅ `formatNumber()` - Display formatting
- ✅ `isValidNumber()` - Validation helper

### 3. ViscosityCalculationService Created ✅
**File:** `src/app/shared/services/viscosity-calculation.service.ts`

Viscosity-specific calculations:
- ✅ `parseTimeFormat()` - Convert MM.SS.HH → seconds
- ✅ `calculateViscosity()` - time × calibration value
- ✅ `checkRepeatability()` - 0.35% limit check
- ✅ `validateStopwatchTime()` - Time validation
- ✅ `formatTimeDisplay()` - seconds → MM.SS.HH
- ✅ `getSelectedTrialResults()` - Selected trials helper

**Interfaces:**
- ✅ `ViscosityTimeParseResult` - Time parsing result
- ✅ `ViscosityCalculationResult` - Calculation result
- ✅ `RepeatabilityResult` - Repeatability check result

---

## 🚧 In Progress

### 4. Vis40 Entry Form Integration
**File:** `src/app/enter-results/entry-form-area/components/entry-form/tests/vis40-entry-form/vis40-entry-form.ts`

**Current Status:** Stub implementation ("Coming Soon")

**Need to Add:**
- [ ] Inject ViscosityCalculationService
- [ ] Create form with 4 trial rows
- [ ] Each trial: stopwatch time, tube calibration, calculated result
- [ ] Implement calculation triggers on blur
- [ ] Display repeatability warnings
- [ ] Integrate with status workflow
- [ ] Add trial selection checkboxes
- [ ] Wire up save/load functionality

### 5. Vis100 Entry Form Integration
**Status:** Same as Vis40, needs identical implementation

---

## 📋 Implementation Plan for Forms

### Trial Data Structure:
```typescript
interface ViscosityTrial {
  trialNumber: number;
  selected: boolean;
  stopwatchTime: string | number;
  tubeCalibration: string;
  calculatedResult: number;
}
```

### Form Features:
1. **4 Trial Rows** with fields:
   - Stopwatch Time (input, accepts MM.SS.HH or decimal)
   - Tube Calibration (dropdown, piped format)
   - Result (read-only, auto-calculated)
   - Select checkbox (for repeatability)

2. **Auto-Calculation:**
   - Triggers on stopwatch time blur
   - Triggers on tube selection change
   - Parses time format automatically
   - Rounds to 2 decimal places

3. **Repeatability Display:**
   - Shows % difference when 2+ trials selected
   - Warning if > 0.35%
   - For Q/QAG: blocks save
   - For TRAIN: warning only

4. **Equipment Integration:**
   - Tube calibration dropdown from M&TE
   - Displays tube ID and constant
   - Format: "Tube 123|0.0045"

---

## 🎯 Key VB.NET Logic Replicated

### Time Parsing (Lines 734-759)
```javascript
// Input: "3.45.67"
// First dot: minutes separator
// Second dot: seconds separator
// After second dot: hundredths
// Result: (3 * 60) + 45 + (0.67) = 225.67 seconds
```

### Calculation (Lines 782-799)
```javascript
stoptime = parseTime(input);
calibration = extractPipedValue(tube);
result = round(calibration * stoptime, 2);
```

### Repeatability (Lines 811-832)
```javascript
high = max(selectedResults);
low = min(selectedResults);
percentDiff = ((high - low) / high) * 100;
if (percentDiff > 0.35) {
  alert('Repeatability percent is ' + percentDiff + ' which is above 0.35');
  if (userQual === 'Q' || userQual === 'QAG') {
    return false; // Block save
  }
}
```

---

## 📝 Next Steps

1. **Complete Vis40 Form** (30-45 min)
   - Create comprehensive form template
   - Wire up calculation service
   - Add trial management
   - Implement repeatability display

2. **Complete Vis100 Form** (15 min)
   - Copy Vis40 structure
   - Adjust for 100°C temperature
   - Test ID differences

3. **Create Unit Tests** (30 min)
   - Test time parsing edge cases
   - Test calculation accuracy
   - Test repeatability logic
   - Test validation rules

4. **Final Documentation** (15 min)
   - Create PHASE3_CALCULATIONS_IMPLEMENTED.md
   - Document usage examples
   - Add integration guide

---

## 🧪 Test Cases to Cover

### Time Parsing:
- ✅ "3.45.67" → 225.67 seconds
- ✅ "0.30.50" → 30.50 seconds
- ✅ "250.25" → 250.25 seconds (decimal)
- ✅ "300" → 300 seconds (plain)
- ✅ "" → 0 (empty)
- ✅ "." → 0 (single dot)
- ✅ "invalid" → 0 (invalid input)

### Calculation:
- ✅ 250 × 0.0045 = 1.13
- ✅ 300.5 × 0.0052 = 1.56
- ✅ 0 × 0.0045 = 0 (no time)
- ✅ 250 × 0 = 0 (no calibration)

### Repeatability:
- ✅ [1.13, 1.14] → 0.88% (within limit)
- ✅ [1.13, 1.18] → 4.24% (over limit)
- ✅ [1.13] → 0% (only one value)
- ✅ [1.13, 0, 1.14] → ignores zero

---

## 💡 Design Decisions

### 1. Time Format Handling
**Decision:** Support both MM.SS.HH and decimal entry
**Rationale:** VB.NET logic auto-detects format based on dots

### 2. Piped Value Format
**Decision:** Keep "Description|Value" format for tube calibration
**Rationale:** Matches existing M&TE dropdown data structure

### 3. Repeatability Enforcement
**Decision:** Warning for all, block for Q/QAG only
**Rationale:** Matches VB.NET behavior (lines 825-830)

### 4. Trial Selection
**Decision:** Use checkboxes for trial selection
**Rationale:** VB.NET logic checks which trials are selected (line 803)

---

## 📚 Files Created

1. ✅ `src/app/shared/services/calculation.service.ts` (149 lines)
2. ✅ `src/app/shared/services/viscosity-calculation.service.ts` (282 lines)
3. 🚧 `src/app/enter-results/.../vis40-entry-form/vis40-entry-form.ts` (in progress)
4. 🚧 `src/app/enter-results/.../vis100-entry-form/vis100-entry-form.ts` (in progress)

---

**Status:** Core calculation infrastructure is complete and ready for integration into forms!

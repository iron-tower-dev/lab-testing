# D-Inch Entry Form - Service Method Fixes

## Date
October 1, 2025

## Issues Fixed

The component was calling non-existent methods on imported services. All method calls have been corrected to use the actual service APIs.

## Problems Identified

### 1. **Wrong Service for getCurrentStatus**
**Error:** Calling `statusWorkflowService.getCurrentStatus()`  
**Issue:** This method doesn't exist on `StatusWorkflowService`  
**Location:** Line 197

### 2. **Non-Existent transitionTo Method**
**Error:** Calling `statusTransitionService.transitionTo()`  
**Issue:** This generic method doesn't exist  
**Locations:** Lines 392, 408, 421, 449

### 3. **Non-Existent saveTestReading Method**
**Error:** Calling `testReadingsService.saveTestReading()`  
**Issue:** Service has `createTestReading` and `updateTestReading`, but not `saveTestReading`  
**Location:** Line 373

## Service API Reference

### StatusTransitionService Methods

| Method | Parameters | Returns |
|--------|------------|---------|
| `getCurrentStatus()` | `sampleId, testId` | `Observable<StatusInfoResponse>` |
| `saveResults()` | `sampleId, testId, newStatus, userId` | `Observable<StatusTransitionResult>` |
| `partialSave()` | `sampleId, testId, newStatus, userId` | `Observable<StatusTransitionResult>` |
| `acceptResults()` | `sampleId, testId, newStatus, userId` | `Observable<StatusTransitionResult>` |
| `rejectResults()` | `sampleId, testId, userId` | `Observable<StatusTransitionResult>` |
| `deleteResults()` | `sampleId, testId, userId` | `Observable<StatusTransitionResult>` |
| `markMediaReady()` | `sampleId, testId, userId` | `Observable<StatusTransitionResult>` |

### TestReadingsService Methods

| Method | Parameters | Returns |
|--------|------------|---------|
| `getTestReading()` | `sampleId, testId, trialNumber` | `Observable<ApiResponse<TestReading>>` |
| `createTestReading()` | `reading: TestReadingCreate` | `Observable<ApiResponse<TestReading>>` |
| `updateTestReading()` | `sampleId, testId, trialNumber, reading` | `Observable<ApiResponse<TestReading>>` |
| `deleteTestReading()` | `sampleId, testId, trialNumber` | `Observable<ApiResponse<void>>` |

## Solutions Applied

### 1. Fixed loadCurrentStatus() (Line 192)

**Before:**
```typescript
const status = await this.statusWorkflowService
  .getCurrentStatus(info.sampleId, info.testReference.id)
  .toPromise();

if (status) {
  this.currentStatus.set(status.status || TestStatus.AWAITING);
  this.enteredBy.set(status.enteredBy || '');
}
```

**After:**
```typescript
const response = await this.statusTransitionService
  .getCurrentStatus(info.sampleId, info.testReference.id)
  .toPromise();

if (response && response.success && response.status) {
  this.currentStatus.set(response.status);
  this.enteredBy.set(response.entryId || '');
}
```

**Changes:**
- ✅ Use `statusTransitionService` instead of `statusWorkflowService`
- ✅ Check `response.success` before using data
- ✅ Use `response.entryId` instead of `status.enteredBy`

### 2. Fixed loadData() (Line 219)

**Before:**
```typescript
const existingReading = await this.testReadingsService
  .getTestReading(info.sampleId, info.testReference.id, 1)
  .toPromise();

if (existingReading) {
  this.loadFromExistingReading(existingReading);
}
```

**After:**
```typescript
const response = await this.testReadingsService
  .getTestReading(info.sampleId, info.testReference.id, 1)
  .toPromise();

if (response && response.success && response.data) {
  this.loadFromExistingReading(response.data);
}
```

**Changes:**
- ✅ Unwrap `ApiResponse<TestReading>` to get actual data
- ✅ Check `response.success` before using data

### 3. Fixed saveTestData() (Line 358)

**Before:**
```typescript
const testReading: Partial<TestReading> = { /* ... */ };
await this.testReadingsService.saveTestReading(testReading).toPromise();
```

**After:**
```typescript
const testReadingData = { /* ... */ };

// Try to update existing reading, if not found, create new one
try {
  await this.testReadingsService.updateTestReading(
    info.sampleId,
    info.testReference.id,
    1,
    testReadingData
  ).toPromise();
} catch (error: any) {
  // If update fails (reading doesn't exist), create new one
  if (error.status === 404) {
    await this.testReadingsService.createTestReading(testReadingData).toPromise();
  } else {
    throw error;
  }
}
```

**Changes:**
- ✅ Use `updateTestReading()` to update existing record
- ✅ Fall back to `createTestReading()` if record doesn't exist (404 error)
- ✅ Handle both create and update scenarios

### 4. Fixed Save Action (Line 391)

**Before:**
```typescript
await this.saveTestData(true);
await this.statusTransitionService.transitionTo(
  info.sampleId,
  info.testReference.id,
  'entered',
  this.analystInitials()
).toPromise();
this.currentStatus.set(TestStatus.ENTRY_COMPLETE);
```

**After:**
```typescript
await this.saveTestData(true);
const result = await this.statusTransitionService.saveResults(
  info.sampleId,
  info.testReference.id,
  TestStatus.ENTRY_COMPLETE,
  this.analystInitials()
).toPromise();
if (result && result.success) {
  this.currentStatus.set(result.newStatus);
}
```

**Changes:**
- ✅ Use `saveResults()` instead of non-existent `transitionTo()`
- ✅ Pass `TestStatus.ENTRY_COMPLETE` instead of string `'entered'`
- ✅ Get status from response instead of hardcoding

### 5. Fixed Accept Action (Line 407)

**Before:**
```typescript
await this.statusTransitionService.transitionTo(
  info.sampleId,
  info.testReference.id,
  'accepted',
  this.analystInitials()
).toPromise();
this.currentStatus.set(TestStatus.SAVED);
```

**After:**
```typescript
const acceptResult = await this.statusTransitionService.acceptResults(
  info.sampleId,
  info.testReference.id,
  TestStatus.SAVED,
  this.analystInitials()
).toPromise();
if (acceptResult && acceptResult.success) {
  this.currentStatus.set(acceptResult.newStatus);
}
```

**Changes:**
- ✅ Use `acceptResults()` method
- ✅ Check success before updating status
- ✅ Use response status instead of hardcoding

### 6. Fixed Reject Action (Line 418)

**Before:**
```typescript
await this.statusTransitionService.transitionTo(
  info.sampleId,
  info.testReference.id,
  'rejected',
  this.analystInitials(),
  reason
).toPromise();
this.currentStatus.set(TestStatus.AWAITING);
```

**After:**
```typescript
const rejectResult = await this.statusTransitionService.rejectResults(
  info.sampleId,
  info.testReference.id,
  this.analystInitials()
).toPromise();
if (rejectResult && rejectResult.success) {
  this.currentStatus.set(rejectResult.newStatus);
}
```

**Changes:**
- ✅ Use `rejectResults()` method
- ✅ Removed `reason` parameter (not supported by API)
- ✅ Use response status

**Note:** The rejection reason is currently prompted but not sent to the API. This may need backend support to store rejection reasons.

### 7. Fixed Delete Action (Line 432)

**Before:**
```typescript
await this.testReadingsService.deleteTestReading(
  info.sampleId,
  info.testReference.id,
  1
).toPromise();
this.clearForm();
this.currentStatus.set(TestStatus.AWAITING);
```

**After:**
```typescript
await this.testReadingsService.deleteTestReading(
  info.sampleId,
  info.testReference.id,
  1
).toPromise();
const deleteResult = await this.statusTransitionService.deleteResults(
  info.sampleId,
  info.testReference.id,
  this.analystInitials()
).toPromise();
this.clearForm();
if (deleteResult && deleteResult.success) {
  this.currentStatus.set(deleteResult.newStatus);
}
```

**Changes:**
- ✅ Added status transition for delete action
- ✅ Use response status

### 8. Fixed Media Ready Action (Line 448)

**Before:**
```typescript
await this.statusTransitionService.transitionTo(
  info.sampleId,
  info.testReference.id,
  'media-ready',
  this.analystInitials()
).toPromise();
this.currentStatus.set(TestStatus.PARTIAL);
```

**After:**
```typescript
const mediaResult = await this.statusTransitionService.markMediaReady(
  info.sampleId,
  info.testReference.id,
  this.analystInitials()
).toPromise();
if (mediaResult && mediaResult.success) {
  this.currentStatus.set(mediaResult.newStatus);
}
```

**Changes:**
- ✅ Use `markMediaReady()` method
- ✅ Use response status

## Response Type Handling

### StatusInfoResponse
```typescript
interface StatusInfoResponse {
  success: boolean;
  status?: TestStatus;
  entryId?: string | null;
  validateId?: string | null;
  entryDate?: number | null;
  valiDate?: number | null;
  error?: string;
  message?: string;
}
```

### StatusTransitionResult
```typescript
interface StatusTransitionResult {
  success: boolean;
  newStatus: TestStatus;
  message?: string;
  requiresAdditionalAction?: boolean;
}
```

### ApiResponse<T>
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  count?: number;
}
```

## Benefits of These Fixes

1. **Correct API Calls:** All service methods now match actual implementations
2. **Error Handling:** Proper response checking with `success` flags
3. **Type Safety:** Using correct interfaces and response types
4. **Status Consistency:** Status values come from API responses, not hardcoded
5. **Upsert Pattern:** Save method handles both create and update scenarios
6. **Null Safety:** Checking response validity before accessing properties

## Common Patterns

### Pattern 1: Checking API Response
```typescript
const response = await service.method().toPromise();
if (response && response.success) {
  // Use response.data or response.status
}
```

### Pattern 2: Status Transitions
```typescript
const result = await statusTransitionService.specificMethod(
  sampleId,
  testId,
  desiredStatus, // For actions that need it
  userId
).toPromise();
if (result && result.success) {
  this.currentStatus.set(result.newStatus);
}
```

### Pattern 3: Upsert (Update or Create)
```typescript
try {
  await service.updateTestReading(...).toPromise();
} catch (error: any) {
  if (error.status === 404) {
    await service.createTestReading(...).toPromise();
  } else {
    throw error;
  }
}
```

## Files Modified

1. ✅ `d-inch-entry-form.ts`
   - Fixed `loadCurrentStatus()` method
   - Fixed `loadData()` method
   - Fixed `saveTestData()` method
   - Fixed all action handlers in `onAction()` method

## Verification

### TypeScript Compilation
```bash
npx tsc --noEmit src/app/enter-results/entry-form-area/components/entry-form/tests/d-inch-entry-form/d-inch-entry-form.ts
# ✅ Compiles without errors
```

### Service Method Validation
- ✅ All called methods exist on their respective services
- ✅ All parameters match method signatures
- ✅ All return types handled correctly
- ✅ All responses unwrapped properly

## Testing Recommendations

1. **Test Save Flow:**
   - Create new reading (404 → create)
   - Update existing reading (200 → update)

2. **Test Status Transitions:**
   - Save → ENTRY_COMPLETE
   - Accept → SAVED
   - Reject → AWAITING
   - Delete → AWAITING
   - Media Ready → ENTRY_COMPLETE

3. **Test Error Handling:**
   - Network failures
   - 404 Not Found
   - 500 Server Error
   - Invalid response format

4. **Test Status Loading:**
   - Load existing status on init
   - Handle missing status
   - Handle API errors

---

**Status:** ✅ All service method calls fixed  
**Compilation:** ✅ Successful  
**API Compatibility:** ✅ Verified

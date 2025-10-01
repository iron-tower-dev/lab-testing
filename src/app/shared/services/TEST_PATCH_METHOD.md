# PATCH Method Addition - Verification

## Date
October 1, 2025

## Changes Made

### ✅ Added `patch()` method to `api.service.ts`

**Location:** `src/app/shared/services/api.service.ts` (lines 87-96)

```typescript
/**
 * Generic PATCH request (partial update)
 */
patch<T>(endpoint: string, data: any): Observable<ApiResponse<T>> {
  const url = `${this.baseUrl}/${endpoint}`;
  
  return this.http.patch<ApiResponse<T>>(url, data).pipe(
    catchError(this.handleError)
  );
}
```

## Usage in sample.service.ts

The `patch()` method is now used by two methods:

### 1. updateSampleStatus()
```typescript
updateSampleStatus(sampleId: number, status: number): Observable<ApiResponse<Sample>> {
  return this.apiService.patch<Sample>(`samples/${sampleId}/status`, { status });
}
```

**API Endpoint:** `PATCH /api/samples/:id/status`

**Example Usage:**
```typescript
// Update sample status to ASSIGNED
sampleService.updateSampleStatus(123, SampleStatus.ASSIGNED)
  .subscribe(response => {
    if (response.success) {
      console.log('Status updated:', response.data);
    }
  });
```

### 2. assignSample()
```typescript
assignSample(sampleId: number, assignedTo: string): Observable<ApiResponse<Sample>> {
  return this.apiService.patch<Sample>(`samples/${sampleId}/assign`, { assignedTo });
}
```

**API Endpoint:** `PATCH /api/samples/:id/assign`

**Example Usage:**
```typescript
// Assign sample to user
sampleService.assignSample(123, 'JDOE')
  .subscribe(response => {
    if (response.success) {
      console.log('Sample assigned:', response.data);
      // response.data.assignedTo === 'JDOE'
      // response.data.assignedDate === <current timestamp>
      // response.data.status === 20 (ASSIGNED)
    }
  });
```

## HTTP Methods Now Available in ApiService

| Method | Purpose | Idempotent | Body |
|--------|---------|------------|------|
| `GET` | Retrieve data | ✅ Yes | ❌ No |
| `POST` | Create new resource | ❌ No | ✅ Yes |
| `PUT` | Full update (replace) | ✅ Yes | ✅ Yes |
| `PATCH` | Partial update | ❌ No* | ✅ Yes |
| `DELETE` | Remove resource | ✅ Yes | ❌ No |

*PATCH can be idempotent depending on implementation

## Method Signature

```typescript
patch<T>(endpoint: string, data: any): Observable<ApiResponse<T>>
```

**Parameters:**
- `endpoint` - API endpoint path (without base URL)
- `data` - Object containing fields to update

**Returns:**
- `Observable<ApiResponse<T>>` - Observable that emits the API response

**Type Parameter:**
- `T` - Expected type of the data in the response

## Error Handling

The `patch()` method uses the same error handling as other HTTP methods:
- Catches HTTP errors via `catchError(this.handleError)`
- Provides descriptive error messages
- Logs errors to console
- Returns RxJS throwError observable

## Differences: PUT vs PATCH

### PUT (Full Update)
```typescript
// Replace entire sample object
sampleService.updateSample(123, {
  tagNumber: 'EQ-001',
  component: 'PUMP',
  location: 'PLANT-A',
  lubeType: 'ISO VG 46',
  // ... all other fields required
});
```

### PATCH (Partial Update)
```typescript
// Update only status field
sampleService.updateSampleStatus(123, SampleStatus.COMPLETED);

// Or update only assignedTo field
sampleService.assignSample(123, 'JDOE');
```

## Server-Side Implementation

The server routes in `server/api/routes/samples.ts` implement PATCH endpoints:

### PATCH /api/samples/:id/status
- Updates `status` field
- Optionally sets `returnedDate` if status is 90 (Complete)

### PATCH /api/samples/:id/assign
- Updates `assignedTo` field
- Sets `assignedDate` to current timestamp
- Updates `status` to 20 (Assigned)

## Testing Checklist

- [x] `patch()` method added to ApiService
- [x] Method signature matches other HTTP methods
- [x] Error handling implemented
- [x] Used by `updateSampleStatus()`
- [x] Used by `assignSample()`
- [ ] Unit tests for `patch()` method
- [ ] Integration tests for status update
- [ ] Integration tests for sample assignment
- [ ] Error handling tests

## Benefits

1. **RESTful Compliance** - Follows HTTP standards for partial updates
2. **Efficiency** - Only sends changed fields, not entire object
3. **API Compatibility** - Matches server PATCH endpoints
4. **Consistency** - Same pattern as GET/POST/PUT/DELETE methods
5. **Type Safety** - Generic type parameter ensures correct response types

## Example: Complete Workflow

```typescript
import { Component, inject } from '@angular/core';
import { SampleService, SampleStatus } from './shared/services/sample.service';

@Component({
  selector: 'app-sample-manager',
  template: `...`
})
export class SampleManagerComponent {
  private sampleService = inject(SampleService);
  
  assignAndStartWork(sampleId: number, technician: string) {
    // Step 1: Assign sample to technician
    this.sampleService.assignSample(sampleId, technician)
      .subscribe({
        next: (response) => {
          if (response.success) {
            console.log('Sample assigned:', response.data);
            
            // Step 2: Update status to IN_PROGRESS
            this.sampleService.updateSampleStatus(
              sampleId, 
              SampleStatus.IN_PROGRESS
            ).subscribe({
              next: (statusResponse) => {
                console.log('Status updated:', statusResponse.data);
              }
            });
          }
        },
        error: (error) => {
          console.error('Assignment failed:', error.message);
        }
      });
  }
}
```

## Verification

✅ **File:** `src/app/shared/services/api.service.ts`
- Method added at lines 87-96
- Follows same pattern as other HTTP methods
- Includes JSDoc comment

✅ **File:** `src/app/shared/services/sample.service.ts`
- `updateSampleStatus()` uses `patch()` at line 212
- `assignSample()` uses `patch()` at line 219

✅ **Compilation:** Both files compile without errors

---

## Next Steps

If you plan to add more PATCH operations, consider:

1. **Generic Partial Update Method**
```typescript
// In sample.service.ts
updateSamplePartial(
  sampleId: number, 
  updates: Partial<SampleCreate>
): Observable<ApiResponse<Sample>> {
  return this.apiService.patch<Sample>(`samples/${sampleId}`, updates);
}
```

2. **Batch PATCH Operations**
```typescript
updateMultipleSamples(
  updates: Array<{ id: number; data: Partial<SampleCreate> }>
): Observable<ApiResponse<Sample[]>> {
  return this.apiService.patch<Sample[]>('samples/batch', { updates });
}
```

3. **Optimistic Updates**
Combine PATCH with local state management for instant UI updates.

---

**Status:** ✅ Complete and ready for use

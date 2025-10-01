# Sample Service Updates - Database Schema Alignment

## Summary
Updated `sample.service.ts` to match the actual database schema (`usedLubeSamplesTable`) and server API routes.

## Date
October 1, 2025

---

## Major Changes

### 1. **Sample Interface** - Aligned with `usedLubeSamplesTable`

**Before:**
```typescript
export interface Sample {
  sampleId: number;
  sampleNumber: string;
  description?: string;
  customerName?: string;
  customerId?: number;
  dateReceived?: Date;
  sampleTypeCode?: string;
  status?: string;
  comments?: string;
  priority?: number;
  testTemplateId?: number;
  location?: string;
}
```

**After:**
```typescript
export interface Sample {
  id: number;                          // Primary key
  tagNumber: string | null;            // Equipment tag number
  component: string | null;            // Component code (FK to componentTable)
  location: string | null;             // Location code (FK to locationTable)
  lubeType: string | null;             // Lubricant type/specification
  newUsedFlag: number | null;          // 0 = new, 1 = used
  sampleDate: number | null;           // Timestamp when sample was taken
  status: number | null;               // Sample status code (10, 20, 90, etc.)
  returnedDate: number | null;         // Timestamp when completed
  priority: number | null;             // Priority (0=normal, 1=high, 2=urgent)
  assignedDate: number | null;         // Assignment timestamp
  assignedTo: string | null;           // Employee ID
  receivedDate: number | null;         // Lab receipt timestamp
  oilAdded: number | null;             // Oil added amount
  comments: string | null;             // Comments
}
```

### 2. **Added Enums for Database Constants**

```typescript
export enum SampleStatus {
  RECEIVED = 10,      // Sample received, pending assignment
  ASSIGNED = 20,      // Sample assigned to technician
  IN_PROGRESS = 30,   // Testing in progress
  COMPLETED = 90,     // All tests completed
  RETURNED = 95       // Sample returned to customer
}

export enum SampleTypeFlag {
  NEW = 0,           // New lubricant sample
  USED = 1           // Used lubricant sample
}

export enum SamplePriority {
  NORMAL = 0,        // Standard processing
  HIGH = 1,          // High priority
  URGENT = 2         // Urgent/rush processing
}
```

### 3. **New Interfaces Added**

#### ComponentInfo
```typescript
export interface ComponentInfo {
  code: string;                        // Primary key
  name: string;                        // Component display name
  description: string | null;          // Additional details
  active: number | null;               // 0 or 1 (boolean as integer)
  sortOrder: number | null;            // Display order
}
```

#### LocationInfo
```typescript
export interface LocationInfo {
  code: string;                        // Primary key
  name: string;                        // Location display name
  description: string | null;          // Additional details
  active: number | null;               // 0 or 1 (boolean as integer)
  sortOrder: number | null;            // Display order
}
```

#### SampleWithDetails
```typescript
export interface SampleWithDetails {
  sample: Sample;
  componentInfo: ComponentInfo | null;
  locationInfo: LocationInfo | null;
}
```

### 4. **Updated SampleFilter Interface**

**Before:**
```typescript
export interface SampleFilter {
  sampleNumber?: string;
  customerId?: number;
  customerName?: string;
  status?: string;
  dateReceivedFrom?: Date;
  dateReceivedTo?: Date;
  sampleTypeCode?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
```

**After:**
```typescript
export interface SampleFilter {
  status?: number | string;            // Sample status code
  assignedTo?: string;                 // Employee ID or 'unassigned'
  component?: string;                  // Component code
  location?: string;                   // Location code
  tagNumber?: string;                  // Tag number (partial match)
  lubeType?: string;                   // Lube type (partial match)
  priority?: number | string;          // Priority level
  withDetails?: boolean;               // Include joined component/location details
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
```

### 5. **Service Methods Updated**

#### getSamples()
- Now accepts filters matching API query parameters
- Returns `Sample[]` or `SampleWithDetails[]` based on `withDetails` flag
- Uses correct field names (tagNumber, component, location, etc.)

#### getSample()
- Now returns `SampleWithDetails` (includes joined component/location info)

#### searchSamples()
- Uses `tagNumber` parameter instead of generic `q` parameter

### 6. **New Service Methods Added**

```typescript
updateSampleStatus(sampleId: number, status: number): Observable<ApiResponse<Sample>>
assignSample(sampleId: number, assignedTo: string): Observable<ApiResponse<Sample>>
```

### 7. **Utility Methods Added**

```typescript
getStatusLabel(statusCode: number | null): string
getPriorityLabel(priority: number | null): string
getSampleTypeLabel(flag: number | null): string
formatTimestamp(timestamp: number | null): Date | null
getSampleDisplayName(sample: Sample): string
isAssigned(sample: Sample): boolean
isCompleted(sample: Sample): boolean
isInProgress(sample: Sample): boolean
```

### 8. **Removed Methods**

The following methods were removed as they don't exist in the actual API:
- `getSampleTests()`
- `assignTest()`
- `unassignTest()`
- `updateTestAssignment()`
- `completeTest()`
- `getSampleStatusCounts()`
- `getSamplesPendingEntry()`
- `getSamplesReadyForValidation()`
- `validateSampleNumber()`
- `getRecentSamples()`
- `duplicateSample()`
- `getSamplesByTest()`
- `getSampleDetails()`

**Note:** Test assignment functionality is handled through the `test-readings.service.ts` via the `testReadingsTable`.

---

## Database Schema Reference

### usedLubeSamplesTable (Primary Sample Table)
- **Schema File:** `server/db/schema.ts` (lines 250-272)
- **Table Name:** `used_lube_samples_table`
- **Primary Key:** `id` (auto-increment integer)

### Related Tables
- **componentTable** - Equipment component lookup
- **locationTable** - Equipment location lookup
- **testReadingsTable** - Stores test data and links samples to tests

### API Routes
- **File:** `server/api/routes/samples.ts`
- **Base Path:** `/api/samples`
- **Endpoints:**
  - `GET /` - List samples with filters
  - `GET /:id` - Get sample with details
  - `POST /` - Create sample
  - `PUT /:id` - Update sample
  - `PATCH /:id/status` - Update status
  - `PATCH /:id/assign` - Assign to user
  - `DELETE /:id` - Delete sample

---

## Migration Guide for Existing Code

### Field Name Changes

| Old Field Name | New Field Name | Notes |
|---------------|----------------|-------|
| `sampleId` | `id` | Primary key |
| `sampleNumber` | `tagNumber` | Equipment tag identifier |
| `description` | _removed_ | Use `comments` instead |
| `customerName` | _removed_ | Not in this table |
| `customerId` | _removed_ | Not in this table |
| `dateReceived` (Date) | `receivedDate` (number) | Now Unix timestamp |
| `sampleTypeCode` | `newUsedFlag` (number) | 0=new, 1=used |
| `status` (string) | `status` (number) | Now numeric code |
| `testTemplateId` | _removed_ | Not in this table |

### Type Changes

| Field | Old Type | New Type |
|-------|----------|----------|
| `status` | `string` | `number \| null` |
| `priority` | `number` | `number \| null` |
| All dates | `Date` | `number \| null` (timestamps) |

### Usage Examples

#### Creating a Sample (Before)
```typescript
const sample: SampleCreate = {
  sampleNumber: 'SAMP-001',
  description: 'Test sample',
  customerId: 123,
  dateReceived: new Date(),
  status: 'received'
};
```

#### Creating a Sample (After)
```typescript
const sample: SampleCreate = {
  tagNumber: 'EQ-001',
  component: 'PUMP',
  location: 'PLANT-A',
  lubeType: 'ISO VG 46',
  newUsedFlag: SampleTypeFlag.USED,
  sampleDate: Date.now(),
  status: SampleStatus.RECEIVED,
  priority: SamplePriority.NORMAL
};
```

#### Filtering Samples (Before)
```typescript
sampleService.getSamples({
  sampleNumber: 'SAMP-001',
  status: 'assigned',
  customerId: 123
});
```

#### Filtering Samples (After)
```typescript
sampleService.getSamples({
  tagNumber: 'EQ-001',
  status: SampleStatus.ASSIGNED,
  component: 'PUMP',
  location: 'PLANT-A',
  withDetails: true  // Include component/location info
});
```

#### Getting Sample Display Name (Before)
```typescript
const name = sample.sampleNumber;
```

#### Getting Sample Display Name (After)
```typescript
const name = sampleService.getSampleDisplayName(sample);
// or
const name = sample.tagNumber || `Sample #${sample.id}`;
```

#### Checking Sample Status (Before)
```typescript
if (sample.status === 'completed') {
  // ...
}
```

#### Checking Sample Status (After)
```typescript
if (sampleService.isCompleted(sample)) {
  // ...
}
// or
if (sample.status === SampleStatus.COMPLETED) {
  // ...
}
```

---

## Testing Checklist

- [ ] Update components using `Sample` interface
- [ ] Update components using `SampleFilter` interface
- [ ] Replace old field names with new ones
- [ ] Convert Date objects to timestamps (milliseconds)
- [ ] Update status checks to use numeric codes
- [ ] Use new utility methods for display
- [ ] Test with `withDetails: true` flag
- [ ] Verify component/location joins work
- [ ] Test sample assignment workflow
- [ ] Test status transitions

---

## Related Files to Update

The following files likely need updates to match the new schema:

1. **Components using SampleService:**
   - Search for: `sample.sampleNumber` → replace with `sample.tagNumber`
   - Search for: `sample.sampleId` → replace with `sample.id`
   - Search for: `status === 'string'` → replace with numeric comparison

2. **Type definitions:**
   - `enter-results.types.ts` - May have `SampleWithTestInfo` using old schema

3. **Components:**
   - Check any component that displays sample information
   - Update to use new field names and utility methods

4. **Tests:**
   - Update all unit tests with new interface structure
   - Update mock data to match database schema

---

## Benefits of This Update

1. **Type Safety:** Interfaces now match actual database schema
2. **API Compatibility:** Methods match server endpoints exactly
3. **Consistency:** Uses same field names as backend
4. **Utility Methods:** Helper functions for common operations
5. **Documentation:** Inline comments explain each field
6. **Enums:** Constants for status codes and flags
7. **Null Safety:** Proper `null` handling throughout

---

## Notes

- Timestamps are stored as Unix timestamps (milliseconds since epoch)
- Status codes are integers, not strings
- Component and location are foreign keys to lookup tables
- The `testReadingsTable` handles sample-to-test relationships
- Use `withDetails: true` to get joined component/location names

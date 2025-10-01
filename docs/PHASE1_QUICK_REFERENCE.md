# Phase 1 Tables - Quick Reference Card

---

## Table Overview

| Table | Purpose | Records | Status |
|-------|---------|---------|--------|
| `lube_tech_qualification_table` | User test qualifications | Variable | ✅ Ready |
| `used_lube_samples_table` | Master sample records | Variable | ✅ Ready |
| `component_table` | Component lookup | 10 | ✅ Seeded |
| `location_table` | Location lookup | 10 | ✅ Seeded |

---

## Qualification Levels

| Level | Code | Description | Hierarchy |
|-------|------|-------------|-----------|
| Trainee | `TRAIN` | Can enter data under supervision | 1 |
| Qualified | `Q` | Can enter data independently | 2 |
| QAG | `QAG` | Can validate/approve data | 3 |
| Microscopy Expert | `MicrE` | Specialized microscopy qual | 2 |

---

## Component Codes

| Code | Name | Description |
|------|------|-------------|
| `ENG` | Engine | Main engine component |
| `GBOX` | Gearbox | Transmission/gearbox |
| `HYD` | Hydraulic System | Hydraulic system |
| `TRANS` | Transmission | Transmission component |
| `DIFF` | Differential | Differential component |
| `COMP` | Compressor | Air compressor |
| `PUMP` | Pump | Pump component |
| `GEN` | Generator | Generator component |
| `COOL` | Cooling System | Cooling system |
| `OTHER` | Other | Miscellaneous |

---

## Location Codes

| Code | Name | Description |
|------|------|-------------|
| `BLDG1` | Building 1 | Main building facility |
| `BLDG2` | Building 2 | Secondary building |
| `SHOP` | Shop | Maintenance shop |
| `YARD` | Yard | Outdoor yard area |
| `DOCK` | Dock | Loading dock area |
| `LAB` | Laboratory | Lab testing facility |
| `WAREHOUSE` | Warehouse | Storage warehouse |
| `FIELD` | Field | Field location |
| `REMOTE` | Remote Site | Remote site location |
| `OTHER` | Other | Unspecified location |

---

## Import Paths

```typescript
// Schema tables
import { 
  lubeTechQualificationTable,
  usedLubeSamplesTable,
  componentTable,
  locationTable 
} from '@/server/db/schema';

// Seed data
import { componentSeedData, type ComponentCode } from '@/server/db/seeds/components';
import { locationSeedData, type LocationCode } from '@/server/db/seeds/locations';
import { 
  QUALIFICATION_LEVELS, 
  type QualificationLevel,
  hasQualificationLevel 
} from '@/server/db/seeds/qualifications';
```

---

## Common Queries

### Check User Qualification
```typescript
const qual = await db
  .select()
  .from(lubeTechQualificationTable)
  .where(and(
    eq(lubeTechQualificationTable.employeeId, userId),
    eq(lubeTechQualificationTable.testStandId, testStandId),
    eq(lubeTechQualificationTable.active, 1)
  ))
  .limit(1);

const isQualified = qual.length > 0 && 
  hasQualificationLevel(qual[0].qualificationLevel, QUALIFICATION_LEVELS.Q);
```

### Get Sample with Details
```typescript
const sample = await db
  .select({
    id: usedLubeSamplesTable.id,
    tagNumber: usedLubeSamplesTable.tagNumber,
    componentName: componentTable.name,
    locationName: locationTable.name,
    lubeType: usedLubeSamplesTable.lubeType,
    status: usedLubeSamplesTable.status,
  })
  .from(usedLubeSamplesTable)
  .leftJoin(componentTable, eq(usedLubeSamplesTable.component, componentTable.code))
  .leftJoin(locationTable, eq(usedLubeSamplesTable.location, locationTable.code))
  .where(eq(usedLubeSamplesTable.id, sampleId));
```

### Get Active Components
```typescript
const components = await db
  .select()
  .from(componentTable)
  .where(eq(componentTable.active, 1))
  .orderBy(asc(componentTable.sortOrder));
```

---

## API Endpoint Suggestions

```typescript
// Qualifications
GET    /api/qualifications/:employeeId
GET    /api/qualifications/:employeeId/:testStandId
POST   /api/qualifications
PUT    /api/qualifications/:id
DELETE /api/qualifications/:id

// Samples
GET    /api/samples?status=10&assignedTo=USER01
GET    /api/samples/:id
POST   /api/samples
PUT    /api/samples/:id
PATCH  /api/samples/:id/status

// Lookups
GET    /api/components
GET    /api/locations
```

---

## Migration & Seeding

```bash
# Apply migration
sqlite3 db.sqlite < drizzle/0001_phase1_critical_tables.sql

# Seed lookup tables
npm run seed

# Verify
sqlite3 db.sqlite "SELECT COUNT(*) FROM component_table;"  # Should be 10
sqlite3 db.sqlite "SELECT COUNT(*) FROM location_table;"   # Should be 10
```

---

## Status Codes (Sample Workflow)

| Status | Description |
|--------|-------------|
| 10 | Received/Pending |
| 20 | Assigned |
| 30 | In Progress |
| 40 | Testing Complete |
| 50 | Validated |
| 90 | Returned/Complete |

---

## Files Reference

| File | Purpose |
|------|---------|
| `server/db/schema.ts` | Table definitions |
| `drizzle/0001_phase1_critical_tables.sql` | Migration SQL |
| `server/db/seeds/components.ts` | Component seed data |
| `server/db/seeds/locations.ts` | Location seed data |
| `server/db/seeds/qualifications.ts` | Qualification constants |
| `server/db/seeds/phase1.seed.ts` | Seed functions |
| `docs/PHASE1_IMPLEMENTATION_COMPLETE.md` | Full documentation |
| `docs/MISSING_DATABASE_TABLES.md` | Gap analysis |

---

_Last Updated: 2025-09-30_

# Missing Database Tables Analysis
## Tables Referenced in VB.NET ASP Not Yet in schema.ts

**Generated:** 2025-09-30  
**Purpose:** Identify all SQL Server tables used in legacy code that need to be added to Drizzle schema

---

## Current Schema Status

### ✅ **Tables Already in schema.ts:**
1. `usersTable` (users_table)
2. `particleSubTypeTable` (particle_sub_type_table) 
3. `particleSubTypeCategoryDefinitionTable` (particle_sub_type_category_definition_table)
4. `particleSubTypeDefinitionTable` (particle_sub_type_definition_table)
5. `particleTypeTable` (particle_type_table)
6. `particleTypeDefinitionTable` (particle_type_definition_table)
7. `testTable` (test_table)
8. `testListTable` (test_list_table)
9. `testReadingsTable` (test_readings_table)
10. `testScheduleTable` (test_schedule_table)
11. `testScheduleRuleTable` (test_schedule_rule_table)
12. `testScheduleTestTable` (test_schedule_test_table)
13. `testStandTable` (test_stand_table)
14. `testStandardsTable` (test_standards_table)
15. `testMethodConfigTable` (test_method_config_table)
16. `testFormDataTable` (test_form_data_table)
17. `lubeSamplingPointTable` (lube_sampling_point_table)

---

## ❌ **Missing Tables - CRITICAL**

### 1. `LubeTechQualification` ⚠️ HIGHEST PRIORITY
**Referenced in:** saveResultsFunctions.txt (line 92)

**Usage:**
```vbscript
sql="SELECT qualificationLevel FROM LubeTechQualification 
     INNER JOIN Test ON LubeTechQualification.testStandID = Test.testStandID 
     WHERE id=" & strTestID & " AND employeeid='" & curEntryID & "'"
```

**Purpose:** Stores user qualifications for test authorization

**Schema Required:**
```typescript
export const lubeTechQualificationTable = sqliteTable('lube_tech_qualification_table', {
  id: int().primaryKey({ autoIncrement: true }),
  employeeId: text().notNull(),
  testStandId: int().notNull(),
  qualificationLevel: text().notNull(), // 'TRAIN', 'Q', 'QAG', 'MicrE'
  certifiedDate: int({ mode: 'timestamp' }).notNull(),
  certifiedBy: text(),
  expirationDate: int({ mode: 'timestamp' }),
  active: int({ mode: 'boolean' }).default(true),
  notes: text(),
}, (table) => ({
  testStandIdFk: foreignKey({
    columns: [table.testStandId],
    foreignColumns: [testStandTable.id],
    name: 'lube_tech_qual_teststand_fk'
  }),
  uniqueEmpTeststand: uniqueIndex('unique_emp_teststand_idx').on(
    table.employeeId,
    table.testStandId
  ),
}));
```

**Blocks:** All authorization features (Gap 1)

---

### 2. `emSpectro` (Emission Spectroscopy)
**Referenced in:** saveResultsFunctions.txt (lines 29, 438, 477, 483, 512)

**Usage:**
```vbscript
sql="DELETE FROM emspectro WHERE id=" & sid & " AND testid=" & tid & " AND trialnum = " & iloop
sql="INSERT INTO emSpectro " & strFields & " VALUES " & strValues
sql="UPDATE emSpectro SET " & strSet & " WHERE " & strWhere
```

**Purpose:** Stores spectroscopy results for tests 30 (Standard) and 40 (Large Spec)

**Schema Required:**
```typescript
export const emSpectroTable = sqliteTable('em_spectro_table', {
  id: int().notNull(), // sampleId
  testId: int().notNull(),
  trialNum: int().notNull(),
  na: real(), // Sodium
  mo: real(), // Molybdenum
  mg: real(), // Magnesium
  p: real(),  // Phosphorus
  b: real(),  // Boron
  h: real(),  // Hydrogen
  cr: real(), // Chromium
  ca: real(), // Calcium
  ni: real(), // Nickel
  ag: real(), // Silver
  cu: real(), // Copper
  sn: real(), // Tin
  al: real(), // Aluminum
  mn: real(), // Manganese
  pb: real(), // Lead
  fe: real(), // Iron
  si: real(), // Silicon
  ba: real(), // Barium
  zn: real(), // Zinc
  trialDate: int({ mode: 'timestamp' }),
}, (table) => ({
  pk: uniqueIndex('em_spectro_pk').on(table.id, table.testId, table.trialNum),
}));
```

**Blocks:** Test types 30 & 40 (Spectroscopy)

---

### 3. `FTIR` (Fourier Transform Infrared)
**Referenced in:** saveResultsFunctions.txt (lines 32, 440, 533, 539, 568)

**Usage:**
```vbscript
sql="DELETE FROM ftir WHERE sampleid=" & sid
sql="INSERT INTO FTIR " & strFields & " VALUES " & strValues
sql="UPDATE FTIR SET " & strSet & " WHERE " & strWhere
```

**Purpose:** Stores FTIR test results for test 70

**Schema Required:**
```typescript
export const ftirTable = sqliteTable('ftir_table', {
  sampleId: int().primaryKey(),
  contam: real(),         // Delta area
  antiOxidant: real(),    // Anti-oxidant
  oxidation: real(),      // Oxidation
  h2o: real(),            // Water
  zddp: real(),           // Anti-wear (ZDDP)
  soot: real(),           // Soot
  fuelDilution: real(),   // Dilution
  mixture: real(),        // Mixture
  nlgi: real(),           // Weak acid/NLGI
});
```

**Blocks:** Test type 70 (FTIR)

---

### 4. `ParticleCount`
**Referenced in:** saveResultsFunctions.txt (lines 35, 442, 589, 595, 623)

**Usage:**
```vbscript
sql="DELETE FROM particlecount WHERE id=" & sid
sql="INSERT INTO ParticleCount " & strFields & " VALUES " & strValues
sql="UPDATE ParticleCount SET " & strSet & " WHERE " & strWhere
```

**Purpose:** Stores particle count test results for test 160

**Schema Required:**
```typescript
export const particleCountTable = sqliteTable('particle_count_table', {
  id: int().primaryKey(), // sampleId
  micron5_10: int(),      // 5-10 micron count
  micron10_15: int(),     // 10-15 micron count
  micron15_25: int(),     // 15-25 micron count
  micron25_50: int(),     // 25-50 micron count
  micron50_100: int(),    // 50-100 micron count
  micron100: int(),       // >100 micron count
  testDate: int({ mode: 'timestamp' }),
  nasClass: text(),       // NAS classification result
});
```

**Blocks:** Test type 160 (Particle Count)

---

### 5. `UsedLubeSamples` ⚠️ HIGH PRIORITY
**Referenced in:** enterResults.txt (line 164), saveResultsFunctions.txt (line 422)

**Usage:**
```vbscript
sql="SELECT u.lubeType,u.newusedflag,p.qualityClass,c.name AS compname,l.name AS locname 
     FROM UsedLubeSamples u LEFT OUTER JOIN 
     Lube_Sampling_Point p ON u.tagNumber = p.tagNumber..."

sql="Update UsedLubeSamples set status = 90, returnedDate = GetDate() WHERE sampleid=" & sid
```

**Purpose:** Master sample table - contains all sample information

**Schema Required:**
```typescript
export const usedLubeSamplesTable = sqliteTable('used_lube_samples_table', {
  id: int().primaryKey({ autoIncrement: true }),
  tagNumber: text(),
  component: text(),
  location: text(),
  lubeType: text(),
  newUsedFlag: int(), // 0 = new, 1 = used
  sampleDate: int({ mode: 'timestamp' }),
  status: int(), // Sample status code
  returnedDate: int({ mode: 'timestamp' }),
  priority: int(),
  assignedDate: int({ mode: 'timestamp' }),
  assignedTo: text(),
  receivedDate: int({ mode: 'timestamp' }),
  oilAdded: real(),
  comments: text(),
}, (table) => ({
  tagIdx: index('used_lube_samples_tag_idx').on(table.tagNumber),
  statusIdx: index('used_lube_samples_status_idx').on(table.status),
}));
```

**Blocks:** All sample-related functionality

---

### 6. `Component`
**Referenced in:** enterResults.txt (line 167)

**Usage:**
```vbscript
sql=sql&"Component c ON u.component = c.code LEFT OUTER JOIN "
```

**Purpose:** Lookup table for equipment component codes

**Schema Required:**
```typescript
export const componentTable = sqliteTable('component_table', {
  code: text().primaryKey(),
  name: text().notNull(),
  description: text(),
  active: int({ mode: 'boolean' }).default(true),
  sortOrder: int(),
});
```

**Blocks:** Component name display

---

### 7. `Location`
**Referenced in:** enterResults.txt (line 168)

**Usage:**
```vbscript
sql=sql&"Location l ON u.location = l.code "
```

**Purpose:** Lookup table for equipment location codes

**Schema Required:**
```typescript
export const locationTable = sqliteTable('location_table', {
  code: text().primaryKey(),
  name: text().notNull(),
  description: text(),
  active: int({ mode: 'boolean' }).default(true),
  sortOrder: int(),
});
```

**Blocks:** Location name display

---

### 8. `M_And_T_Equip` (M&TE Equipment)
**Referenced in:** enterResultsFunctions.txt (lines 920, 929, 933)

**Usage:**
```vbscript
sql="select equipname,duedate from M_And_T_Equip 
     where EquipType='THERMOMETER' and testid=" & tid
```

**Purpose:** Measurement & Test Equipment tracking

**Schema Required:**
```typescript
export const mteEquipTable = sqliteTable('mte_equip_table', {
  id: int().primaryKey({ autoIncrement: true }),
  equipName: text().notNull(),
  equipType: text().notNull(), // 'THERMOMETER', 'TIMER', 'BAROMETER', 'VISCOMETER', etc.
  testId: int(),
  dueDate: int({ mode: 'timestamp' }),
  calibrationDate: int({ mode: 'timestamp' }),
  exclude: int({ mode: 'boolean' }),
  serialNumber: text(),
  manufacturer: text(),
  model: text(),
  calibrationValue: real(), // For viscometer tubes
}, (table) => ({
  equipTypeIdx: index('mte_equip_type_idx').on(table.equipType),
  testIdIdx: index('mte_equip_test_idx').on(table.testId),
  dueDateIdx: index('mte_equip_due_idx').on(table.dueDate),
}));
```

**Blocks:** M&TE equipment selection (Gap 4)

---

## ❌ **Missing Tables - MEDIUM PRIORITY**

### 9. `vwTestScheduleDefinitionBySample` (View)
**Referenced in:** enterResults.txt (line 186)

**Usage:**
```vbscript
sql="SELECT details FROM vwTestScheduleDefinitionBySample 
     WHERE sampleid=" & strSampleID & " AND testid=70 ORDER BY TestID"
```

**Purpose:** View that returns test schedule details for a specific sample

**Note:** This is a VIEW, not a table. May need to be replaced with a query joining multiple tables.

---

### 10. `vwTestScheduleDefinitionByMaterial` (View)
**Referenced in:** enterResults.txt (line 188)

**Usage:**
```vbscript
sql="SELECT details FROM vwTestScheduleDefinitionByMaterial 
     WHERE material='" & strLubeType & "' AND testid=70"
```

**Purpose:** View that returns test schedule details for a material type

**Note:** This is a VIEW, not a table. May need to be replaced with a query.

---

### 11. `LUBELAB.LUBELAB_EQUIPMENT_V` (External View)
**Referenced in:** enterResults.txt (line 216)

**Usage:**
```vbscript
sql = "SELECT EQID FROM LUBELAB.LUBELAB_EQUIPMENT_V WHERE APPLID=" & strApplID
```

**Purpose:** External SWMS equipment view for CNR integration

**Note:** This is an external view from another database (dbSWMS_ConnectionString). May need API integration instead of direct DB access.

---

## Implementation Priority

### Phase 1: CRITICAL (Week 1-2)
Must be implemented immediately:

1. ✅ **LubeTechQualification** - Required for Gap 1 (Authorization)
2. ✅ **UsedLubeSamples** - Core sample table
3. ✅ **Component** - Component lookups
4. ✅ **Location** - Location lookups

**Impact:** Blocks all authorization and sample selection features

---

### Phase 2: HIGH (Week 3-4)
Required for test type implementations:

5. ✅ **emSpectro** - Tests 30/40
6. ✅ **FTIR** - Test 70
7. ✅ **ParticleCount** - Test 160
8. ✅ **M_And_T_Equip** - Equipment selection

**Impact:** Blocks specific test types

---

### Phase 3: MEDIUM (Week 5-6)
Support features:

9. ⚠️ **vwTestScheduleDefinitionBySample** - May need query replacement
10. ⚠️ **vwTestScheduleDefinitionByMaterial** - May need query replacement
11. ⚠️ **LUBELAB_EQUIPMENT_V** - External integration

**Impact:** Blocks some advanced features

---

## Complete Schema Addition Template

### File: `server/db/schema.ts`

Add these exports after the existing tables:

```typescript
// ============================================================================
// AUTHORIZATION & QUALIFICATION
// ============================================================================

export const lubeTechQualificationTable = sqliteTable('lube_tech_qualification_table', {
  id: int().primaryKey({ autoIncrement: true }),
  employeeId: text().notNull(),
  testStandId: int().notNull(),
  qualificationLevel: text().notNull(),
  certifiedDate: int({ mode: 'timestamp' }).notNull(),
  certifiedBy: text(),
  expirationDate: int({ mode: 'timestamp' }),
  active: int({ mode: 'boolean' }).default(true),
  notes: text(),
}, (table) => ({
  testStandIdFk: foreignKey({
    columns: [table.testStandId],
    foreignColumns: [testStandTable.id],
    name: 'lube_tech_qual_teststand_fk'
  }),
  uniqueEmpTeststand: uniqueIndex('unique_emp_teststand_idx').on(
    table.employeeId,
    table.testStandId
  ),
}));

// ============================================================================
// SAMPLES & LOOKUPS
// ============================================================================

export const usedLubeSamplesTable = sqliteTable('used_lube_samples_table', {
  id: int().primaryKey({ autoIncrement: true }),
  tagNumber: text(),
  component: text(),
  location: text(),
  lubeType: text(),
  newUsedFlag: int(),
  sampleDate: int({ mode: 'timestamp' }),
  status: int(),
  returnedDate: int({ mode: 'timestamp' }),
  priority: int(),
  assignedDate: int({ mode: 'timestamp' }),
  assignedTo: text(),
  receivedDate: int({ mode: 'timestamp' }),
  oilAdded: real(),
  comments: text(),
}, (table) => ({
  tagIdx: index('used_lube_samples_tag_idx').on(table.tagNumber),
  statusIdx: index('used_lube_samples_status_idx').on(table.status),
}));

export const componentTable = sqliteTable('component_table', {
  code: text().primaryKey(),
  name: text().notNull(),
  description: text(),
  active: int({ mode: 'boolean' }).default(true),
  sortOrder: int(),
});

export const locationTable = sqliteTable('location_table', {
  code: text().primaryKey(),
  name: text().notNull(),
  description: text(),
  active: int({ mode: 'boolean' }).default(true),
  sortOrder: int(),
});

// ============================================================================
// TEST-SPECIFIC DATA TABLES
// ============================================================================

export const emSpectroTable = sqliteTable('em_spectro_table', {
  id: int().notNull(),
  testId: int().notNull(),
  trialNum: int().notNull(),
  na: real(),
  mo: real(),
  mg: real(),
  p: real(),
  b: real(),
  h: real(),
  cr: real(),
  ca: real(),
  ni: real(),
  ag: real(),
  cu: real(),
  sn: real(),
  al: real(),
  mn: real(),
  pb: real(),
  fe: real(),
  si: real(),
  ba: real(),
  zn: real(),
  trialDate: int({ mode: 'timestamp' }),
}, (table) => ({
  pk: uniqueIndex('em_spectro_pk').on(table.id, table.testId, table.trialNum),
}));

export const ftirTable = sqliteTable('ftir_table', {
  sampleId: int().primaryKey(),
  contam: real(),
  antiOxidant: real(),
  oxidation: real(),
  h2o: real(),
  zddp: real(),
  soot: real(),
  fuelDilution: real(),
  mixture: real(),
  nlgi: real(),
});

export const particleCountTable = sqliteTable('particle_count_table', {
  id: int().primaryKey(),
  micron5_10: int(),
  micron10_15: int(),
  micron15_25: int(),
  micron25_50: int(),
  micron50_100: int(),
  micron100: int(),
  testDate: int({ mode: 'timestamp' }),
  nasClass: text(),
});

// ============================================================================
// M&TE EQUIPMENT
// ============================================================================

export const mteEquipTable = sqliteTable('mte_equip_table', {
  id: int().primaryKey({ autoIncrement: true }),
  equipName: text().notNull(),
  equipType: text().notNull(),
  testId: int(),
  dueDate: int({ mode: 'timestamp' }),
  calibrationDate: int({ mode: 'timestamp' }),
  exclude: int({ mode: 'boolean' }),
  serialNumber: text(),
  manufacturer: text(),
  model: text(),
  calibrationValue: real(),
}, (table) => ({
  equipTypeIdx: index('mte_equip_type_idx').on(table.equipType),
  testIdIdx: index('mte_equip_test_idx').on(table.testId),
  dueDateIdx: index('mte_equip_due_idx').on(table.dueDate),
}));
```

---

## Migration Notes

### From SQL Server to SQLite

**Key Differences:**
1. **Data Types:**
   - `nvarchar` → `text()`
   - `float`/`real` → `real()`
   - `datetime` → `int({ mode: 'timestamp' })`
   - `bit` → `int({ mode: 'boolean' })`
   - `smallint`/`tinyint` → `int()`

2. **Auto-increment:**
   - SQL Server: `IDENTITY(1,1)`
   - SQLite: `autoIncrement: true`

3. **Constraints:**
   - Use Drizzle's `uniqueIndex()` for unique constraints
   - Use `foreignKey()` for FK relationships
   - Use `index()` for performance indexes

4. **Views:**
   - SQL Server views need to be replaced with queries or materialized in tables

---

## Testing Checklist

After adding tables, test:
- [ ] Schema compiles without errors
- [ ] Database migrations run successfully
- [ ] Can insert sample data
- [ ] Can query from new tables
- [ ] Foreign key relationships work
- [ ] Indexes improve query performance
- [ ] API endpoints can access new tables

---

## Summary

**Total Tables Referenced:** 11  
**Already in schema.ts:** 17  
**Missing (Critical):** 8  
**Missing (Medium):** 3 (views/external)

**Estimated Time to Add:**
- Phase 1 (Critical): 2-3 days
- Phase 2 (High): 2-3 days
- Phase 3 (Medium): 1-2 days (may require design decisions)

**Next Steps:**
1. Add Phase 1 tables to schema.ts
2. Create seed data for lookup tables
3. Create API endpoints for new tables
4. Update Gap 1 implementation to use LubeTechQualification
5. Test authorization flow
6. Proceed to Phase 2 tables as needed for test types

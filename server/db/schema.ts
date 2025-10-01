import { int, real, sqliteTable, text, uniqueIndex, index, foreignKey } from 'drizzle-orm/sqlite-core';

export const usersTable = sqliteTable('users_table', {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  age: int().notNull(),
  email: text().notNull().unique(),
});

export const particleSubTypeTable = sqliteTable('particle_sub_type_table', {
  sampleId: int().notNull(),
  testId: int().notNull(),
  particleTypeDefinitionId: int().notNull(),
  particleSubTypeCategory: int().notNull(),
  value: int(),
});

export const particleSubTypeCategoryDefinitionTable = sqliteTable(
  'particle_sub_type_category_definition_table',
  {
    id: int().primaryKey({ autoIncrement: true }),
    description: text().notNull(),
    active: text(),
    sortOrder: int().notNull(),
  },
);

export const particleSubTypeDefinitionTable = sqliteTable('particle_sub_type_definition_table', {
  particleSubTypeCategoryId: int().notNull(),
  value: int().notNull(),
  description: text().notNull(),
  active: text(),
  sortOrder: int(),
});

export const particleTypeTable = sqliteTable('particle_type_table', {
  sampleId: int().notNull(),
  testId: int().notNull(),
  particleTypeDefinitionId: int().notNull(),
  status: text(),
  comments: text(),
});

export const particleTypeDefinitionTable = sqliteTable('particle_type_definition_table', {
  id: int().primaryKey({ autoIncrement: true }),
  type: text().notNull(),
  description: text().notNull(),
  image1: text().notNull(),
  image2: text().notNull(),
  active: text(),
  sortOrder: int(),
});

export const testTable = sqliteTable('test_table', {
  id: int().primaryKey({ autoIncrement: true }),
  name: text(),
  testStandId: int(),
  sampleVolumeRequired: int(),
  exclude: text(),
  abbrev: text(),
  displayedGroupId: int(),
  groupName: text(),
  lab: int({ mode: 'boolean' }),
  schedule: int({ mode: 'boolean' }),
  shortAbbrev: text(),
});

export const testListTable = sqliteTable('test_list_table', {
  status: int(),
  description: text(),
});

export const testReadingsTable = sqliteTable('test_readings_table', {
  sampleId: int(),
  testId: int(),
  trialNumber: int(),
  value1: real(),
  value2: real(),
  value3: real(),
  trialCalc: real(),
  id1: text(),
  id2: text(),
  id3: text(),
  trialComplete: int({ mode: 'boolean' }),
  status: text(),
  schedType: text(),
  entryId: text(),
  validateId: text(),
  entryDate: int({ mode: 'timestamp' }),
  valiDate: int({ mode: 'timestamp' }),
  mainComments: text(),
});

export const testScheduleTable = sqliteTable('test_schedule_table', {
  id: int().primaryKey({ autoIncrement: true }),
  tag: text(),
  componentCode: text(),
  locationCode: text(),
  material: text(),
});

export const testScheduleRuleTable = sqliteTable('test_schedule_rule_table', {
  id: int().primaryKey({ autoIncrement: true }),
  groupId: int().notNull(),
  testId: int().notNull(),
  ruleTestId: int().notNull(),
  upperRule: int().notNull(),
  ruleAction: text(),
});

export const testScheduleTestTable = sqliteTable('test_schedule_test_table', {
  id: int().primaryKey({ autoIncrement: true }),
  testScheduleId: int().notNull(),
  testId: int().notNull(),
  testInterval: int(),
  minimumInterval: int(),
  duringMonth: int(),
  details: text(),
});

export const testStandTable = sqliteTable('test_stand_table', {
  id: int().notNull(),
  name: text(),
});

// Test standards for each test type (replaces hardcoded values)
export const testStandardsTable = sqliteTable('test_standards_table', {
  id: int().primaryKey({ autoIncrement: true }),
  testId: int().notNull(), // References testTable.id
  standardCode: text().notNull(), // e.g., "ASTM-D664", "IP-135"
  standardName: text().notNull(), // e.g., "ASTM D664 - Potentiometric"
  description: text(),
  isDefault: int({ mode: 'boolean' }).default(false),
  active: int({ mode: 'boolean' }).default(true),
  sortOrder: int().default(0),
}, (table) => ({
  // Foreign key constraint referencing testTable
  testIdFk: foreignKey({
    columns: [table.testId],
    foreignColumns: [testTable.id],
    name: 'test_standards_test_id_fk'
  }).onDelete('cascade'),
  
  // Unique index on (testId, standardCode) to prevent duplicate standards for same test
  testStandardUniqueIdx: uniqueIndex('test_standards_test_code_idx').on(
    table.testId,
    table.standardCode
  ),
  
  // Non-unique index on testId for fast lookups
  testIdIdx: index('test_standards_test_id_idx').on(table.testId),
  
  // Non-unique index on standardCode for fast lookups
  standardCodeIdx: index('test_standards_standard_code_idx').on(table.standardCode),
}));

// Test method configurations (procedures, parameters)
export const testMethodConfigTable = sqliteTable('test_method_config_table', {
  id: int().primaryKey({ autoIncrement: true }),
  testId: int().notNull().references(() => testTable.id), // References testTable.id with FK constraint
  configKey: text().notNull(), // e.g., "solvents", "indicators", "temperature_range"
  configValue: text().notNull(), // JSON string for complex values
  description: text(),
  active: int({ mode: 'boolean' }).default(true),
}, (table) => ({
  // Unique index on (testId, configKey) to prevent duplicate config keys per test
  testConfigUniqueIdx: uniqueIndex('test_method_config_test_key_idx').on(
    table.testId,
    table.configKey
  ),
  
  // Regular index on active for faster lookups of active/inactive configs
  activeIdx: index('test_method_config_active_idx').on(table.active),
}));

// Form data storage for test entries
export const testFormDataTable = sqliteTable('test_form_data_table', {
  id: int().primaryKey({ autoIncrement: true }),
  sampleId: int().notNull(),
  testId: int().notNull(),
  formData: text().notNull(), // JSON string of form data
  status: text().default('draft'), // draft, submitted, validated
  createdBy: text(),
  createdAt: int({ mode: 'timestamp' }),
  updatedAt: int({ mode: 'timestamp' }),
  version: int().default(1),
}, (table) => ({
  // Unique constraint on (sampleId, testId, version) to prevent race conditions
  sampleTestVersionIdx: uniqueIndex('sample_test_version_idx').on(
    table.sampleId,
    table.testId, 
    table.version
  ),
}));

export const lubeSamplingPointTable = sqliteTable('lube_sampling_point_table', {
  id: int().primaryKey({ autoIncrement: true }),
  tagNumber: text(),
  component: text(),
  location: text(),
  lubeClassItemNumber: text(),
  lubeQuantityRequired: real(),
  lubeUnitsOfMeasure: text(),
  testCategory: text(),
  qualityClass: text(),
  pricingPackageId: int(),
  testPricesId: int(),
  lastSampleDate: int({ mode: 'timestamp' }),
  changeTaskNumber: text(),
  changeIntervalType: text(),
  changeIntervalNumber: int(),
  lastChangeDate: int({ mode: 'timestamp' }),
  inProgram: int({ mode: 'boolean' }),
  testScheduled: int({ mode: 'boolean' }),
  applId: int(),
  materialInfo: text(),
});

// ============================================================================
// PHASE 1: CRITICAL TABLES - Authorization & Sample Management
// ============================================================================

// User qualifications for test authorization
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
  testStandIdIdx: index('lube_tech_qual_teststand_idx').on(table.testStandId),
  employeeIdIdx: index('lube_tech_qual_employee_idx').on(table.employeeId),
  activeIdx: index('lube_tech_qual_active_idx').on(table.active),
}));

// Master sample table - contains all sample information
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
  componentIdx: index('used_lube_samples_component_idx').on(table.component),
  locationIdx: index('used_lube_samples_location_idx').on(table.location),
  assignedToIdx: index('used_lube_samples_assigned_idx').on(table.assignedTo),
}));

// Component lookup table - equipment component codes
export const componentTable = sqliteTable('component_table', {
  code: text().primaryKey(),
  name: text().notNull(),
  description: text(),
  active: int({ mode: 'boolean' }).default(true),
  sortOrder: int(),
}, (table) => ({
  activeIdx: index('component_active_idx').on(table.active),
  sortOrderIdx: index('component_sort_idx').on(table.sortOrder),
}));

// Location lookup table - equipment location codes
export const locationTable = sqliteTable('location_table', {
  code: text().primaryKey(),
  name: text().notNull(),
  description: text(),
  active: int({ mode: 'boolean' }).default(true),
  sortOrder: int(),
}, (table) => ({
  activeIdx: index('location_active_idx').on(table.active),
  sortOrderIdx: index('location_sort_idx').on(table.sortOrder),
}));

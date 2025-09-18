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
  testId: int().notNull(), // References testTable.id
  configKey: text().notNull(), // e.g., "solvents", "indicators", "temperature_range"
  configValue: text().notNull(), // JSON string for complex values
  description: text(),
  active: int({ mode: 'boolean' }).default(true),
});

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

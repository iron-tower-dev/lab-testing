import { int, real, sqliteTable, text, uniqueIndex, index, foreignKey } from 'drizzle-orm/sqlite-core';
import { testTable } from './schema';

/**
 * M&TE (Measuring & Test Equipment) Equipment Table
 * Stores all laboratory equipment with calibration information
 */
export const equipmentTable = sqliteTable('equipment_table', {
  id: int().primaryKey({ autoIncrement: true }),
  equipmentId: text().notNull().unique(), // e.g., "TUBE-A1", "THERM-001"
  equipmentType: text().notNull(), // 'tube', 'thermometer', 'balance', 'timer', 'other'
  name: text().notNull(), // Display name
  description: text(),
  manufacturer: text(),
  modelNumber: text(),
  serialNumber: text(),
  
  // Calibration data
  calibrationValue: real(), // Primary calibration value (e.g., tube constant)
  calibrationUnit: text(), // e.g., "cSt/s", "°C", "g"
  calibrationDate: int({ mode: 'timestamp' }),
  calibrationDueDate: int({ mode: 'timestamp' }),
  calibrationCertificate: text(), // File path or reference
  
  // Status
  status: text().default('active'), // 'active', 'inactive', 'calibration_due', 'out_of_service'
  location: text(), // Physical location in lab
  assignedTo: text(), // Person responsible
  
  // Metadata
  purchaseDate: int({ mode: 'timestamp' }),
  purchaseCost: real(),
  notes: text(),
  createdAt: int({ mode: 'timestamp' }).notNull(),
  updatedAt: int({ mode: 'timestamp' }).notNull(),
  createdBy: text(),
  updatedBy: text(),
}, (table) => ({
  equipmentIdIdx: uniqueIndex('equipment_id_idx').on(table.equipmentId),
  equipmentTypeIdx: index('equipment_type_idx').on(table.equipmentType),
  statusIdx: index('equipment_status_idx').on(table.status),
  calibrationDueIdx: index('equipment_cal_due_idx').on(table.calibrationDueDate),
}));

/**
 * Equipment-Test Association Table
 * Links equipment to specific test types
 */
export const equipmentTestAssociationTable = sqliteTable('equipment_test_association_table', {
  id: int().primaryKey({ autoIncrement: true }),
  equipmentId: int().notNull(),
  testId: int().notNull(),
  isPrimary: int({ mode: 'boolean' }).default(false), // Primary equipment for this test
  active: int({ mode: 'boolean' }).default(true),
}, (table) => ({
  equipmentIdFk: foreignKey({
    columns: [table.equipmentId],
    foreignColumns: [equipmentTable.id],
    name: 'equipment_test_equipment_fk'
  }).onDelete('cascade'),
  testIdFk: foreignKey({
    columns: [table.testId],
    foreignColumns: [testTable.id],
    name: 'equipment_test_test_fk'
  }).onDelete('cascade'),
  uniqueEquipmentTest: uniqueIndex('unique_equipment_test_idx').on(
    table.equipmentId,
    table.testId
  ),
  equipmentIdIdx: index('equipment_test_equipment_idx').on(table.equipmentId),
  testIdIdx: index('equipment_test_test_idx').on(table.testId),
}));

/**
 * Equipment Calibration History Table
 * Tracks all calibration events for equipment
 */
export const equipmentCalibrationHistoryTable = sqliteTable('equipment_calibration_history_table', {
  id: int().primaryKey({ autoIncrement: true }),
  equipmentId: int().notNull(),
  calibrationDate: int({ mode: 'timestamp' }).notNull(),
  calibrationValue: real(),
  calibrationUnit: text(),
  calibratedBy: text(),
  certificateNumber: text(),
  certificateFile: text(),
  nextCalibrationDate: int({ mode: 'timestamp' }),
  calibrationStandard: text(), // e.g., "NIST", "ISO 17025"
  notes: text(),
  createdAt: int({ mode: 'timestamp' }).notNull(),
}, (table) => ({
  equipmentIdFk: foreignKey({
    columns: [table.equipmentId],
    foreignColumns: [equipmentTable.id],
    name: 'equipment_cal_history_equipment_fk'
  }).onDelete('cascade'),
  equipmentIdIdx: index('equipment_cal_history_equipment_idx').on(table.equipmentId),
  calibrationDateIdx: index('equipment_cal_history_date_idx').on(table.calibrationDate),
}));

/**
 * Equipment Maintenance Log Table
 * Tracks maintenance, repairs, and service events
 */
export const equipmentMaintenanceLogTable = sqliteTable('equipment_maintenance_log_table', {
  id: int().primaryKey({ autoIncrement: true }),
  equipmentId: int().notNull(),
  maintenanceDate: int({ mode: 'timestamp' }).notNull(),
  maintenanceType: text().notNull(), // 'routine', 'repair', 'cleaning', 'verification'
  performedBy: text(),
  description: text().notNull(),
  cost: real(),
  downtime: int(), // Minutes of downtime
  partsReplaced: text(), // JSON array of parts
  nextMaintenanceDate: int({ mode: 'timestamp' }),
  notes: text(),
  createdAt: int({ mode: 'timestamp' }).notNull(),
}, (table) => ({
  equipmentIdFk: foreignKey({
    columns: [table.equipmentId],
    foreignColumns: [equipmentTable.id],
    name: 'equipment_maintenance_equipment_fk'
  }).onDelete('cascade'),
  equipmentIdIdx: index('equipment_maintenance_equipment_idx').on(table.equipmentId),
  maintenanceDateIdx: index('equipment_maintenance_date_idx').on(table.maintenanceDate),
  maintenanceTypeIdx: index('equipment_maintenance_type_idx').on(table.maintenanceType),
}));

// Export types for use in application
export type Equipment = typeof equipmentTable.$inferSelect;
export type NewEquipment = typeof equipmentTable.$inferInsert;
export type EquipmentTestAssociation = typeof equipmentTestAssociationTable.$inferSelect;
export type EquipmentCalibrationHistory = typeof equipmentCalibrationHistoryTable.$inferSelect;
export type EquipmentMaintenanceLog = typeof equipmentMaintenanceLogTable.$inferSelect;

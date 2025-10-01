/**
 * Phase 1 Critical Tables Seed Functions
 * Populates component, location, and qualification lookup tables
 */

import { componentTable, locationTable, lubeTechQualificationTable } from '../schema';
import { componentSeedData } from './components';
import { locationSeedData } from './locations';
import { sampleQualificationData } from './qualifications';

/**
 * Seed component lookup table
 */
export async function seedComponents(db: any) {
  console.log('  → Seeding component_table...');
  
  try {
    // Check if already seeded
    const existing = await db.select().from(componentTable).limit(1);
    if (existing.length > 0) {
      console.log('    ⚠️  component_table already has data, skipping...');
      return;
    }

    // Insert all components
    await db.insert(componentTable).values(
      componentSeedData.map(comp => ({
        code: comp.code,
        name: comp.name,
        description: comp.description,
        active: comp.active ? 1 : 0,
        sortOrder: comp.sortOrder,
      }))
    );

    console.log(`    ✓ Inserted ${componentSeedData.length} components`);
  } catch (error) {
    console.error('    ✗ Error seeding component_table:', error);
    throw error;
  }
}

/**
 * Seed location lookup table
 */
export async function seedLocations(db: any) {
  console.log('  → Seeding location_table...');
  
  try {
    // Check if already seeded
    const existing = await db.select().from(locationTable).limit(1);
    if (existing.length > 0) {
      console.log('    ⚠️  location_table already has data, skipping...');
      return;
    }

    // Insert all locations
    await db.insert(locationTable).values(
      locationSeedData.map(loc => ({
        code: loc.code,
        name: loc.name,
        description: loc.description,
        active: loc.active ? 1 : 0,
        sortOrder: loc.sortOrder,
      }))
    );

    console.log(`    ✓ Inserted ${locationSeedData.length} locations`);
  } catch (error) {
    console.error('    ✗ Error seeding location_table:', error);
    throw error;
  }
}

/**
 * Seed sample qualification data (for development/testing only)
 */
export async function seedSampleQualifications(db: any) {
  console.log('  → Seeding lube_tech_qualification_table (sample data)...');
  
  try {
    // Check if already seeded
    const existing = await db.select().from(lubeTechQualificationTable).limit(1);
    if (existing.length > 0) {
      console.log('    ⚠️  lube_tech_qualification_table already has data, skipping...');
      return;
    }

    // Insert sample qualifications
    await db.insert(lubeTechQualificationTable).values(
      sampleQualificationData.map(qual => ({
        employeeId: qual.employeeId,
        testStandId: qual.testStandId,
        qualificationLevel: qual.qualificationLevel,
        certifiedDate: Math.floor(qual.certifiedDate.getTime() / 1000),
        certifiedBy: qual.certifiedBy,
        expirationDate: qual.expirationDate 
          ? Math.floor(qual.expirationDate.getTime() / 1000) 
          : null,
        active: qual.active ? 1 : 0,
        notes: qual.notes,
      }))
    );

    console.log(`    ✓ Inserted ${sampleQualificationData.length} sample qualifications`);
    console.log('    ℹ️  Note: These are sample records for development/testing');
  } catch (error) {
    console.error('    ✗ Error seeding lube_tech_qualification_table:', error);
    throw error;
  }
}

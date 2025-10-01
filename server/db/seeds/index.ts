import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { join } from 'path';

// Import all seed functions
import { seedTestList } from './test-list.seed';
import { seedTestStand } from './test-stand.seed';
import { seedTest } from './test.seed';
import { seedParticleTypeDefinition } from './particle-type-definition.seed';
import { 
  seedParticleSubTypeCategoryDefinition,
  seedParticleSubTypeDefinition 
} from './particle-sub-type.seed';
import { 
  seedTestSchedule,
  seedTestScheduleRule,
  seedTestScheduleTest 
} from './test-schedule.seed';
import { 
  seedParticleType,
  seedParticleSubType,
  seedTestReadings 
} from './transactional.seed';
import { seedComponents, seedLocations, seedSampleQualifications } from './phase1.seed';

/**
 * Main seeding function that runs all seed functions in the correct order
 * to handle foreign key dependencies
 */
export async function seedDatabase(databasePath?: string) {
  console.log('🚀 Starting database seeding process...\n');
  
  try {
    // Initialize database connection
    const dbPath = databasePath || join(process.cwd(), 'lab.db');
    const sqlite = new Database(dbPath);
    const db = drizzle(sqlite) as any;
    
    console.log(`📁 Using database: ${dbPath}\n`);

    // Seed reference/lookup tables first (no dependencies)
    console.log('📋 Seeding reference tables...');
    await seedTestList(db);
    await seedTestStand(db);
    await seedParticleSubTypeCategoryDefinition(db);
    await seedParticleTypeDefinition(db);
    
    // Seed Phase 1 critical lookup tables
    console.log('\n🔐 Seeding Phase 1 critical tables...');
    await seedComponents(db);
    await seedLocations(db);
    if (process.env.NODE_ENV !== 'production') {
      await seedSampleQualifications(db);
    }
    
    // Seed tables that depend on reference tables
    console.log('\n🔗 Seeding dependent reference tables...');
    await seedParticleSubTypeDefinition(db); // Depends on particle_sub_type_category_definition
    await seedTest(db); // Depends on test_stand
    
    // Seed schedule tables
    console.log('\n📅 Seeding schedule tables...');
    await seedTestSchedule(db);
    await seedTestScheduleRule(db); // Depends on test_schedule
    await seedTestScheduleTest(db); // Depends on test_schedule
    
    // Seed transactional data (depends on various reference tables)
    console.log('\n📊 Seeding transactional data...');
    await seedParticleType(db); // Depends on particle_type_definition
    await seedParticleSubType(db); // Depends on particle_type_definition, particle_sub_type_category_definition
    await seedTestReadings(db); // Depends on test table
    
    sqlite.close();
    
    console.log('\n✅ Database seeding completed successfully!');
    console.log('🎉 All CSV data has been imported into your SQLite database.');
    
  } catch (error) {
    console.error('\n❌ Database seeding failed:', error);
    throw error;
  }
}

/**
 * Seed specific tables - useful for development/testing
 */
export async function seedSpecificTables(tables: string[], databasePath?: string) {
  console.log(`🎯 Seeding specific tables: ${tables.join(', ')}\n`);
  
  const dbPath = databasePath || join(process.cwd(), 'lab.db');
  const sqlite = new Database(dbPath);
  const db = drizzle(sqlite) as any;
  
  const seedFunctions: Record<string, Function> = {
    'test_list': seedTestList,
    'test_stand': seedTestStand,
    'test': seedTest,
    'particle_type_definition': seedParticleTypeDefinition,
    'particle_sub_type_category_definition': seedParticleSubTypeCategoryDefinition,
    'particle_sub_type_definition': seedParticleSubTypeDefinition,
    'test_schedule': seedTestSchedule,
    'test_schedule_rule': seedTestScheduleRule,
    'test_schedule_test': seedTestScheduleTest,
    'particle_type': seedParticleType,
    'particle_sub_type': seedParticleSubType,
    'test_readings': seedTestReadings,
    'component': seedComponents,
    'location': seedLocations,
    'lube_tech_qualification': seedSampleQualifications,
  };
  
  try {
    for (const table of tables) {
      const seedFunction = seedFunctions[table];
      if (seedFunction) {
        await seedFunction(db);
      } else {
        console.log(`⚠️ Unknown table: ${table}`);
      }
    }
    
    sqlite.close();
    console.log('\n✅ Specific table seeding completed!');
    
  } catch (error) {
    sqlite.close();
    console.error('\n❌ Specific table seeding failed:', error);
    throw error;
  }
}

// Export all individual seed functions for flexibility
export {
  seedTestList,
  seedTestStand,
  seedTest,
  seedParticleTypeDefinition,
  seedParticleSubTypeCategoryDefinition,
  seedParticleSubTypeDefinition,
  seedTestSchedule,
  seedTestScheduleRule,
  seedTestScheduleTest,
  seedParticleType,
  seedParticleSubType,
  seedTestReadings,
  seedComponents,
  seedLocations,
  seedSampleQualifications
};

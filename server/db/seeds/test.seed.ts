import { testTable } from '../schema';
import { parseCSV } from './csv-parser';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';

export async function seedTest(db: BetterSQLite3Database<any>) {
  console.log('🌱 Seeding test_table...');
  
  try {
    // Parse the CSV data with proper column mapping and type conversion
    const data = parseCSV('test.csv', {
      'ID': 'id',
      'name': 'name',
      'testStandID': 'testStandId',
      'sampleVolumeRequired': 'sampleVolumeRequired',
      'exclude': 'exclude',
      'abbrev': 'abbrev',
      'displayGroupId': 'displayedGroupId',
      'groupname': 'groupName',
      'Lab': 'lab',
      'Schedule': 'schedule',
      'ShortAbbrev': 'shortAbbrev'
    }, {
      'ID': 'number',
      'name': 'string',
      'testStandID': 'number',
      'sampleVolumeRequired': 'number',
      'exclude': 'string',
      'abbrev': 'string',
      'displayGroupId': 'number',
      'groupname': 'string',
      'Lab': 'boolean',
      'Schedule': 'boolean',
      'ShortAbbrev': 'string'
    });

    // Clear existing data
    await db.delete(testTable);

    // Insert new data
    if (data.length > 0) {
      await db.insert(testTable).values(
        data.map(row => ({
          id: row.id as number,
          name: row.name as string || null,
          testStandId: row.testStandId as number || null,
          sampleVolumeRequired: row.sampleVolumeRequired as number || null,
          exclude: row.exclude as string || null,
          abbrev: row.abbrev as string || null,
          displayedGroupId: row.displayedGroupId as number || null,
          groupName: row.groupName as string || null,
          lab: row.lab as boolean || false,
          schedule: row.schedule as boolean || false,
          shortAbbrev: row.shortAbbrev as string || null
        }))
      );
      
      console.log(`✅ Successfully seeded ${data.length} records into test_table`);
    } else {
      console.log('⚠️ No data found in test.csv');
    }
    
  } catch (error) {
    console.error('❌ Error seeding test_table:', error);
    throw error;
  }
}

import { testStandTable } from '../schema';
import { parseCSV } from './csv-parser';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';

export async function seedTestStand(db: BetterSQLite3Database<any>) {
  console.log('🌱 Seeding test_stand_table...');
  
  try {
    // Parse the CSV data
    const data = parseCSV('test-stand.csv', {
      'ID': 'id',
      'name': 'name'
    }, {
      'ID': 'number',
      'name': 'string'
    });

    // Clear existing data
    await db.delete(testStandTable);

    // Insert new data
    if (data.length > 0) {
      await db.insert(testStandTable).values(
        data.map(row => ({
          id: row.id as number,
          name: row.name as string
        }))
      );
      
      console.log(`✅ Successfully seeded ${data.length} records into test_stand_table`);
    } else {
      console.log('⚠️ No data found in test-stand.csv');
    }
    
  } catch (error) {
    console.error('❌ Error seeding test_stand_table:', error);
    throw error;
  }
}

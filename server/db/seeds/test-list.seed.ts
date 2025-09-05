import { eq } from 'drizzle-orm';
import { testListTable } from '../schema';
import { parseCSV } from './csv-parser';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';

export async function seedTestList(db: BetterSQLite3Database<any>) {
  console.log('🌱 Seeding test_list_table...');
  
  try {
    // Parse the CSV data
    const data = parseCSV('testlist.csv', {
      'Status': 'status',
      'Description': 'description'
    }, {
      'Status': 'number',
      'Description': 'string'
    });

    // Clear existing data
    await db.delete(testListTable);

    // Insert new data
    if (data.length > 0) {
      await db.insert(testListTable).values(
        data.map(row => ({
          status: row.status as number,
          description: row.description as string
        }))
      );
      
      console.log(`✅ Successfully seeded ${data.length} records into test_list_table`);
    } else {
      console.log('⚠️ No data found in testlist.csv');
    }
    
  } catch (error) {
    console.error('❌ Error seeding test_list_table:', error);
    throw error;
  }
}

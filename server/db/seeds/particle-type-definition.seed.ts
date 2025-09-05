import { particleTypeDefinitionTable } from '../schema';
import { parseCSV } from './csv-parser';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';

export async function seedParticleTypeDefinition(db: BetterSQLite3Database<any>) {
  console.log('🌱 Seeding particle_type_definition_table...');
  
  try {
    // Parse the CSV data
    const data = parseCSV('particle-type-definition.csv', {
      'ID': 'id',
      'Type': 'type',
      'Description': 'description',
      'Image1': 'image1',
      'Image2': 'image2',
      'Active': 'active',
      'SortOrder': 'sortOrder'
    }, {
      'ID': 'number',
      'Type': 'string',
      'Description': 'string',
      'Image1': 'string',
      'Image2': 'string',
      'Active': 'boolean',
      'SortOrder': 'number'
    });

    // Clear existing data
    await db.delete(particleTypeDefinitionTable);

    // Insert new data
    if (data.length > 0) {
      await db.insert(particleTypeDefinitionTable).values(
        data.map(row => ({
          id: row.id as number,
          type: row.type as string,
          description: row.description as string,
          image1: row.image1 as string,
          image2: row.image2 as string,
          active: row.active ? '1' : '0', // Convert boolean back to string for schema compatibility
          sortOrder: row.sortOrder as number || null
        }))
      );
      
      console.log(`✅ Successfully seeded ${data.length} records into particle_type_definition_table`);
    } else {
      console.log('⚠️ No data found in particle-type-definition.csv');
    }
    
  } catch (error) {
    console.error('❌ Error seeding particle_type_definition_table:', error);
    throw error;
  }
}

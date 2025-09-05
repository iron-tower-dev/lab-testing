import { 
  particleSubTypeCategoryDefinitionTable, 
  particleSubTypeDefinitionTable 
} from '../schema';
import { parseCSV, cleanHtmlEntities } from './csv-parser';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';

export async function seedParticleSubTypeCategoryDefinition(db: BetterSQLite3Database<any>) {
  console.log('🌱 Seeding particle_sub_type_category_definition_table...');
  
  try {
    const data = parseCSV('particle-sub-type-category-definition.csv', {
      'ID': 'id',
      'Description': 'description',
      'Active': 'active',
      'SortOrder': 'sortOrder'
    }, {
      'ID': 'number',
      'Description': 'string',
      'Active': 'boolean',
      'SortOrder': 'number'
    });

    await db.delete(particleSubTypeCategoryDefinitionTable);

    if (data.length > 0) {
      await db.insert(particleSubTypeCategoryDefinitionTable).values(
        data.map(row => ({
          id: row.id as number,
          description: row.description as string,
          active: row.active ? '1' : '0',
          sortOrder: row.sortOrder as number
        }))
      );
      
      console.log(`✅ Successfully seeded ${data.length} records into particle_sub_type_category_definition_table`);
    }
    
  } catch (error) {
    console.error('❌ Error seeding particle_sub_type_category_definition_table:', error);
    throw error;
  }
}

export async function seedParticleSubTypeDefinition(db: BetterSQLite3Database<any>) {
  console.log('🌱 Seeding particle_sub_type_definition_table...');
  
  try {
    const data = parseCSV('particle-sub-type-definition.csv', {
      'ParticleSubTypeCategoryID': 'particleSubTypeCategoryId',
      'Value': 'value',
      'Description': 'description',
      'Active': 'active',
      'SortOrder': 'sortOrder'
    }, {
      'ParticleSubTypeCategoryID': 'number',
      'Value': 'number',
      'Description': 'string',
      'Active': 'boolean',
      'SortOrder': 'number'
    });

    await db.delete(particleSubTypeDefinitionTable);

    if (data.length > 0) {
      await db.insert(particleSubTypeDefinitionTable).values(
        data.map(row => ({
          particleSubTypeCategoryId: row.particleSubTypeCategoryId as number,
          value: row.value as number,
          description: cleanHtmlEntities(row.description as string), // Clean HTML entities
          active: row.active ? '1' : '0',
          sortOrder: row.sortOrder as number || null
        }))
      );
      
      console.log(`✅ Successfully seeded ${data.length} records into particle_sub_type_definition_table`);
    }
    
  } catch (error) {
    console.error('❌ Error seeding particle_sub_type_definition_table:', error);
    throw error;
  }
}

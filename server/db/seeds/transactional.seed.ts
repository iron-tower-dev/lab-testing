import { 
  particleTypeTable, 
  particleSubTypeTable, 
  testReadingsTable 
} from '../schema';
import { parseCSV } from './csv-parser';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';

export async function seedParticleType(db: BetterSQLite3Database<any>) {
  console.log('🌱 Seeding particle_type_table...');
  
  try {
    const data = parseCSV('particle-type.csv', {
      'SampleID': 'sampleId',
      'testID': 'testId',
      'ParticleTypeDefinitionID': 'particleTypeDefinitionId',
      'Status': 'status',
      'Comments': 'comments'
    }, {
      'SampleID': 'number',
      'testID': 'number',
      'ParticleTypeDefinitionID': 'number',
      'Status': 'string',
      'Comments': 'string'
    });

    await db.delete(particleTypeTable);

    if (data.length > 0) {
      await db.insert(particleTypeTable).values(
        data.map(row => ({
          sampleId: row.sampleId as number,
          testId: row.testId as number,
          particleTypeDefinitionId: row.particleTypeDefinitionId as number,
          status: row.status as string || null,
          comments: row.comments as string || null
        }))
      );
      
      console.log(`✅ Successfully seeded ${data.length} records into particle_type_table`);
    }
    
  } catch (error) {
    console.error('❌ Error seeding particle_type_table:', error);
    throw error;
  }
}

export async function seedParticleSubType(db: BetterSQLite3Database<any>) {
  console.log('🌱 Seeding particle_sub_type_table...');
  
  try {
    const data = parseCSV('particle-sub-type.csv', {
      'SampleID': 'sampleId',
      'testID': 'testId',
      'ParticleTypeDefinitionID': 'particleTypeDefinitionId',
      'ParticleSubTypeCategoryID': 'particleSubTypeCategory',
      'Value': 'value'
    }, {
      'SampleID': 'number',
      'testID': 'number',
      'ParticleTypeDefinitionID': 'number',
      'ParticleSubTypeCategoryID': 'number',
      'Value': 'number'
    });

    await db.delete(particleSubTypeTable);

    if (data.length > 0) {
      await db.insert(particleSubTypeTable).values(
        data.map(row => ({
          sampleId: row.sampleId as number,
          testId: row.testId as number,
          particleTypeDefinitionId: row.particleTypeDefinitionId as number,
          particleSubTypeCategory: row.particleSubTypeCategory as number,
          value: row.value as number || null
        }))
      );
      
      console.log(`✅ Successfully seeded ${data.length} records into particle_sub_type_table`);
    }
    
  } catch (error) {
    console.error('❌ Error seeding particle_sub_type_table:', error);
    throw error;
  }
}

export async function seedTestReadings(db: BetterSQLite3Database<any>) {
  console.log('🌱 Seeding test_readings_table...');
  
  try {
    const data = parseCSV('test-readings.csv', {
      'sampleID': 'sampleId',
      'testID': 'testId',
      'trialNumber': 'trialNumber',
      'value1': 'value1',
      'value2': 'value2',
      'value3': 'value3',
      'trialCalc': 'trialCalc',
      'ID1': 'id1',
      'ID2': 'id2',
      'ID3': 'id3',
      'trialComplete': 'trialComplete',
      'status': 'status',
      'schedType': 'schedType',
      'entryID': 'entryId',
      'validateID': 'validateId',
      'entryDate': 'entryDate',
      'valiDate': 'valiDate',
      'MainComments': 'mainComments'
    }, {
      'sampleID': 'number',
      'testID': 'number',
      'trialNumber': 'number',
      'value1': 'number',
      'value2': 'number',
      'value3': 'number',
      'trialCalc': 'number',
      'ID1': 'string',
      'ID2': 'string',
      'ID3': 'string',
      'trialComplete': 'boolean',
      'status': 'string',
      'schedType': 'string',
      'entryID': 'string',
      'validateID': 'string',
      'entryDate': 'date',
      'valiDate': 'date',
      'MainComments': 'string'
    });

    await db.delete(testReadingsTable);

    if (data.length > 0) {
      await db.insert(testReadingsTable).values(
        data.map(row => ({
          sampleId: row.sampleId as number || null,
          testId: row.testId as number || null,
          trialNumber: row.trialNumber as number || null,
          value1: row.value1 as number || null,
          value2: row.value2 as number || null,
          value3: row.value3 as number || null,
          trialCalc: row.trialCalc as number || null,
          id1: row.id1 as string || null,
          id2: row.id2 as string || null,
          id3: row.id3 as string || null,
          trialComplete: row.trialComplete as boolean || false,
          status: row.status as string || null,
          schedType: row.schedType as string || null,
          entryId: row.entryId as string || null,
          validateId: row.validateId as string || null,
          entryDate: row.entryDate instanceof Date ? row.entryDate : null,
          valiDate: row.valiDate instanceof Date ? row.valiDate : null,
          mainComments: row.mainComments as string || null
        }))
      );
      
      console.log(`✅ Successfully seeded ${data.length} records into test_readings_table`);
    }
    
  } catch (error) {
    console.error('❌ Error seeding test_readings_table:', error);
    throw error;
  }
}

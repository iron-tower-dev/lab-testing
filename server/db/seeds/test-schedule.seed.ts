import { 
  testScheduleTable, 
  testScheduleRuleTable, 
  testScheduleTestTable 
} from '../schema';
import { parseCSV } from './csv-parser';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';

export async function seedTestSchedule(db: BetterSQLite3Database<any>) {
  console.log('🌱 Seeding test_schedule_table...');
  
  try {
    const data = parseCSV('test-schedule.csv', {
      'ID': 'id',
      'Tag': 'tag',
      'ComponentCode': 'componentCode',
      'LocationCode': 'locationCode',
      'Material': 'material'
    }, {
      'ID': 'number',
      'Tag': 'string',
      'ComponentCode': 'string',
      'LocationCode': 'string',
      'Material': 'string'
    });

    await db.delete(testScheduleTable);

    if (data.length > 0) {
      await db.insert(testScheduleTable).values(
        data.map(row => ({
          id: row.id as number,
          tag: row.tag as string || null,
          componentCode: row.componentCode as string || null,
          locationCode: row.locationCode as string || null,
          material: row.material as string || null
        }))
      );
      
      console.log(`✅ Successfully seeded ${data.length} records into test_schedule_table`);
    }
    
  } catch (error) {
    console.error('❌ Error seeding test_schedule_table:', error);
    throw error;
  }
}

export async function seedTestScheduleRule(db: BetterSQLite3Database<any>) {
  console.log('🌱 Seeding test_schedule_rule_table...');
  
  try {
    const data = parseCSV('test-schedule-rule.csv', {
      'ID': 'id',
      'GroupID': 'groupId',
      'TestID': 'testId',
      'RuleTestID': 'ruleTestId',
      'UpperRule': 'upperRule',
      'RuleAction': 'ruleAction'
    }, {
      'ID': 'number',
      'GroupID': 'number',
      'TestID': 'number',
      'RuleTestID': 'number',
      'UpperRule': 'number',
      'RuleAction': 'string'
    });

    await db.delete(testScheduleRuleTable);

    if (data.length > 0) {
      await db.insert(testScheduleRuleTable).values(
        data.map(row => ({
          id: row.id as number,
          groupId: row.groupId as number,
          testId: row.testId as number,
          ruleTestId: row.ruleTestId as number,
          upperRule: row.upperRule as number,
          ruleAction: row.ruleAction as string || null
        }))
      );
      
      console.log(`✅ Successfully seeded ${data.length} records into test_schedule_rule_table`);
    }
    
  } catch (error) {
    console.error('❌ Error seeding test_schedule_rule_table:', error);
    throw error;
  }
}

export async function seedTestScheduleTest(db: BetterSQLite3Database<any>) {
  console.log('🌱 Seeding test_schedule_test_table...');
  
  try {
    const data = parseCSV('test-schedule-test.csv', {
      'ID': 'id',
      'TestScheduleID': 'testScheduleId',
      'TestID': 'testId',
      'TestInterval': 'testInterval',
      'MinimumInterval': 'minimumInterval',
      'DuringMonth': 'duringMonth',
      'Details': 'details'
    }, {
      'ID': 'number',
      'TestScheduleID': 'number',
      'TestID': 'number',
      'TestInterval': 'number',
      'MinimumInterval': 'number',
      'DuringMonth': 'number',
      'Details': 'string'
    });

    await db.delete(testScheduleTestTable);

    if (data.length > 0) {
      await db.insert(testScheduleTestTable).values(
        data.map(row => ({
          id: row.id as number,
          testScheduleId: row.testScheduleId as number,
          testId: row.testId as number,
          testInterval: row.testInterval as number || null,
          minimumInterval: row.minimumInterval as number || null,
          duringMonth: row.duringMonth as number || null,
          details: row.details as string || null
        }))
      );
      
      console.log(`✅ Successfully seeded ${data.length} records into test_schedule_test_table`);
    }
    
  } catch (error) {
    console.error('❌ Error seeding test_schedule_test_table:', error);
    throw error;
  }
}

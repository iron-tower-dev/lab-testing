import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { db, schema } from '../db/connection';

const testStandards = new Hono();

// GET /api/test-standards - Get all test standards with optional filtering by test ID
testStandards.get('/', async (c) => {
  try {
    const { testId } = c.req.query();
    
    let query = db.select().from(schema.testStandardsTable);
    
    if (testId) {
      const testIdNum = parseInt(testId);
      if (!isNaN(testIdNum)) {
        query = query.where(eq(schema.testStandardsTable.testId, testIdNum));
      }
    }
    
    // Only return active standards, ordered by sortOrder then name
    query = query
      .where(eq(schema.testStandardsTable.active, true))
      .orderBy(schema.testStandardsTable.sortOrder, schema.testStandardsTable.standardName);
    
    const standards = await query.all();
    
    return c.json({
      success: true,
      data: standards,
      count: standards.length
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to fetch test standards',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// GET /api/test-standards/:testId - Get standards for a specific test
testStandards.get('/:testId', async (c) => {
  try {
    const testId = parseInt(c.req.param('testId'));
    
    if (isNaN(testId)) {
      return c.json({
        success: false,
        error: 'Invalid test ID format'
      }, 400);
    }
    
    const standards = await db.select()
      .from(schema.testStandardsTable)
      .where(and(
        eq(schema.testStandardsTable.testId, testId),
        eq(schema.testStandardsTable.active, true)
      ))
      .orderBy(schema.testStandardsTable.sortOrder, schema.testStandardsTable.standardName)
      .all();
    
    return c.json({
      success: true,
      data: standards,
      count: standards.length,
      testId: testId
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to fetch standards for test',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// POST /api/test-standards - Create a new test standard
testStandards.post('/', async (c) => {
  try {
    const body = await c.req.json();
    
    // Validate required fields
    if (!body.testId || !body.standardCode || !body.standardName) {
      return c.json({
        success: false,
        error: 'testId, standardCode, and standardName are required'
      }, 400);
    }
    
    // Check if test exists
    const test = await db.select()
      .from(schema.testTable)
      .where(eq(schema.testTable.id, body.testId))
      .get();
    
    if (!test) {
      return c.json({
        success: false,
        error: 'Test not found'
      }, 404);
    }
    
    const newStandard = await db.insert(schema.testStandardsTable)
      .values({
        testId: body.testId,
        standardCode: body.standardCode,
        standardName: body.standardName,
        description: body.description || null,
        isDefault: body.isDefault || false,
        active: body.active ?? true,
        sortOrder: body.sortOrder || 0
      })
      .returning()
      .get();
    
    return c.json({
      success: true,
      data: newStandard,
      message: 'Test standard created successfully'
    }, 201);
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to create test standard',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// PUT /api/test-standards/:id - Update a test standard
testStandards.put('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const body = await c.req.json();
    
    if (isNaN(id)) {
      return c.json({
        success: false,
        error: 'Invalid ID format'
      }, 400);
    }
    
    // Check if standard exists
    const existingStandard = await db.select()
      .from(schema.testStandardsTable)
      .where(eq(schema.testStandardsTable.id, id))
      .get();
    
    if (!existingStandard) {
      return c.json({
        success: false,
        error: 'Test standard not found'
      }, 404);
    }
    
    const updatedStandard = await db.update(schema.testStandardsTable)
      .set({
        testId: body.testId ?? existingStandard.testId,
        standardCode: body.standardCode ?? existingStandard.standardCode,
        standardName: body.standardName ?? existingStandard.standardName,
        description: body.description ?? existingStandard.description,
        isDefault: body.isDefault ?? existingStandard.isDefault,
        active: body.active ?? existingStandard.active,
        sortOrder: body.sortOrder ?? existingStandard.sortOrder
      })
      .where(eq(schema.testStandardsTable.id, id))
      .returning()
      .get();
    
    return c.json({
      success: true,
      data: updatedStandard,
      message: 'Test standard updated successfully'
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to update test standard',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// DELETE /api/test-standards/:id - Delete (deactivate) a test standard
testStandards.delete('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json({
        success: false,
        error: 'Invalid ID format'
      }, 400);
    }
    
    // Check if standard exists
    const existingStandard = await db.select()
      .from(schema.testStandardsTable)
      .where(eq(schema.testStandardsTable.id, id))
      .get();
    
    if (!existingStandard) {
      return c.json({
        success: false,
        error: 'Test standard not found'
      }, 404);
    }
    
    // Soft delete by setting active to false
    await db.update(schema.testStandardsTable)
      .set({ active: false })
      .where(eq(schema.testStandardsTable.id, id));
    
    return c.json({
      success: true,
      message: 'Test standard deactivated successfully'
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to delete test standard',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default testStandards;

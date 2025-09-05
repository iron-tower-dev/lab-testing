import { Hono } from 'hono';
import { eq, like, and, or } from 'drizzle-orm';
import { db, schema } from '../db/connection';

const tests = new Hono();

// GET /api/tests - Get all tests with optional filtering
tests.get('/', async (c) => {
  try {
    const { search, lab, schedule } = c.req.query();
    
    let whereConditions = [];
    
    // Add search filter
    if (search) {
      whereConditions.push(
        or(
          like(schema.testTable.name, `%${search}%`),
          like(schema.testTable.abbrev, `%${search}%`),
          like(schema.testTable.shortAbbrev, `%${search}%`)
        )
      );
    }
    
    // Add lab filter
    if (lab === 'true') {
      whereConditions.push(eq(schema.testTable.lab, true));
    } else if (lab === 'false') {
      whereConditions.push(eq(schema.testTable.lab, false));
    }
    
    // Add schedule filter
    if (schedule === 'true') {
      whereConditions.push(eq(schema.testTable.schedule, true));
    } else if (schedule === 'false') {
      whereConditions.push(eq(schema.testTable.schedule, false));
    }
    
    const query = db.select().from(schema.testTable);
    
    if (whereConditions.length > 0) {
      query.where(and(...whereConditions));
    }
    
    const testResults = await query.all();
    
    return c.json({
      success: true,
      data: testResults,
      count: testResults.length
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to fetch tests',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// GET /api/tests/:id - Get a specific test by ID
tests.get('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json({
        success: false,
        error: 'Invalid ID format'
      }, 400);
    }
    
    const test = await db.select()
      .from(schema.testTable)
      .where(eq(schema.testTable.id, id))
      .get();
    
    if (!test) {
      return c.json({
        success: false,
        error: 'Test not found'
      }, 404);
    }
    
    return c.json({
      success: true,
      data: test
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to fetch test',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// POST /api/tests - Create a new test
tests.post('/', async (c) => {
  try {
    const body = await c.req.json();
    
    // Validate required fields
    if (!body.name) {
      return c.json({
        success: false,
        error: 'Name is required'
      }, 400);
    }
    
    const newTest = await db.insert(schema.testTable)
      .values({
        name: body.name,
        testStandId: body.testStandId || null,
        sampleVolumeRequired: body.sampleVolumeRequired || null,
        exclude: body.exclude || null,
        abbrev: body.abbrev || null,
        displayedGroupId: body.displayedGroupId || null,
        groupName: body.groupName || null,
        lab: body.lab || false,
        schedule: body.schedule || false,
        shortAbbrev: body.shortAbbrev || null
      })
      .returning()
      .get();
    
    return c.json({
      success: true,
      data: newTest,
      message: 'Test created successfully'
    }, 201);
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to create test',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// PUT /api/tests/:id - Update a test
tests.put('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const body = await c.req.json();
    
    if (isNaN(id)) {
      return c.json({
        success: false,
        error: 'Invalid ID format'
      }, 400);
    }
    
    // Check if test exists
    const existingTest = await db.select()
      .from(schema.testTable)
      .where(eq(schema.testTable.id, id))
      .get();
    
    if (!existingTest) {
      return c.json({
        success: false,
        error: 'Test not found'
      }, 404);
    }
    
    const updatedTest = await db.update(schema.testTable)
      .set({
        name: body.name ?? existingTest.name,
        testStandId: body.testStandId ?? existingTest.testStandId,
        sampleVolumeRequired: body.sampleVolumeRequired ?? existingTest.sampleVolumeRequired,
        exclude: body.exclude ?? existingTest.exclude,
        abbrev: body.abbrev ?? existingTest.abbrev,
        displayedGroupId: body.displayedGroupId ?? existingTest.displayedGroupId,
        groupName: body.groupName ?? existingTest.groupName,
        lab: body.lab ?? existingTest.lab,
        schedule: body.schedule ?? existingTest.schedule,
        shortAbbrev: body.shortAbbrev ?? existingTest.shortAbbrev
      })
      .where(eq(schema.testTable.id, id))
      .returning()
      .get();
    
    return c.json({
      success: true,
      data: updatedTest,
      message: 'Test updated successfully'
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to update test',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// DELETE /api/tests/:id - Delete a test
tests.delete('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json({
        success: false,
        error: 'Invalid ID format'
      }, 400);
    }
    
    // Check if test exists
    const existingTest = await db.select()
      .from(schema.testTable)
      .where(eq(schema.testTable.id, id))
      .get();
    
    if (!existingTest) {
      return c.json({
        success: false,
        error: 'Test not found'
      }, 404);
    }
    
    await db.delete(schema.testTable)
      .where(eq(schema.testTable.id, id));
    
    return c.json({
      success: true,
      message: 'Test deleted successfully'
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to delete test',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default tests;

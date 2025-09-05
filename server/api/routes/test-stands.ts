import { Hono } from 'hono';
import { eq, like } from 'drizzle-orm';
import { db, schema } from '../db/connection';

const testStands = new Hono();

// GET /api/test-stands - Get all test stands
testStands.get('/', async (c) => {
  try {
    const { search } = c.req.query();
    
    let query = db.select().from(schema.testStandTable);
    
    if (search) {
      query = query.where(like(schema.testStandTable.name, `%${search}%`));
    }
    
    const testStandResults = await query.orderBy(schema.testStandTable.name).all();
    
    return c.json({
      success: true,
      data: testStandResults,
      count: testStandResults.length
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to fetch test stands',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// GET /api/test-stands/:id - Get specific test stand
testStands.get('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json({
        success: false,
        error: 'Invalid ID format'
      }, 400);
    }
    
    const testStand = await db.select()
      .from(schema.testStandTable)
      .where(eq(schema.testStandTable.id, id))
      .get();
    
    if (!testStand) {
      return c.json({
        success: false,
        error: 'Test stand not found'
      }, 404);
    }
    
    return c.json({
      success: true,
      data: testStand
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to fetch test stand',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// POST /api/test-stands - Create new test stand
testStands.post('/', async (c) => {
  try {
    const body = await c.req.json();
    
    // Validate required fields
    if (!body.id || !body.name) {
      return c.json({
        success: false,
        error: 'ID and name are required'
      }, 400);
    }
    
    const newTestStand = await db.insert(schema.testStandTable)
      .values({
        id: body.id,
        name: body.name
      })
      .returning()
      .get();
    
    return c.json({
      success: true,
      data: newTestStand,
      message: 'Test stand created successfully'
    }, 201);
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to create test stand',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// PUT /api/test-stands/:id - Update test stand
testStands.put('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const body = await c.req.json();
    
    if (isNaN(id)) {
      return c.json({
        success: false,
        error: 'Invalid ID format'
      }, 400);
    }
    
    const existingTestStand = await db.select()
      .from(schema.testStandTable)
      .where(eq(schema.testStandTable.id, id))
      .get();
    
    if (!existingTestStand) {
      return c.json({
        success: false,
        error: 'Test stand not found'
      }, 404);
    }
    
    const updatedTestStand = await db.update(schema.testStandTable)
      .set({
        name: body.name ?? existingTestStand.name
      })
      .where(eq(schema.testStandTable.id, id))
      .returning()
      .get();
    
    return c.json({
      success: true,
      data: updatedTestStand,
      message: 'Test stand updated successfully'
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to update test stand',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// DELETE /api/test-stands/:id - Delete test stand
testStands.delete('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json({
        success: false,
        error: 'Invalid ID format'
      }, 400);
    }
    
    const existingTestStand = await db.select()
      .from(schema.testStandTable)
      .where(eq(schema.testStandTable.id, id))
      .get();
    
    if (!existingTestStand) {
      return c.json({
        success: false,
        error: 'Test stand not found'
      }, 404);
    }
    
    await db.delete(schema.testStandTable)
      .where(eq(schema.testStandTable.id, id));
    
    return c.json({
      success: true,
      message: 'Test stand deleted successfully'
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to delete test stand',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default testStands;

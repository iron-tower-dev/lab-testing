import { Hono } from 'hono';
import { eq, asc } from 'drizzle-orm';
import { db, schema } from '../db/connection';

const lookups = new Hono();

// ============================================================================
// COMPONENTS
// ============================================================================

// GET /api/lookups/components - Get all components
lookups.get('/components', async (c) => {
  try {
    const { activeOnly } = c.req.query();
    
    let query = db.select().from(schema.componentTable);
    
    if (activeOnly === 'true') {
      query = query.where(eq(schema.componentTable.active, 1));
    }
    
    const results = await query.orderBy(asc(schema.componentTable.sortOrder)).all();
    
    return c.json({
      success: true,
      data: results,
      count: results.length
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to fetch components',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// GET /api/lookups/components/:code - Get specific component
lookups.get('/components/:code', async (c) => {
  try {
    const code = c.req.param('code');
    
    const component = await db.select()
      .from(schema.componentTable)
      .where(eq(schema.componentTable.code, code))
      .get();
    
    if (!component) {
      return c.json({
        success: false,
        error: 'Component not found'
      }, 404);
    }
    
    return c.json({
      success: true,
      data: component
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to fetch component',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// POST /api/lookups/components - Create new component
lookups.post('/components', async (c) => {
  try {
    const body = await c.req.json();
    
    if (!body.code || !body.name) {
      return c.json({
        success: false,
        error: 'code and name are required'
      }, 400);
    }
    
    // Check for duplicate component code
    const existing = await db.select()
      .from(schema.componentTable)
      .where(eq(schema.componentTable.code, body.code))
      .get();
    
    if (existing) {
      return c.json({
        success: false,
        error: 'Component code already exists'
      }, 409);
    }
    
    const newComponent = await db.insert(schema.componentTable)
      .values({
        code: body.code,
        name: body.name,
        description: body.description || null,
        active: body.active !== undefined ? (body.active ? 1 : 0) : 1,
        sortOrder: body.sortOrder ?? 0
      })
      .returning()
      .get();
    
    return c.json({
      success: true,
      data: newComponent,
      message: 'Component created successfully'
    }, 201);
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to create component',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// PUT /api/lookups/components/:code - Update component
lookups.put('/components/:code', async (c) => {
  try {
    const code = c.req.param('code');
    const body = await c.req.json();
    
    const existing = await db.select()
      .from(schema.componentTable)
      .where(eq(schema.componentTable.code, code))
      .get();
    
    if (!existing) {
      return c.json({
        success: false,
        error: 'Component not found'
      }, 404);
    }
    
    const updated = await db.update(schema.componentTable)
      .set({
        name: body.name ?? existing.name,
        description: body.description ?? existing.description,
        active: body.active !== undefined ? (body.active ? 1 : 0) : existing.active,
        sortOrder: body.sortOrder ?? existing.sortOrder
      })
      .where(eq(schema.componentTable.code, code))
      .returning()
      .get();
    
    return c.json({
      success: true,
      data: updated,
      message: 'Component updated successfully'
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to update component',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// DELETE /api/lookups/components/:code - Delete component (or deactivate)
lookups.delete('/components/:code', async (c) => {
  try {
    const code = c.req.param('code');
    const { soft } = c.req.query();
    
    const existing = await db.select()
      .from(schema.componentTable)
      .where(eq(schema.componentTable.code, code))
      .get();
    
    if (!existing) {
      return c.json({
        success: false,
        error: 'Component not found'
      }, 404);
    }
    
    if (soft === 'true') {
      // Soft delete - deactivate
      await db.update(schema.componentTable)
        .set({ active: 0 })
        .where(eq(schema.componentTable.code, code));
      
      return c.json({
        success: true,
        message: 'Component deactivated successfully'
      });
    } else {
      // Hard delete
      await db.delete(schema.componentTable)
        .where(eq(schema.componentTable.code, code));
      
      return c.json({
        success: true,
        message: 'Component deleted successfully'
      });
    }
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to delete component',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// ============================================================================
// LOCATIONS
// ============================================================================

// GET /api/lookups/locations - Get all locations
lookups.get('/locations', async (c) => {
  try {
    const { activeOnly } = c.req.query();
    
    let query = db.select().from(schema.locationTable);
    
    if (activeOnly === 'true') {
      query = query.where(eq(schema.locationTable.active, 1));
    }
    
    const results = await query.orderBy(asc(schema.locationTable.sortOrder)).all();
    
    return c.json({
      success: true,
      data: results,
      count: results.length
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to fetch locations',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// GET /api/lookups/locations/:code - Get specific location
lookups.get('/locations/:code', async (c) => {
  try {
    const code = c.req.param('code');
    
    const location = await db.select()
      .from(schema.locationTable)
      .where(eq(schema.locationTable.code, code))
      .get();
    
    if (!location) {
      return c.json({
        success: false,
        error: 'Location not found'
      }, 404);
    }
    
    return c.json({
      success: true,
      data: location
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to fetch location',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// POST /api/lookups/locations - Create new location
lookups.post('/locations', async (c) => {
  try {
    const body = await c.req.json();
    
    if (!body.code || !body.name) {
      return c.json({
        success: false,
        error: 'code and name are required'
      }, 400);
    }
    
    // Check for duplicate location code
    const existing = await db.select()
      .from(schema.locationTable)
      .where(eq(schema.locationTable.code, body.code))
      .get();
    
    if (existing) {
      return c.json({
        success: false,
        error: 'Location code already exists'
      }, 409);
    }
    
    const newLocation = await db.insert(schema.locationTable)
      .values({
        code: body.code,
        name: body.name,
        description: body.description || null,
        active: body.active !== undefined ? (body.active ? 1 : 0) : 1,
        sortOrder: body.sortOrder ?? 0
      })
      .returning()
      .get();
    
    return c.json({
      success: true,
      data: newLocation,
      message: 'Location created successfully'
    }, 201);
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to create location',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// PUT /api/lookups/locations/:code - Update location
lookups.put('/locations/:code', async (c) => {
  try {
    const code = c.req.param('code');
    const body = await c.req.json();
    
    const existing = await db.select()
      .from(schema.locationTable)
      .where(eq(schema.locationTable.code, code))
      .get();
    
    if (!existing) {
      return c.json({
        success: false,
        error: 'Location not found'
      }, 404);
    }
    
    const updated = await db.update(schema.locationTable)
      .set({
        name: body.name ?? existing.name,
        description: body.description ?? existing.description,
        active: body.active !== undefined ? (body.active ? 1 : 0) : existing.active,
        sortOrder: body.sortOrder ?? existing.sortOrder
      })
      .where(eq(schema.locationTable.code, code))
      .returning()
      .get();
    
    return c.json({
      success: true,
      data: updated,
      message: 'Location updated successfully'
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to update location',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// DELETE /api/lookups/locations/:code - Delete location (or deactivate)
lookups.delete('/locations/:code', async (c) => {
  try {
    const code = c.req.param('code');
    const { soft } = c.req.query();
    
    const existing = await db.select()
      .from(schema.locationTable)
      .where(eq(schema.locationTable.code, code))
      .get();
    
    if (!existing) {
      return c.json({
        success: false,
        error: 'Location not found'
      }, 404);
    }
    
    if (soft === 'true') {
      // Soft delete - deactivate
      await db.update(schema.locationTable)
        .set({ active: 0 })
        .where(eq(schema.locationTable.code, code));
      
      return c.json({
        success: true,
        message: 'Location deactivated successfully'
      });
    } else {
      // Hard delete
      await db.delete(schema.locationTable)
        .where(eq(schema.locationTable.code, code));
      
      return c.json({
        success: true,
        message: 'Location deleted successfully'
      });
    }
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to delete location',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default lookups;

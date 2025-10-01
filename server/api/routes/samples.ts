import { Hono } from 'hono';
import { eq, and, like, desc, asc, isNull, isNotNull } from 'drizzle-orm';
import { db, schema } from '../db/connection';

const samples = new Hono();

// GET /api/samples - Get all samples with optional filters
samples.get('/', async (c) => {
  try {
    const { 
      status, 
      assignedTo, 
      component, 
      location, 
      tagNumber, 
      lubeType,
      priority,
      withDetails 
    } = c.req.query();
    
    // Base query with optional joins
    const selectFields = withDetails === 'true' ? {
      sample: schema.usedLubeSamplesTable,
      componentInfo: schema.componentTable,
      locationInfo: schema.locationTable
    } : {
      sample: schema.usedLubeSamplesTable
    };
    
    let query = db.select(selectFields).from(schema.usedLubeSamplesTable);
    
    // Add joins if details requested
    if (withDetails === 'true') {
      query = query
        .leftJoin(
          schema.componentTable,
          eq(schema.usedLubeSamplesTable.component, schema.componentTable.code)
        )
        .leftJoin(
          schema.locationTable,
          eq(schema.usedLubeSamplesTable.location, schema.locationTable.code)
        );
    }
    
    // Build filter conditions
    const conditions = [];
    
    if (status) {
      const statusNum = parseInt(status);
      if (!isNaN(statusNum)) {
        conditions.push(eq(schema.usedLubeSamplesTable.status, statusNum));
      }
    }
    
    if (assignedTo) {
      if (assignedTo === 'unassigned') {
        conditions.push(isNull(schema.usedLubeSamplesTable.assignedTo));
      } else {
        conditions.push(eq(schema.usedLubeSamplesTable.assignedTo, assignedTo));
      }
    }
    
    if (component) {
      conditions.push(eq(schema.usedLubeSamplesTable.component, component));
    }
    
    if (location) {
      conditions.push(eq(schema.usedLubeSamplesTable.location, location));
    }
    
    if (tagNumber) {
      conditions.push(like(schema.usedLubeSamplesTable.tagNumber, `%${tagNumber}%`));
    }
    
    if (lubeType) {
      conditions.push(like(schema.usedLubeSamplesTable.lubeType, `%${lubeType}%`));
    }
    
    if (priority) {
      const priorityNum = parseInt(priority);
      if (!isNaN(priorityNum)) {
        conditions.push(eq(schema.usedLubeSamplesTable.priority, priorityNum));
      }
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    const results = await query
      .orderBy(
        desc(schema.usedLubeSamplesTable.priority),
        desc(schema.usedLubeSamplesTable.sampleDate)
      )
      .all();
    
    return c.json({
      success: true,
      data: results,
      count: results.length
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to fetch samples',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// GET /api/samples/:id - Get specific sample with details
samples.get('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json({
        success: false,
        error: 'Invalid ID format'
      }, 400);
    }
    
    const sample = await db.select({
      sample: schema.usedLubeSamplesTable,
      componentInfo: schema.componentTable,
      locationInfo: schema.locationTable
    })
      .from(schema.usedLubeSamplesTable)
      .leftJoin(
        schema.componentTable,
        eq(schema.usedLubeSamplesTable.component, schema.componentTable.code)
      )
      .leftJoin(
        schema.locationTable,
        eq(schema.usedLubeSamplesTable.location, schema.locationTable.code)
      )
      .where(eq(schema.usedLubeSamplesTable.id, id))
      .get();
    
    if (!sample) {
      return c.json({
        success: false,
        error: 'Sample not found'
      }, 404);
    }
    
    return c.json({
      success: true,
      data: sample
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to fetch sample',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// POST /api/samples - Create new sample
samples.post('/', async (c) => {
  try {
    const body = await c.req.json();
    
    // Validate required fields
    if (!body.tagNumber) {
      return c.json({
        success: false,
        error: 'tagNumber is required'
      }, 400);
    }
    
    const newSample = await db.insert(schema.usedLubeSamplesTable)
      .values({
        tagNumber: body.tagNumber,
        component: body.component || null,
        location: body.location || null,
        lubeType: body.lubeType || null,
        newUsedFlag: body.newUsedFlag ?? null,
        sampleDate: body.sampleDate || null,
        status: body.status ?? 10, // Default to "Received/Pending"
        returnedDate: body.returnedDate || null,
        priority: body.priority ?? 0,
        assignedDate: body.assignedDate || null,
        assignedTo: body.assignedTo || null,
        receivedDate: body.receivedDate || Date.now(),
        oilAdded: body.oilAdded || null,
        comments: body.comments || null
      })
      .returning()
      .get();
    
    return c.json({
      success: true,
      data: newSample,
      message: 'Sample created successfully'
    }, 201);
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to create sample',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// PUT /api/samples/:id - Update sample
samples.put('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const body = await c.req.json();
    
    if (isNaN(id)) {
      return c.json({
        success: false,
        error: 'Invalid ID format'
      }, 400);
    }
    
    const existing = await db.select()
      .from(schema.usedLubeSamplesTable)
      .where(eq(schema.usedLubeSamplesTable.id, id))
      .get();
    
    if (!existing) {
      return c.json({
        success: false,
        error: 'Sample not found'
      }, 404);
    }
    
    const updated = await db.update(schema.usedLubeSamplesTable)
      .set({
        tagNumber: 'tagNumber' in body ? body.tagNumber : existing.tagNumber,
        component: 'component' in body ? body.component : existing.component,
        location: 'location' in body ? body.location : existing.location,
        lubeType: 'lubeType' in body ? body.lubeType : existing.lubeType,
        newUsedFlag: 'newUsedFlag' in body ? body.newUsedFlag : existing.newUsedFlag,
        sampleDate: 'sampleDate' in body ? body.sampleDate : existing.sampleDate,
        status: 'status' in body ? body.status : existing.status,
        returnedDate: 'returnedDate' in body ? body.returnedDate : existing.returnedDate,
        priority: 'priority' in body ? body.priority : existing.priority,
        assignedDate: 'assignedDate' in body ? body.assignedDate : existing.assignedDate,
        assignedTo: 'assignedTo' in body ? body.assignedTo : existing.assignedTo,
        receivedDate: 'receivedDate' in body ? body.receivedDate : existing.receivedDate,
        oilAdded: 'oilAdded' in body ? body.oilAdded : existing.oilAdded,
        comments: 'comments' in body ? body.comments : existing.comments
      })
      .where(eq(schema.usedLubeSamplesTable.id, id))
      .returning()
      .get();
    
    return c.json({
      success: true,
      data: updated,
      message: 'Sample updated successfully'
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to update sample',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// PATCH /api/samples/:id/status - Update sample status
samples.patch('/:id/status', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const body = await c.req.json();
    
    if (isNaN(id)) {
      return c.json({
        success: false,
        error: 'Invalid ID format'
      }, 400);
    }
    
    if (body.status === undefined) {
      return c.json({
        success: false,
        error: 'status is required'
      }, 400);
    }
    
    const existing = await db.select()
      .from(schema.usedLubeSamplesTable)
      .where(eq(schema.usedLubeSamplesTable.id, id))
      .get();
    
    if (!existing) {
      return c.json({
        success: false,
        error: 'Sample not found'
      }, 404);
    }
    
    // Update status and optionally returnedDate if status is 90 (Complete)
    const updateData: any = {
      status: body.status
    };
    
    if (body.status === 90 && !existing.returnedDate) {
      updateData.returnedDate = Date.now();
    }
    
    const updated = await db.update(schema.usedLubeSamplesTable)
      .set(updateData)
      .where(eq(schema.usedLubeSamplesTable.id, id))
      .returning()
      .get();
    
    return c.json({
      success: true,
      data: updated,
      message: 'Sample status updated successfully'
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to update sample status',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// PATCH /api/samples/:id/assign - Assign sample to user
samples.patch('/:id/assign', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const body = await c.req.json();
    
    if (isNaN(id)) {
      return c.json({
        success: false,
        error: 'Invalid ID format'
      }, 400);
    }
    
    if (!body.assignedTo) {
      return c.json({
        success: false,
        error: 'assignedTo is required'
      }, 400);
    }
    
    const existing = await db.select()
      .from(schema.usedLubeSamplesTable)
      .where(eq(schema.usedLubeSamplesTable.id, id))
      .get();
    
    if (!existing) {
      return c.json({
        success: false,
        error: 'Sample not found'
      }, 404);
    }
    
    const updated = await db.update(schema.usedLubeSamplesTable)
      .set({
        assignedTo: body.assignedTo,
        assignedDate: Date.now(),
        status: 20 // Assigned status
      })
      .where(eq(schema.usedLubeSamplesTable.id, id))
      .returning()
      .get();
    
    return c.json({
      success: true,
      data: updated,
      message: 'Sample assigned successfully'
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to assign sample',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// DELETE /api/samples/:id - Delete sample
samples.delete('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json({
        success: false,
        error: 'Invalid ID format'
      }, 400);
    }
    
    const existing = await db.select()
      .from(schema.usedLubeSamplesTable)
      .where(eq(schema.usedLubeSamplesTable.id, id))
      .get();
    
    if (!existing) {
      return c.json({
        success: false,
        error: 'Sample not found'
      }, 404);
    }
    
    await db.delete(schema.usedLubeSamplesTable)
      .where(eq(schema.usedLubeSamplesTable.id, id));
    
    return c.json({
      success: true,
      message: 'Sample deleted successfully'
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to delete sample',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default samples;

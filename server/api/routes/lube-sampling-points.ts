import { Hono } from 'hono';
import { eq, like, and, or } from 'drizzle-orm';
import { db, schema } from '../db/connection';

const lubeSamplingPoints = new Hono();

// GET /api/lube-sampling-points - Get all lube sampling points with optional filtering
lubeSamplingPoints.get('/', async (c) => {
  try {
    const { search, component, location, inProgram, testScheduled } = c.req.query();
    
    let whereConditions = [];
    
    // Add search filter (search across tagNumber, component, location)
    if (search) {
      whereConditions.push(
        or(
          like(schema.lubeSamplingPointTable.tagNumber, `%${search}%`),
          like(schema.lubeSamplingPointTable.component, `%${search}%`),
          like(schema.lubeSamplingPointTable.location, `%${search}%`),
          like(schema.lubeSamplingPointTable.lubeClassItemNumber, `%${search}%`)
        )
      );
    }
    
    // Add component filter
    if (component) {
      whereConditions.push(eq(schema.lubeSamplingPointTable.component, component));
    }
    
    // Add location filter
    if (location) {
      whereConditions.push(eq(schema.lubeSamplingPointTable.location, location));
    }
    
    // Add inProgram filter
    if (inProgram === 'true') {
      whereConditions.push(eq(schema.lubeSamplingPointTable.inProgram, true));
    } else if (inProgram === 'false') {
      whereConditions.push(eq(schema.lubeSamplingPointTable.inProgram, false));
    }
    
    // Add testScheduled filter
    if (testScheduled === 'true') {
      whereConditions.push(eq(schema.lubeSamplingPointTable.testScheduled, true));
    } else if (testScheduled === 'false') {
      whereConditions.push(eq(schema.lubeSamplingPointTable.testScheduled, false));
    }
    
    let query = db.select().from(schema.lubeSamplingPointTable);
    
    if (whereConditions.length > 0) {
      query = query.where(and(...whereConditions));
    }
    
    const samplingPoints = await query.all();
    
    return c.json({
      success: true,
      data: samplingPoints,
      count: samplingPoints.length
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to fetch lube sampling points',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// GET /api/lube-sampling-points/:id - Get a specific lube sampling point by ID
lubeSamplingPoints.get('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json({
        success: false,
        error: 'Invalid ID format'
      }, 400);
    }
    
    const samplingPoint = await db.select()
      .from(schema.lubeSamplingPointTable)
      .where(eq(schema.lubeSamplingPointTable.id, id))
      .get();
    
    if (!samplingPoint) {
      return c.json({
        success: false,
        error: 'Lube sampling point not found'
      }, 404);
    }
    
    return c.json({
      success: true,
      data: samplingPoint
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to fetch lube sampling point',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// POST /api/lube-sampling-points - Create a new lube sampling point
lubeSamplingPoints.post('/', async (c) => {
  try {
    const body = await c.req.json();
    
    // Validate required fields (if any - adjust based on your requirements)
    if (!body.tagNumber) {
      return c.json({
        success: false,
        error: 'Tag number is required'
      }, 400);
    }
    
    const newSamplingPoint = await db.insert(schema.lubeSamplingPointTable)
      .values({
        tagNumber: body.tagNumber,
        component: body.component || null,
        location: body.location || null,
        lubeClassItemNumber: body.lubeClassItemNumber || null,
        lubeQuantityRequired: body.lubeQuantityRequired || null,
        lubeUnitsOfMeasure: body.lubeUnitsOfMeasure || null,
        testCategory: body.testCategory || null,
        qualityClass: body.qualityClass || null,
        pricingPackageId: body.pricingPackageId || null,
        testPricesId: body.testPricesId || null,
        lastSampleDate: body.lastSampleDate || null,
        changeTaskNumber: body.changeTaskNumber || null,
        changeIntervalType: body.changeIntervalType || null,
        changeIntervalNumber: body.changeIntervalNumber || null,
        lastChangeDate: body.lastChangeDate || null,
        inProgram: body.inProgram ?? false,
        testScheduled: body.testScheduled ?? false,
        applId: body.applId || null,
        materialInfo: body.materialInfo || null
      })
      .returning()
      .get();
    
    return c.json({
      success: true,
      data: newSamplingPoint,
      message: 'Lube sampling point created successfully'
    }, 201);
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to create lube sampling point',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// PUT /api/lube-sampling-points/:id - Update a lube sampling point
lubeSamplingPoints.put('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const body = await c.req.json();
    
    if (isNaN(id)) {
      return c.json({
        success: false,
        error: 'Invalid ID format'
      }, 400);
    }
    
    // Check if sampling point exists
    const existingSamplingPoint = await db.select()
      .from(schema.lubeSamplingPointTable)
      .where(eq(schema.lubeSamplingPointTable.id, id))
      .get();
    
    if (!existingSamplingPoint) {
      return c.json({
        success: false,
        error: 'Lube sampling point not found'
      }, 404);
    }
    
    const updatedSamplingPoint = await db.update(schema.lubeSamplingPointTable)
      .set({
        tagNumber: body.tagNumber ?? existingSamplingPoint.tagNumber,
        component: body.component ?? existingSamplingPoint.component,
        location: body.location ?? existingSamplingPoint.location,
        lubeClassItemNumber: body.lubeClassItemNumber ?? existingSamplingPoint.lubeClassItemNumber,
        lubeQuantityRequired: body.lubeQuantityRequired ?? existingSamplingPoint.lubeQuantityRequired,
        lubeUnitsOfMeasure: body.lubeUnitsOfMeasure ?? existingSamplingPoint.lubeUnitsOfMeasure,
        testCategory: body.testCategory ?? existingSamplingPoint.testCategory,
        qualityClass: body.qualityClass ?? existingSamplingPoint.qualityClass,
        pricingPackageId: body.pricingPackageId ?? existingSamplingPoint.pricingPackageId,
        testPricesId: body.testPricesId ?? existingSamplingPoint.testPricesId,
        lastSampleDate: body.lastSampleDate ?? existingSamplingPoint.lastSampleDate,
        changeTaskNumber: body.changeTaskNumber ?? existingSamplingPoint.changeTaskNumber,
        changeIntervalType: body.changeIntervalType ?? existingSamplingPoint.changeIntervalType,
        changeIntervalNumber: body.changeIntervalNumber ?? existingSamplingPoint.changeIntervalNumber,
        lastChangeDate: body.lastChangeDate ?? existingSamplingPoint.lastChangeDate,
        inProgram: body.inProgram ?? existingSamplingPoint.inProgram,
        testScheduled: body.testScheduled ?? existingSamplingPoint.testScheduled,
        applId: body.applId ?? existingSamplingPoint.applId,
        materialInfo: body.materialInfo ?? existingSamplingPoint.materialInfo
      })
      .where(eq(schema.lubeSamplingPointTable.id, id))
      .returning()
      .get();
    
    return c.json({
      success: true,
      data: updatedSamplingPoint,
      message: 'Lube sampling point updated successfully'
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to update lube sampling point',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// DELETE /api/lube-sampling-points/:id - Delete a lube sampling point
lubeSamplingPoints.delete('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json({
        success: false,
        error: 'Invalid ID format'
      }, 400);
    }
    
    // Check if sampling point exists
    const existingSamplingPoint = await db.select()
      .from(schema.lubeSamplingPointTable)
      .where(eq(schema.lubeSamplingPointTable.id, id))
      .get();
    
    if (!existingSamplingPoint) {
      return c.json({
        success: false,
        error: 'Lube sampling point not found'
      }, 404);
    }
    
    await db.delete(schema.lubeSamplingPointTable)
      .where(eq(schema.lubeSamplingPointTable.id, id));
    
    return c.json({
      success: true,
      message: 'Lube sampling point deleted successfully'
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to delete lube sampling point',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default lubeSamplingPoints;

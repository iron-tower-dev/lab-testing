import { Hono } from 'hono';
import { eq, and, gte, lte, desc, asc } from 'drizzle-orm';
import { db, schema } from '../db/connection';

const testReadings = new Hono();

// GET /api/test-readings - Get test readings with optional filtering
testReadings.get('/', async (c) => {
  try {
    const { 
      sampleId, 
      testId, 
      status, 
      dateFrom, 
      dateTo, 
      limit = '100',
      offset = '0',
      sortBy = 'entryDate',
      sortOrder = 'desc'
    } = c.req.query();
    
    let query = db.select().from(schema.testReadingsTable);
    let whereConditions = [];
    
    // Add filters
    if (sampleId) {
      whereConditions.push(eq(schema.testReadingsTable.sampleId, parseInt(sampleId)));
    }
    
    if (testId) {
      whereConditions.push(eq(schema.testReadingsTable.testId, parseInt(testId)));
    }
    
    if (status) {
      whereConditions.push(eq(schema.testReadingsTable.status, status));
    }
    
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      whereConditions.push(gte(schema.testReadingsTable.entryDate, fromDate));
    }
    
    if (dateTo) {
      const toDate = new Date(dateTo);
      whereConditions.push(lte(schema.testReadingsTable.entryDate, toDate));
    }
    
    if (whereConditions.length > 0) {
      query = query.where(and(...whereConditions));
    }
    
    // Add sorting
    const orderColumn = schema.testReadingsTable[sortBy as keyof typeof schema.testReadingsTable] || schema.testReadingsTable.entryDate;
    query = query.orderBy(sortOrder === 'asc' ? asc(orderColumn) : desc(orderColumn));
    
    // Add pagination
    query = query.limit(parseInt(limit)).offset(parseInt(offset));
    
    const readings = await query.all();
    
    return c.json({
      success: true,
      data: readings,
      count: readings.length,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: readings.length === parseInt(limit)
      }
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to fetch test readings',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// GET /api/test-readings/:sampleId/:testId/:trialNumber - Get specific test reading
testReadings.get('/:sampleId/:testId/:trialNumber', async (c) => {
  try {
    const sampleId = parseInt(c.req.param('sampleId'));
    const testId = parseInt(c.req.param('testId'));
    const trialNumber = parseInt(c.req.param('trialNumber'));
    
    if (isNaN(sampleId) || isNaN(testId) || isNaN(trialNumber)) {
      return c.json({
        success: false,
        error: 'Invalid parameter format'
      }, 400);
    }
    
    const reading = await db.select()
      .from(schema.testReadingsTable)
      .where(
        and(
          eq(schema.testReadingsTable.sampleId, sampleId),
          eq(schema.testReadingsTable.testId, testId),
          eq(schema.testReadingsTable.trialNumber, trialNumber)
        )
      )
      .get();
    
    if (!reading) {
      return c.json({
        success: false,
        error: 'Test reading not found'
      }, 404);
    }
    
    return c.json({
      success: true,
      data: reading
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to fetch test reading',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// POST /api/test-readings - Create new test reading
testReadings.post('/', async (c) => {
  try {
    const body = await c.req.json();
    
    // Validate required fields
    if (body.sampleId === undefined || body.testId === undefined || body.trialNumber === undefined) {
      return c.json({
        success: false,
        error: 'sampleId, testId, and trialNumber are required'
      }, 400);
    }
    
    const newReading = await db.insert(schema.testReadingsTable)
      .values({
        sampleId: body.sampleId,
        testId: body.testId,
        trialNumber: body.trialNumber,
        value1: body.value1 || null,
        value2: body.value2 || null,
        value3: body.value3 || null,
        trialCalc: body.trialCalc || null,
        id1: body.id1 || null,
        id2: body.id2 || null,
        id3: body.id3 || null,
        trialComplete: body.trialComplete || false,
        status: body.status || null,
        schedType: body.schedType || null,
        entryId: body.entryId || null,
        validateId: body.validateId || null,
        entryDate: body.entryDate ? new Date(body.entryDate) : new Date(),
        valiDate: body.valiDate ? new Date(body.valiDate) : null,
        mainComments: body.mainComments || null
      })
      .returning()
      .get();
    
    return c.json({
      success: true,
      data: newReading,
      message: 'Test reading created successfully'
    }, 201);
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to create test reading',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// PUT /api/test-readings/:sampleId/:testId/:trialNumber - Update test reading
testReadings.put('/:sampleId/:testId/:trialNumber', async (c) => {
  try {
    const sampleId = parseInt(c.req.param('sampleId'));
    const testId = parseInt(c.req.param('testId'));
    const trialNumber = parseInt(c.req.param('trialNumber'));
    const body = await c.req.json();
    
    if (isNaN(sampleId) || isNaN(testId) || isNaN(trialNumber)) {
      return c.json({
        success: false,
        error: 'Invalid parameter format'
      }, 400);
    }
    
    const existingReading = await db.select()
      .from(schema.testReadingsTable)
      .where(
        and(
          eq(schema.testReadingsTable.sampleId, sampleId),
          eq(schema.testReadingsTable.testId, testId),
          eq(schema.testReadingsTable.trialNumber, trialNumber)
        )
      )
      .get();
    
    if (!existingReading) {
      return c.json({
        success: false,
        error: 'Test reading not found'
      }, 404);
    }
    
    const updatedReading = await db.update(schema.testReadingsTable)
      .set({
        value1: body.value1 ?? existingReading.value1,
        value2: body.value2 ?? existingReading.value2,
        value3: body.value3 ?? existingReading.value3,
        trialCalc: body.trialCalc ?? existingReading.trialCalc,
        id1: body.id1 ?? existingReading.id1,
        id2: body.id2 ?? existingReading.id2,
        id3: body.id3 ?? existingReading.id3,
        trialComplete: body.trialComplete ?? existingReading.trialComplete,
        status: body.status ?? existingReading.status,
        schedType: body.schedType ?? existingReading.schedType,
        entryId: body.entryId ?? existingReading.entryId,
        validateId: body.validateId ?? existingReading.validateId,
        valiDate: body.valiDate ? new Date(body.valiDate) : existingReading.valiDate,
        mainComments: body.mainComments ?? existingReading.mainComments
      })
      .where(
        and(
          eq(schema.testReadingsTable.sampleId, sampleId),
          eq(schema.testReadingsTable.testId, testId),
          eq(schema.testReadingsTable.trialNumber, trialNumber)
        )
      )
      .returning()
      .get();
    
    return c.json({
      success: true,
      data: updatedReading,
      message: 'Test reading updated successfully'
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to update test reading',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// DELETE /api/test-readings/:sampleId/:testId/:trialNumber - Delete test reading
testReadings.delete('/:sampleId/:testId/:trialNumber', async (c) => {
  try {
    const sampleId = parseInt(c.req.param('sampleId'));
    const testId = parseInt(c.req.param('testId'));
    const trialNumber = parseInt(c.req.param('trialNumber'));
    
    if (isNaN(sampleId) || isNaN(testId) || isNaN(trialNumber)) {
      return c.json({
        success: false,
        error: 'Invalid parameter format'
      }, 400);
    }
    
    const existingReading = await db.select()
      .from(schema.testReadingsTable)
      .where(
        and(
          eq(schema.testReadingsTable.sampleId, sampleId),
          eq(schema.testReadingsTable.testId, testId),
          eq(schema.testReadingsTable.trialNumber, trialNumber)
        )
      )
      .get();
    
    if (!existingReading) {
      return c.json({
        success: false,
        error: 'Test reading not found'
      }, 404);
    }
    
    await db.delete(schema.testReadingsTable)
      .where(
        and(
          eq(schema.testReadingsTable.sampleId, sampleId),
          eq(schema.testReadingsTable.testId, testId),
          eq(schema.testReadingsTable.trialNumber, trialNumber)
        )
      );
    
    return c.json({
      success: true,
      message: 'Test reading deleted successfully'
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to delete test reading',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// POST /api/test-readings/bulk - Bulk create/update test readings (for multi-trial tests)
testReadings.post('/bulk', async (c) => {
  try {
    const body = await c.req.json();
    
    // Validate required fields
    if (!body.sampleId || !body.testId || !Array.isArray(body.trials)) {
      return c.json({
        success: false,
        error: 'sampleId, testId, and trials array are required'
      }, 400);
    }
    
    const { sampleId, testId, trials, entryId, status: testStatus } = body;
    const now = new Date();
    const results = [];
    
    // Process each trial
    for (const trial of trials) {
      if (!trial.trialNumber) {
        continue; // Skip trials without a number
      }
      
      // Check if trial already exists
      const existing = await db.select()
        .from(schema.testReadingsTable)
        .where(
          and(
            eq(schema.testReadingsTable.sampleId, sampleId),
            eq(schema.testReadingsTable.testId, testId),
            eq(schema.testReadingsTable.trialNumber, trial.trialNumber)
          )
        )
        .get();
      
      const trialData = {
        sampleId,
        testId,
        trialNumber: trial.trialNumber,
        value1: trial.value1 || null, // stopwatchTime
        value2: trial.value2 || null, // unused for viscosity
        value3: trial.value3 || null, // calculatedResult
        trialCalc: trial.trialCalc || null,
        id1: trial.id1 || null, // unused for viscosity
        id2: trial.id2 || null, // tube equipment ID
        id3: trial.id3 || null, // unused for viscosity
        trialComplete: trial.trialComplete !== undefined ? trial.trialComplete : (trial.selected || false),
        status: testStatus || null,
        schedType: trial.schedType || null,
        entryId: entryId || null,
        validateId: trial.validateId || null,
        entryDate: now,
        valiDate: trial.valiDate ? new Date(trial.valiDate) : null,
        mainComments: trial.mainComments || null
      };
      
      if (existing) {
        // Update existing trial
        const updated = await db.update(schema.testReadingsTable)
          .set(trialData)
          .where(
            and(
              eq(schema.testReadingsTable.sampleId, sampleId),
              eq(schema.testReadingsTable.testId, testId),
              eq(schema.testReadingsTable.trialNumber, trial.trialNumber)
            )
          )
          .returning()
          .get();
        results.push(updated);
      } else {
        // Create new trial
        const created = await db.insert(schema.testReadingsTable)
          .values(trialData)
          .returning()
          .get();
        results.push(created);
      }
    }
    
    return c.json({
      success: true,
      data: results,
      count: results.length,
      message: `Successfully saved ${results.length} trial(s)`
    }, 201);
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to bulk save test readings',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// GET /api/test-readings/sample/:sampleId/test/:testId - Get all trials for a sample/test combination
testReadings.get('/sample/:sampleId/test/:testId', async (c) => {
  try {
    const sampleId = parseInt(c.req.param('sampleId'));
    const testId = parseInt(c.req.param('testId'));
    
    if (isNaN(sampleId) || isNaN(testId)) {
      return c.json({
        success: false,
        error: 'Invalid parameter format'
      }, 400);
    }
    
    const readings = await db.select()
      .from(schema.testReadingsTable)
      .where(
        and(
          eq(schema.testReadingsTable.sampleId, sampleId),
          eq(schema.testReadingsTable.testId, testId)
        )
      )
      .orderBy(asc(schema.testReadingsTable.trialNumber))
      .all();
    
    return c.json({
      success: true,
      data: readings,
      count: readings.length
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to fetch test readings',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default testReadings;

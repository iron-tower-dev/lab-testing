import { Hono } from 'hono';
import { eq, and, desc, asc } from 'drizzle-orm';
import { db, schema } from '../db/connection';

const qualifications = new Hono();

// GET /api/qualifications - Get all qualifications with optional filters
qualifications.get('/', async (c) => {
  try {
    const { employeeId, testStandId, active, qualificationLevel } = c.req.query();
    
    let query = db.select().from(schema.lubeTechQualificationTable);
    
    const conditions = [];
    
    if (employeeId) {
      conditions.push(eq(schema.lubeTechQualificationTable.employeeId, employeeId));
    }
    
    if (testStandId) {
      const testStandIdNum = parseInt(testStandId);
      if (!isNaN(testStandIdNum)) {
        conditions.push(eq(schema.lubeTechQualificationTable.testStandId, testStandIdNum));
      }
    }
    
    if (active !== undefined) {
      conditions.push(eq(schema.lubeTechQualificationTable.active, active === 'true' ? 1 : 0));
    }
    
    if (qualificationLevel) {
      conditions.push(eq(schema.lubeTechQualificationTable.qualificationLevel, qualificationLevel));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    const results = await query
      .orderBy(
        desc(schema.lubeTechQualificationTable.certifiedDate),
        asc(schema.lubeTechQualificationTable.employeeId)
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
      error: 'Failed to fetch qualifications',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// GET /api/qualifications/:employeeId - Get all qualifications for a specific employee
qualifications.get('/:employeeId', async (c) => {
  try {
    const employeeId = c.req.param('employeeId');
    const { activeOnly } = c.req.query();
    
    let query = db.select({
      qualification: schema.lubeTechQualificationTable,
      testStand: schema.testStandTable
    })
      .from(schema.lubeTechQualificationTable)
      .leftJoin(
        schema.testStandTable,
        eq(schema.lubeTechQualificationTable.testStandId, schema.testStandTable.id)
      )
      .where(eq(schema.lubeTechQualificationTable.employeeId, employeeId));
    
    if (activeOnly === 'true') {
      query = query.where(
        and(
          eq(schema.lubeTechQualificationTable.employeeId, employeeId),
          eq(schema.lubeTechQualificationTable.active, 1)
        )
      );
    }
    
    const results = await query.all();
    
    return c.json({
      success: true,
      data: results,
      count: results.length
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to fetch employee qualifications',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// GET /api/qualifications/:employeeId/:testStandId - Check specific qualification
qualifications.get('/:employeeId/:testStandId', async (c) => {
  try {
    const employeeId = c.req.param('employeeId');
    const testStandId = parseInt(c.req.param('testStandId'));
    
    if (isNaN(testStandId)) {
      return c.json({
        success: false,
        error: 'Invalid test stand ID format'
      }, 400);
    }
    
    const qualification = await db.select({
      qualification: schema.lubeTechQualificationTable,
      testStand: schema.testStandTable
    })
      .from(schema.lubeTechQualificationTable)
      .leftJoin(
        schema.testStandTable,
        eq(schema.lubeTechQualificationTable.testStandId, schema.testStandTable.id)
      )
      .where(
        and(
          eq(schema.lubeTechQualificationTable.employeeId, employeeId),
          eq(schema.lubeTechQualificationTable.testStandId, testStandId),
          eq(schema.lubeTechQualificationTable.active, 1)
        )
      )
      .get();
    
    if (!qualification) {
      return c.json({
        success: false,
        error: 'Qualification not found or not active',
        isQualified: false
      }, 404);
    }
    
    // Check if qualification is expired
    const now = Date.now();
    const isExpired = qualification.qualification.expirationDate 
      ? qualification.qualification.expirationDate < now 
      : false;
    
    return c.json({
      success: true,
      data: qualification,
      isQualified: !isExpired,
      isExpired,
      expiresAt: qualification.qualification.expirationDate
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to check qualification',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// POST /api/qualifications - Create new qualification
qualifications.post('/', async (c) => {
  try {
    const body = await c.req.json();
    
    // Validate required fields
    if (!body.employeeId || !body.testStandId || !body.qualificationLevel || !body.certifiedDate) {
      return c.json({
        success: false,
        error: 'employeeId, testStandId, qualificationLevel, and certifiedDate are required'
      }, 400);
    }
    
    // Check if qualification already exists
    const existing = await db.select()
      .from(schema.lubeTechQualificationTable)
      .where(
        and(
          eq(schema.lubeTechQualificationTable.employeeId, body.employeeId),
          eq(schema.lubeTechQualificationTable.testStandId, body.testStandId)
        )
      )
      .get();
    
    if (existing) {
      return c.json({
        success: false,
        error: 'Qualification already exists for this employee and test stand',
        message: 'Use PUT to update existing qualification'
      }, 409);
    }
    
    const newQualification = await db.insert(schema.lubeTechQualificationTable)
      .values({
        employeeId: body.employeeId,
        testStandId: body.testStandId,
        qualificationLevel: body.qualificationLevel,
        certifiedDate: body.certifiedDate,
        certifiedBy: body.certifiedBy || null,
        expirationDate: body.expirationDate || null,
        active: body.active !== undefined ? (body.active ? 1 : 0) : 1,
        notes: body.notes || null
      })
      .returning()
      .get();
    
    return c.json({
      success: true,
      data: newQualification,
      message: 'Qualification created successfully'
    }, 201);
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to create qualification',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// PUT /api/qualifications/:id - Update qualification
qualifications.put('/:id', async (c) => {
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
      .from(schema.lubeTechQualificationTable)
      .where(eq(schema.lubeTechQualificationTable.id, id))
      .get();
    
    if (!existing) {
      return c.json({
        success: false,
        error: 'Qualification not found'
      }, 404);
    }
    
    const updated = await db.update(schema.lubeTechQualificationTable)
      .set({
        qualificationLevel: body.qualificationLevel ?? existing.qualificationLevel,
        certifiedDate: body.certifiedDate ?? existing.certifiedDate,
        certifiedBy: body.certifiedBy ?? existing.certifiedBy,
        expirationDate: body.expirationDate ?? existing.expirationDate,
        active: body.active !== undefined ? (body.active ? 1 : 0) : existing.active,
        notes: body.notes ?? existing.notes
      })
      .where(eq(schema.lubeTechQualificationTable.id, id))
      .returning()
      .get();
    
    return c.json({
      success: true,
      data: updated,
      message: 'Qualification updated successfully'
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to update qualification',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// DELETE /api/qualifications/:id - Deactivate qualification (soft delete)
qualifications.delete('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json({
        success: false,
        error: 'Invalid ID format'
      }, 400);
    }
    
    const existing = await db.select()
      .from(schema.lubeTechQualificationTable)
      .where(eq(schema.lubeTechQualificationTable.id, id))
      .get();
    
    if (!existing) {
      return c.json({
        success: false,
        error: 'Qualification not found'
      }, 404);
    }
    
    // Soft delete by setting active to false
    await db.update(schema.lubeTechQualificationTable)
      .set({ active: 0 })
      .where(eq(schema.lubeTechQualificationTable.id, id));
    
    return c.json({
      success: true,
      message: 'Qualification deactivated successfully'
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to deactivate qualification',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default qualifications;

import { Hono } from 'hono';
import { eq, like, or, and, lte, gte } from 'drizzle-orm';
import { db } from '../db/connection';
import { 
  equipmentTable, 
  equipmentTestAssociationTable,
  equipmentCalibrationHistoryTable,
  equipmentMaintenanceLogTable 
} from '../../db/schema-equipment';
import { testTable } from '../../db/schema';

const equipment = new Hono();

// GET /api/equipment - Get all equipment with optional filtering
equipment.get('/', async (c) => {
  try {
    const { type, status, search, testId, active } = c.req.query();
    
    let query = db.select().from(equipmentTable);
    const conditions = [];
    
    // Filter by equipment type (tube, thermometer, etc.)
    if (type) {
      conditions.push(eq(equipmentTable.equipmentType, type));
    }
    
    // Filter by status (active, inactive, calibration_due, etc.)
    if (status) {
      conditions.push(eq(equipmentTable.status, status));
    }
    
    // Search by name, description, or equipmentId
    if (search) {
      conditions.push(
        or(
          like(equipmentTable.name, `%${search}%`),
          like(equipmentTable.description, `%${search}%`),
          like(equipmentTable.equipmentId, `%${search}%`)
        )
      );
    }
    
    // Apply filters
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    let equipmentResults = await query.orderBy(equipmentTable.name).all();
    
    // If testId is provided, filter by test association
    if (testId) {
      const testIdNum = parseInt(testId);
      if (!isNaN(testIdNum)) {
        const associations = await db.select()
          .from(equipmentTestAssociationTable)
          .where(
            and(
              eq(equipmentTestAssociationTable.testId, testIdNum),
              eq(equipmentTestAssociationTable.active, true)
            )
          )
          .all();
        
        const equipmentIds = new Set(associations.map(a => a.equipmentId));
        equipmentResults = equipmentResults.filter(e => equipmentIds.has(e.id));
      }
    }
    
    // Filter by active calibration status if requested
    if (active === 'true') {
      const now = Date.now();
      equipmentResults = equipmentResults.filter(e => {
        return e.status === 'active' && 
               e.calibrationDueDate && 
               e.calibrationDueDate > now;
      });
    }
    
    return c.json({
      success: true,
      data: equipmentResults,
      count: equipmentResults.length
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to fetch equipment',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// GET /api/equipment/:id - Get specific equipment by ID
equipment.get('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json({
        success: false,
        error: 'Invalid ID format'
      }, 400);
    }
    
    const equipmentItem = await db.select()
      .from(equipmentTable)
      .where(eq(equipmentTable.id, id))
      .get();
    
    if (!equipmentItem) {
      return c.json({
        success: false,
        error: 'Equipment not found'
      }, 404);
    }
    
    // Get associated tests
    const testAssociations = await db.select({
      testId: equipmentTestAssociationTable.testId,
      isPrimary: equipmentTestAssociationTable.isPrimary,
      testName: testTable.name
    })
      .from(equipmentTestAssociationTable)
      .leftJoin(testTable, eq(equipmentTestAssociationTable.testId, testTable.id))
      .where(
        and(
          eq(equipmentTestAssociationTable.equipmentId, id),
          eq(equipmentTestAssociationTable.active, true)
        )
      )
      .all();
    
    return c.json({
      success: true,
      data: {
        ...equipmentItem,
        associatedTests: testAssociations
      }
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to fetch equipment',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// GET /api/equipment/test/:testId - Get equipment for specific test
equipment.get('/test/:testId', async (c) => {
  try {
    const testId = parseInt(c.req.param('testId'));
    
    if (isNaN(testId)) {
      return c.json({
        success: false,
        error: 'Invalid test ID format'
      }, 400);
    }
    
    // Get equipment associated with this test
    const associations = await db.select({
      equipmentId: equipmentTestAssociationTable.equipmentId,
      isPrimary: equipmentTestAssociationTable.isPrimary
    })
      .from(equipmentTestAssociationTable)
      .where(
        and(
          eq(equipmentTestAssociationTable.testId, testId),
          eq(equipmentTestAssociationTable.active, true)
        )
      )
      .all();
    
    if (associations.length === 0) {
      return c.json({
        success: true,
        data: [],
        count: 0,
        message: 'No equipment found for this test'
      });
    }
    
    const equipmentIds = associations.map(a => a.equipmentId);
    const equipmentResults = await db.select()
      .from(equipmentTable)
      .where(
        and(
          eq(equipmentTable.status, 'active'),
          // Filter to only equipment IDs from associations
          or(...equipmentIds.map(id => eq(equipmentTable.id, id)))
        )
      )
      .orderBy(equipmentTable.name)
      .all();
    
    // Add isPrimary flag to each equipment item
    const enrichedResults = equipmentResults.map(eq => {
      const assoc = associations.find(a => a.equipmentId === eq.id);
      return {
        ...eq,
        isPrimary: assoc?.isPrimary || false
      };
    });
    
    return c.json({
      success: true,
      data: enrichedResults,
      count: enrichedResults.length
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to fetch equipment for test',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// GET /api/equipment/type/:type - Get equipment by type
equipment.get('/type/:type', async (c) => {
  try {
    const type = c.req.param('type');
    
    const equipmentResults = await db.select()
      .from(equipmentTable)
      .where(
        and(
          eq(equipmentTable.equipmentType, type),
          eq(equipmentTable.status, 'active')
        )
      )
      .orderBy(equipmentTable.name)
      .all();
    
    return c.json({
      success: true,
      data: equipmentResults,
      count: equipmentResults.length
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to fetch equipment by type',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// POST /api/equipment - Create new equipment
equipment.post('/', async (c) => {
  try {
    const body = await c.req.json();
    
    // Validate required fields
    if (!body.equipmentId || !body.equipmentType || !body.name) {
      return c.json({
        success: false,
        error: 'equipmentId, equipmentType, and name are required'
      }, 400);
    }
    
    const now = Date.now();
    
    const newEquipment = await db.insert(equipmentTable)
      .values({
        equipmentId: body.equipmentId,
        equipmentType: body.equipmentType,
        name: body.name,
        description: body.description,
        manufacturer: body.manufacturer,
        modelNumber: body.modelNumber,
        serialNumber: body.serialNumber,
        calibrationValue: body.calibrationValue,
        calibrationUnit: body.calibrationUnit,
        calibrationDate: body.calibrationDate,
        calibrationDueDate: body.calibrationDueDate,
        calibrationCertificate: body.calibrationCertificate,
        status: body.status || 'active',
        location: body.location,
        assignedTo: body.assignedTo,
        purchaseDate: body.purchaseDate,
        purchaseCost: body.purchaseCost,
        notes: body.notes,
        createdAt: now,
        updatedAt: now,
        createdBy: body.createdBy,
        updatedBy: body.updatedBy
      })
      .returning()
      .get();
    
    return c.json({
      success: true,
      data: newEquipment,
      message: 'Equipment created successfully'
    }, 201);
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to create equipment',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// PUT /api/equipment/:id - Update equipment
equipment.put('/:id', async (c) => {
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
      .from(equipmentTable)
      .where(eq(equipmentTable.id, id))
      .get();
    
    if (!existing) {
      return c.json({
        success: false,
        error: 'Equipment not found'
      }, 404);
    }
    
    const updatedEquipment = await db.update(equipmentTable)
      .set({
        ...body,
        updatedAt: Date.now()
      })
      .where(eq(equipmentTable.id, id))
      .returning()
      .get();
    
    return c.json({
      success: true,
      data: updatedEquipment,
      message: 'Equipment updated successfully'
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to update equipment',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// DELETE /api/equipment/:id - Delete equipment (soft delete - set status to inactive)
equipment.delete('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json({
        success: false,
        error: 'Invalid ID format'
      }, 400);
    }
    
    const existing = await db.select()
      .from(equipmentTable)
      .where(eq(equipmentTable.id, id))
      .get();
    
    if (!existing) {
      return c.json({
        success: false,
        error: 'Equipment not found'
      }, 404);
    }
    
    // Soft delete by setting status to inactive
    await db.update(equipmentTable)
      .set({
        status: 'inactive',
        updatedAt: Date.now()
      })
      .where(eq(equipmentTable.id, id));
    
    return c.json({
      success: true,
      message: 'Equipment deleted (marked as inactive) successfully'
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to delete equipment',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// GET /api/equipment/:id/calibration - Get calibration history
equipment.get('/:id/calibration', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json({
        success: false,
        error: 'Invalid ID format'
      }, 400);
    }
    
    const calibrationHistory = await db.select()
      .from(equipmentCalibrationHistoryTable)
      .where(eq(equipmentCalibrationHistoryTable.equipmentId, id))
      .orderBy(equipmentCalibrationHistoryTable.calibrationDate)
      .all();
    
    return c.json({
      success: true,
      data: calibrationHistory,
      count: calibrationHistory.length
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to fetch calibration history',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// POST /api/equipment/:id/calibration - Add calibration record
equipment.post('/:id/calibration', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const body = await c.req.json();
    
    if (isNaN(id)) {
      return c.json({
        success: false,
        error: 'Invalid ID format'
      }, 400);
    }
    
    if (!body.calibrationDate || !body.calibrationValue) {
      return c.json({
        success: false,
        error: 'calibrationDate and calibrationValue are required'
      }, 400);
    }
    
    // Check if equipment exists
    const existing = await db.select()
      .from(equipmentTable)
      .where(eq(equipmentTable.id, id))
      .get();
    
    if (!existing) {
      return c.json({
        success: false,
        error: 'Equipment not found'
      }, 404);
    }
    
    const now = Date.now();
    
    const newCalibration = await db.insert(equipmentCalibrationHistoryTable)
      .values({
        equipmentId: id,
        calibrationDate: body.calibrationDate,
        calibrationValue: body.calibrationValue,
        calibrationUnit: body.calibrationUnit,
        calibratedBy: body.calibratedBy,
        certificateNumber: body.certificateNumber,
        certificateFile: body.certificateFile,
        nextCalibrationDate: body.nextCalibrationDate,
        calibrationStandard: body.calibrationStandard,
        notes: body.notes,
        createdAt: now
      })
      .returning()
      .get();
    
    // Update equipment table with latest calibration info
    await db.update(equipmentTable)
      .set({
        calibrationValue: body.calibrationValue,
        calibrationUnit: body.calibrationUnit,
        calibrationDate: body.calibrationDate,
        calibrationDueDate: body.nextCalibrationDate,
        calibrationCertificate: body.certificateFile,
        updatedAt: now
      })
      .where(eq(equipmentTable.id, id));
    
    return c.json({
      success: true,
      data: newCalibration,
      message: 'Calibration record added successfully'
    }, 201);
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to add calibration record',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default equipment;

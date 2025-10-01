import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { db } from '../../db/connection';
import { testReadingsTable } from '../../db/schema';

/**
 * Status Transitions API Routes
 * Phase 2: Status Workflow System Implementation
 * 
 * Handles status transitions for test results following the
 * 8-state workflow (X→A→T→P→E→S→D→C)
 */
const statusTransitions = new Hono();

/**
 * POST /api/status-transitions/transition
 * Perform a status transition
 */
statusTransitions.post('/transition', async (c) => {
  try {
    const body = await c.req.json();
    const { sampleId, testId, newStatus, userId, action } = body;
    
    // Validate required fields
    if (!sampleId || !testId || !newStatus || !userId) {
      return c.json({
        success: false,
        error: 'Missing required fields'
      }, 400);
    }
    
    // Get current test reading
    const currentReading = await db.select()
      .from(testReadingsTable)
      .where(and(
        eq(testReadingsTable.sampleId, sampleId),
        eq(testReadingsTable.testId, testId)
      ))
      .get();
    
    if (!currentReading) {
      return c.json({
        success: false,
        error: 'Test reading not found'
      }, 404);
    }
    
    // Perform transition based on action
    let updateData: any = { status: newStatus };
    
    switch (action) {
      case 'accept':
        // Accept results - mark as validated
        updateData.validateId = userId;
        updateData.valiDate = Math.floor(Date.now() / 1000);
        break;
        
      case 'reject':
        // Delete all readings and associated data, then recreate with awaiting status
        await db.delete(testReadingsTable)
          .where(and(
            eq(testReadingsTable.sampleId, sampleId),
            eq(testReadingsTable.testId, testId)
          ));
        
        // Re-insert placeholder record with appropriate status
        // Ferrography (210) goes to E, others go to A
        await db.insert(testReadingsTable).values({
          sampleId,
          testId,
          trialNumber: 1,
          status: testId === 210 ? 'E' : 'A',
          trialComplete: false
        });
        
        return c.json({
          success: true,
          newStatus: testId === 210 ? 'E' : 'A',
          message: 'Results rejected and reset'
        });
        
      case 'save':
      case 'partial-save':
        // Save results - mark entry date and user
        updateData.entryId = userId;
        updateData.entryDate = Math.floor(Date.now() / 1000);
        break;
        
      case 'media-ready':
        // Mark microscope work as ready
        updateData.status = 'E'; // Entry complete
        break;
        
      case 'delete':
        // Delete the reading
        await db.delete(testReadingsTable)
          .where(and(
            eq(testReadingsTable.sampleId, sampleId),
            eq(testReadingsTable.testId, testId)
          ));
        
        return c.json({
          success: true,
          message: 'Test results deleted'
        });
    }
    
    // Update status
    await db.update(testReadingsTable)
      .set(updateData)
      .where(and(
        eq(testReadingsTable.sampleId, sampleId),
        eq(testReadingsTable.testId, testId)
      ));
    
    return c.json({
      success: true,
      newStatus,
      message: `Status transitioned to ${newStatus}`
    });
  } catch (error) {
    console.error('Status transition error:', error);
    return c.json({
      success: false,
      error: 'Failed to transition status',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * GET /api/status-transitions/current/:sampleId/:testId
 * Get current status for a test
 */
statusTransitions.get('/current/:sampleId/:testId', async (c) => {
  try {
    const sampleId = parseInt(c.req.param('sampleId'));
    const testId = parseInt(c.req.param('testId'));
    
    if (isNaN(sampleId) || isNaN(testId)) {
      return c.json({
        success: false,
        error: 'Invalid sampleId or testId'
      }, 400);
    }
    
    const reading = await db.select()
      .from(testReadingsTable)
      .where(and(
        eq(testReadingsTable.sampleId, sampleId),
        eq(testReadingsTable.testId, testId)
      ))
      .get();
    
    if (!reading) {
      return c.json({
        success: false,
        error: 'Test reading not found'
      }, 404);
    }
    
    return c.json({
      success: true,
      status: reading.status,
      entryId: reading.entryId,
      validateId: reading.validateId,
      entryDate: reading.entryDate,
      valiDate: reading.valiDate
    });
  } catch (error) {
    console.error('Get status error:', error);
    return c.json({
      success: false,
      error: 'Failed to get status',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * GET /api/status-transitions/history/:sampleId/:testId
 * Get status change history for a test (if we add history tracking later)
 */
statusTransitions.get('/history/:sampleId/:testId', async (c) => {
  // Placeholder for future status history tracking
  return c.json({
    success: true,
    history: [],
    message: 'Status history tracking not yet implemented'
  });
});

export default statusTransitions;

import { Hono } from 'hono';
import { eq, and, desc } from 'drizzle-orm';
import { db, schema } from '../db/connection';

const testFormData = new Hono();

// GET /api/test-form-data - Get test form data with optional filtering
testFormData.get('/', async (c) => {
  try {
    const { sampleId, testId, status } = c.req.query();
    
    let query = db.select().from(schema.testFormDataTable);
    
    const conditions = [];
    
    if (sampleId) {
      const sampleIdNum = parseInt(sampleId);
      if (!isNaN(sampleIdNum)) {
        conditions.push(eq(schema.testFormDataTable.sampleId, sampleIdNum));
      }
    }
    
    if (testId) {
      const testIdNum = parseInt(testId);
      if (!isNaN(testIdNum)) {
        conditions.push(eq(schema.testFormDataTable.testId, testIdNum));
      }
    }
    
    if (status) {
      conditions.push(eq(schema.testFormDataTable.status, status));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    // Order by updated date descending
    query = query.orderBy(desc(schema.testFormDataTable.updatedAt));
    
    const formDataEntries = await query.all();
    
    // Parse JSON form data
    const parsedEntries = formDataEntries.map(entry => ({
      ...entry,
      formData: (() => {
        try {
          return JSON.parse(entry.formData);
        } catch {
          return null; // Return null if JSON parsing fails
        }
      })()
    }));
    
    return c.json({
      success: true,
      data: parsedEntries,
      count: parsedEntries.length
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to fetch test form data',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// GET /api/test-form-data/:sampleId/:testId - Get latest form data for a specific sample/test
testFormData.get('/:sampleId/:testId', async (c) => {
  try {
    const sampleId = parseInt(c.req.param('sampleId'));
    const testId = parseInt(c.req.param('testId'));
    
    if (isNaN(sampleId) || isNaN(testId)) {
      return c.json({
        success: false,
        error: 'Invalid sample ID or test ID format'
      }, 400);
    }
    
    // Get the latest version for this sample/test combination
    const formDataEntry = await db.select()
      .from(schema.testFormDataTable)
      .where(and(
        eq(schema.testFormDataTable.sampleId, sampleId),
        eq(schema.testFormDataTable.testId, testId)
      ))
      .orderBy(desc(schema.testFormDataTable.version))
      .get();
    
    if (!formDataEntry) {
      return c.json({
        success: false,
        error: 'Form data not found'
      }, 404);
    }
    
    // Parse JSON form data
    let parsedFormData;
    try {
      parsedFormData = JSON.parse(formDataEntry.formData);
    } catch {
      parsedFormData = null;
    }
    
    return c.json({
      success: true,
      data: {
        ...formDataEntry,
        formData: parsedFormData
      }
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to fetch form data',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// POST /api/test-form-data - Create or update test form data
testFormData.post('/', async (c) => {
  try {
    const body = await c.req.json();
    
    // Validate required fields
    if (!body.sampleId || !body.testId || !body.formData) {
      return c.json({
        success: false,
        error: 'sampleId, testId, and formData are required'
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
    
    // Convert form data to JSON string
    let formDataString: string;
    try {
      formDataString = typeof body.formData === 'object' 
        ? JSON.stringify(body.formData) 
        : String(body.formData);
    } catch {
      return c.json({
        success: false,
        error: 'Invalid form data format'
      }, 400);
    }
    
    // Check if there's already data for this sample/test (for versioning)
    const existingEntry = await db.select()
      .from(schema.testFormDataTable)
      .where(and(
        eq(schema.testFormDataTable.sampleId, body.sampleId),
        eq(schema.testFormDataTable.testId, body.testId)
      ))
      .orderBy(desc(schema.testFormDataTable.version))
      .get();
    
    const nextVersion = existingEntry ? existingEntry.version + 1 : 1;
    const now = new Date();
    
    const newFormData = await db.insert(schema.testFormDataTable)
      .values({
        sampleId: body.sampleId,
        testId: body.testId,
        formData: formDataString,
        status: body.status || 'draft',
        createdBy: body.createdBy || 'system',
        createdAt: now,
        updatedAt: now,
        version: nextVersion
      })
      .returning()
      .get();
    
    return c.json({
      success: true,
      data: {
        ...newFormData,
        formData: body.formData // Return original format
      },
      message: 'Test form data saved successfully'
    }, 201);
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to save test form data',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// PUT /api/test-form-data/:id - Update existing test form data
testFormData.put('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const body = await c.req.json();
    
    if (isNaN(id)) {
      return c.json({
        success: false,
        error: 'Invalid ID format'
      }, 400);
    }
    
    // Check if form data exists
    const existingFormData = await db.select()
      .from(schema.testFormDataTable)
      .where(eq(schema.testFormDataTable.id, id))
      .get();
    
    if (!existingFormData) {
      return c.json({
        success: false,
        error: 'Form data not found'
      }, 404);
    }
    
    // Convert form data to JSON string if provided
    let formDataString: string | undefined;
    if (body.formData !== undefined) {
      try {
        formDataString = typeof body.formData === 'object' 
          ? JSON.stringify(body.formData) 
          : String(body.formData);
      } catch {
        return c.json({
          success: false,
          error: 'Invalid form data format'
        }, 400);
      }
    }
    
    const updatedFormData = await db.update(schema.testFormDataTable)
      .set({
        formData: formDataString ?? existingFormData.formData,
        status: body.status ?? existingFormData.status,
        updatedAt: new Date(),
        // Increment version if form data changed
        version: formDataString ? existingFormData.version + 1 : existingFormData.version
      })
      .where(eq(schema.testFormDataTable.id, id))
      .returning()
      .get();
    
    return c.json({
      success: true,
      data: {
        ...updatedFormData,
        formData: body.formData ?? (() => {
          try {
            return JSON.parse(updatedFormData.formData);
          } catch {
            return updatedFormData.formData;
          }
        })()
      },
      message: 'Test form data updated successfully'
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to update test form data',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// DELETE /api/test-form-data/:id - Delete test form data
testFormData.delete('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json({
        success: false,
        error: 'Invalid ID format'
      }, 400);
    }
    
    // Check if form data exists
    const existingFormData = await db.select()
      .from(schema.testFormDataTable)
      .where(eq(schema.testFormDataTable.id, id))
      .get();
    
    if (!existingFormData) {
      return c.json({
        success: false,
        error: 'Form data not found'
      }, 404);
    }
    
    // Hard delete form data (since this is draft/temporary data)
    await db.delete(schema.testFormDataTable)
      .where(eq(schema.testFormDataTable.id, id));
    
    return c.json({
      success: true,
      message: 'Test form data deleted successfully'
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to delete test form data',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// GET /api/test-form-data/:sampleId/:testId/history - Get all versions of form data for a sample/test
testFormData.get('/:sampleId/:testId/history', async (c) => {
  try {
    const sampleId = parseInt(c.req.param('sampleId'));
    const testId = parseInt(c.req.param('testId'));
    
    if (isNaN(sampleId) || isNaN(testId)) {
      return c.json({
        success: false,
        error: 'Invalid sample ID or test ID format'
      }, 400);
    }
    
    const formDataHistory = await db.select()
      .from(schema.testFormDataTable)
      .where(and(
        eq(schema.testFormDataTable.sampleId, sampleId),
        eq(schema.testFormDataTable.testId, testId)
      ))
      .orderBy(desc(schema.testFormDataTable.version))
      .all();
    
    if (formDataHistory.length === 0) {
      return c.json({
        success: false,
        error: 'No form data history found'
      }, 404);
    }
    
    // Parse JSON form data for all entries
    const parsedHistory = formDataHistory.map(entry => ({
      ...entry,
      formData: (() => {
        try {
          return JSON.parse(entry.formData);
        } catch {
          return null;
        }
      })()
    }));
    
    return c.json({
      success: true,
      data: parsedHistory,
      count: parsedHistory.length,
      sampleId: sampleId,
      testId: testId
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to fetch form data history',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default testFormData;

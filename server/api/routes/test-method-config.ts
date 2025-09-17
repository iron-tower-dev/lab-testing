import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { db, schema } from '../db/connection';

const testMethodConfig = new Hono();

// GET /api/test-method-config - Get all test method configurations with optional filtering
testMethodConfig.get('/', async (c) => {
  try {
    const { testId, configKey } = c.req.query();
    
    let query = db.select().from(schema.testMethodConfigTable);
    
    const conditions = [];
    
    if (testId) {
      const testIdNum = parseInt(testId);
      if (!isNaN(testIdNum)) {
        conditions.push(eq(schema.testMethodConfigTable.testId, testIdNum));
      }
    }
    
    if (configKey) {
      conditions.push(eq(schema.testMethodConfigTable.configKey, configKey));
    }
    
    // Only return active configurations
    conditions.push(eq(schema.testMethodConfigTable.active, true));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    const configs = await query.all();
    
    // Parse JSON values and group by test ID and config key for easier use
    const parsedConfigs = configs.map(config => ({
      ...config,
      configValue: (() => {
        try {
          return JSON.parse(config.configValue);
        } catch {
          return config.configValue; // Return as string if not valid JSON
        }
      })()
    }));
    
    return c.json({
      success: true,
      data: parsedConfigs,
      count: parsedConfigs.length
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to fetch test method configurations',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// GET /api/test-method-config/:testId - Get all configurations for a specific test
testMethodConfig.get('/:testId', async (c) => {
  try {
    const testId = parseInt(c.req.param('testId'));
    
    if (isNaN(testId)) {
      return c.json({
        success: false,
        error: 'Invalid test ID format'
      }, 400);
    }
    
    const configs = await db.select()
      .from(schema.testMethodConfigTable)
      .where(and(
        eq(schema.testMethodConfigTable.testId, testId),
        eq(schema.testMethodConfigTable.active, true)
      ))
      .all();
    
    // Parse JSON values and organize by config key
    const parsedConfigs = configs.reduce((acc, config) => {
      let parsedValue;
      try {
        parsedValue = JSON.parse(config.configValue);
      } catch {
        parsedValue = config.configValue;
      }
      
      acc[config.configKey] = {
        id: config.id,
        testId: config.testId,
        configKey: config.configKey,
        configValue: parsedValue,
        description: config.description,
        active: config.active
      };
      return acc;
    }, {} as Record<string, any>);
    
    return c.json({
      success: true,
      data: parsedConfigs,
      testId: testId,
      count: configs.length
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to fetch configurations for test',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// GET /api/test-method-config/:testId/:configKey - Get specific configuration
testMethodConfig.get('/:testId/:configKey', async (c) => {
  try {
    const testId = parseInt(c.req.param('testId'));
    const configKey = c.req.param('configKey');
    
    if (isNaN(testId)) {
      return c.json({
        success: false,
        error: 'Invalid test ID format'
      }, 400);
    }
    
    const config = await db.select()
      .from(schema.testMethodConfigTable)
      .where(and(
        eq(schema.testMethodConfigTable.testId, testId),
        eq(schema.testMethodConfigTable.configKey, configKey),
        eq(schema.testMethodConfigTable.active, true)
      ))
      .get();
    
    if (!config) {
      return c.json({
        success: false,
        error: 'Configuration not found'
      }, 404);
    }
    
    // Parse JSON value
    let parsedValue;
    try {
      parsedValue = JSON.parse(config.configValue);
    } catch {
      parsedValue = config.configValue;
    }
    
    return c.json({
      success: true,
      data: {
        ...config,
        configValue: parsedValue
      }
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to fetch configuration',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// POST /api/test-method-config - Create a new test method configuration
testMethodConfig.post('/', async (c) => {
  try {
    const body = await c.req.json();
    
    // Validate required fields
    if (!body.testId || !body.configKey || body.configValue === undefined) {
      return c.json({
        success: false,
        error: 'testId, configKey, and configValue are required'
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
    
    // Convert configValue to JSON string if it's an object
    let configValueString: string;
    if (typeof body.configValue === 'object') {
      configValueString = JSON.stringify(body.configValue);
    } else {
      configValueString = String(body.configValue);
    }
    
    const newConfig = await db.insert(schema.testMethodConfigTable)
      .values({
        testId: body.testId,
        configKey: body.configKey,
        configValue: configValueString,
        description: body.description || null,
        active: body.active ?? true
      })
      .returning()
      .get();
    
    return c.json({
      success: true,
      data: {
        ...newConfig,
        configValue: body.configValue // Return original value format
      },
      message: 'Test method configuration created successfully'
    }, 201);
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to create test method configuration',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// PUT /api/test-method-config/:id - Update a test method configuration
testMethodConfig.put('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const body = await c.req.json();
    
    if (isNaN(id)) {
      return c.json({
        success: false,
        error: 'Invalid ID format'
      }, 400);
    }
    
    // Check if configuration exists
    const existingConfig = await db.select()
      .from(schema.testMethodConfigTable)
      .where(eq(schema.testMethodConfigTable.id, id))
      .get();
    
    if (!existingConfig) {
      return c.json({
        success: false,
        error: 'Configuration not found'
      }, 404);
    }
    
    // Convert configValue to JSON string if provided and is an object
    let configValueString: string | undefined;
    if (body.configValue !== undefined) {
      if (typeof body.configValue === 'object') {
        configValueString = JSON.stringify(body.configValue);
      } else {
        configValueString = String(body.configValue);
      }
    }
    
    const updatedConfig = await db.update(schema.testMethodConfigTable)
      .set({
        testId: body.testId ?? existingConfig.testId,
        configKey: body.configKey ?? existingConfig.configKey,
        configValue: configValueString ?? existingConfig.configValue,
        description: body.description ?? existingConfig.description,
        active: body.active ?? existingConfig.active
      })
      .where(eq(schema.testMethodConfigTable.id, id))
      .returning()
      .get();
    
    return c.json({
      success: true,
      data: {
        ...updatedConfig,
        configValue: body.configValue ?? (() => {
          try {
            return JSON.parse(updatedConfig.configValue);
          } catch {
            return updatedConfig.configValue;
          }
        })()
      },
      message: 'Test method configuration updated successfully'
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to update test method configuration',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// DELETE /api/test-method-config/:id - Delete (deactivate) a test method configuration
testMethodConfig.delete('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json({
        success: false,
        error: 'Invalid ID format'
      }, 400);
    }
    
    // Check if configuration exists
    const existingConfig = await db.select()
      .from(schema.testMethodConfigTable)
      .where(eq(schema.testMethodConfigTable.id, id))
      .get();
    
    if (!existingConfig) {
      return c.json({
        success: false,
        error: 'Configuration not found'
      }, 404);
    }
    
    // Soft delete by setting active to false
    await db.update(schema.testMethodConfigTable)
      .set({ active: false })
      .where(eq(schema.testMethodConfigTable.id, id));
    
    return c.json({
      success: true,
      message: 'Test method configuration deactivated successfully'
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to delete test method configuration',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default testMethodConfig;

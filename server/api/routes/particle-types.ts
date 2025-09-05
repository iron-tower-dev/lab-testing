import { Hono } from 'hono';
import { eq, like, or } from 'drizzle-orm';
import { db, schema } from '../db/connection';

const particleTypes = new Hono();

// GET /api/particle-types - Get all particle type definitions
particleTypes.get('/', async (c) => {
  try {
    const { search, active } = c.req.query();
    
    let query = db.select().from(schema.particleTypeDefinitionTable);
    
    if (search) {
      query = query.where(
        or(
          like(schema.particleTypeDefinitionTable.type, `%${search}%`),
          like(schema.particleTypeDefinitionTable.description, `%${search}%`)
        )
      );
    }
    
    if (active !== undefined) {
      query = query.where(eq(schema.particleTypeDefinitionTable.active, active === 'true' ? '1' : '0'));
    }
    
    const particleTypeResults = await query.orderBy(schema.particleTypeDefinitionTable.sortOrder).all();
    
    return c.json({
      success: true,
      data: particleTypeResults,
      count: particleTypeResults.length
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to fetch particle types',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// GET /api/particle-types/:id - Get specific particle type definition
particleTypes.get('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json({
        success: false,
        error: 'Invalid ID format'
      }, 400);
    }
    
    const particleType = await db.select()
      .from(schema.particleTypeDefinitionTable)
      .where(eq(schema.particleTypeDefinitionTable.id, id))
      .get();
    
    if (!particleType) {
      return c.json({
        success: false,
        error: 'Particle type not found'
      }, 404);
    }
    
    return c.json({
      success: true,
      data: particleType
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to fetch particle type',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// POST /api/particle-types - Create new particle type definition
particleTypes.post('/', async (c) => {
  try {
    const body = await c.req.json();
    
    // Validate required fields
    if (!body.type || !body.description || !body.image1 || !body.image2) {
      return c.json({
        success: false,
        error: 'Type, description, image1, and image2 are required'
      }, 400);
    }
    
    const newParticleType = await db.insert(schema.particleTypeDefinitionTable)
      .values({
        type: body.type,
        description: body.description,
        image1: body.image1,
        image2: body.image2,
        active: body.active || '1',
        sortOrder: body.sortOrder || 0
      })
      .returning()
      .get();
    
    return c.json({
      success: true,
      data: newParticleType,
      message: 'Particle type created successfully'
    }, 201);
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to create particle type',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// PUT /api/particle-types/:id - Update particle type definition
particleTypes.put('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const body = await c.req.json();
    
    if (isNaN(id)) {
      return c.json({
        success: false,
        error: 'Invalid ID format'
      }, 400);
    }
    
    const existingParticleType = await db.select()
      .from(schema.particleTypeDefinitionTable)
      .where(eq(schema.particleTypeDefinitionTable.id, id))
      .get();
    
    if (!existingParticleType) {
      return c.json({
        success: false,
        error: 'Particle type not found'
      }, 404);
    }
    
    const updatedParticleType = await db.update(schema.particleTypeDefinitionTable)
      .set({
        type: body.type ?? existingParticleType.type,
        description: body.description ?? existingParticleType.description,
        image1: body.image1 ?? existingParticleType.image1,
        image2: body.image2 ?? existingParticleType.image2,
        active: body.active ?? existingParticleType.active,
        sortOrder: body.sortOrder ?? existingParticleType.sortOrder
      })
      .where(eq(schema.particleTypeDefinitionTable.id, id))
      .returning()
      .get();
    
    return c.json({
      success: true,
      data: updatedParticleType,
      message: 'Particle type updated successfully'
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to update particle type',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// DELETE /api/particle-types/:id - Delete particle type definition
particleTypes.delete('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json({
        success: false,
        error: 'Invalid ID format'
      }, 400);
    }
    
    const existingParticleType = await db.select()
      .from(schema.particleTypeDefinitionTable)
      .where(eq(schema.particleTypeDefinitionTable.id, id))
      .get();
    
    if (!existingParticleType) {
      return c.json({
        success: false,
        error: 'Particle type not found'
      }, 404);
    }
    
    await db.delete(schema.particleTypeDefinitionTable)
      .where(eq(schema.particleTypeDefinitionTable.id, id));
    
    return c.json({
      success: true,
      message: 'Particle type deleted successfully'
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to delete particle type',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default particleTypes;

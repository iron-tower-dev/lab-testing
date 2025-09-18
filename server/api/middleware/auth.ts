import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';

// Simple authentication middleware using API keys
// In production, this would validate JWT tokens or integrate with a proper auth service
export const authMiddleware = createMiddleware(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader) {
    throw new HTTPException(401, {
      message: 'Authorization header is required'
    });
  }

  // Support both "Bearer <token>" and "ApiKey <key>" formats
  const [scheme, credentials] = authHeader.split(' ');
  
  if (!credentials) {
    throw new HTTPException(401, {
      message: 'Invalid authorization format'
    });
  }

  // Validate the token/key
  const isValid = await validateCredentials(scheme, credentials);
  
  if (!isValid) {
    throw new HTTPException(403, {
      message: 'Invalid or expired credentials'
    });
  }

  // Add user info to context for downstream handlers
  c.set('user', {
    id: 'system', // In production, extract from validated token
    role: 'admin', // In production, extract from validated token
    permissions: ['read', 'write', 'delete']
  });

  await next();
});

// Helper function to validate credentials
async function validateCredentials(scheme: string, credentials: string): Promise<boolean> {
  // For development/testing, accept a simple API key
  if (scheme.toLowerCase() === 'apikey') {
    // In production, this would check against a database or auth service
    return credentials === 'dev-api-key-2024';
  }
  
  if (scheme.toLowerCase() === 'bearer') {
    // In production, this would validate JWT tokens
    // For now, accept a simple bearer token for testing
    return credentials === 'dev-bearer-token-2024';
  }
  
  return false;
}

// Middleware that only requires read permissions
export const requireRead = createMiddleware(async (c, next) => {
  const user = c.get('user');
  
  if (!user || !user.permissions.includes('read')) {
    throw new HTTPException(403, {
      message: 'Insufficient permissions for read access'
    });
  }
  
  await next();
});

// Middleware that requires write permissions
export const requireWrite = createMiddleware(async (c, next) => {
  const user = c.get('user');
  
  if (!user || !user.permissions.includes('write')) {
    throw new HTTPException(403, {
      message: 'Insufficient permissions for write access'
    });
  }
  
  await next();
});

// Middleware that requires delete permissions
export const requireDelete = createMiddleware(async (c, next) => {
  const user = c.get('user');
  
  if (!user || !user.permissions.includes('delete')) {
    throw new HTTPException(403, {
      message: 'Insufficient permissions for delete access'
    });
  }
  
  await next();
});

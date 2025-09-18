import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { authMiddleware, requireRead, requireWrite, requireDelete } from './middleware/auth';

// Import route handlers
import tests from './routes/tests';
import particleTypes from './routes/particle-types';
import testReadings from './routes/test-readings';
import testStands from './routes/test-stands';
import testStandards from './routes/test-standards';
import testMethodConfig from './routes/test-method-config';
import testFormData from './routes/test-form-data';
import { closeDatabase } from './db/connection';

// Create the main Hono app
const app = new Hono();

// Add middleware
app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', cors({
  origin: ['http://localhost:4200', 'http://localhost:3000'], // Allow Angular dev server and any other local dev
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Apply authentication to protected routes by HTTP method
// Add global auth to write/delete operations (will be skipped if route already has auth)
app.use('/api/*', (c, next) => {
  // Skip OPTIONS requests (for CORS preflight)
  if (c.req.method === 'OPTIONS') {
    return next();
  }
  
  // Only apply global auth to mutating operations
  // Individual route handlers may override with their own auth requirements
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(c.req.method)) {
    return authMiddleware(c, next);
  }
  
  return next();
});

// Health check endpoint
app.get('/', (c) => {
  return c.json({
    success: true,
    message: 'Lab Testing API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      tests: '/api/tests',
      particleTypes: '/api/particle-types',
      testReadings: '/api/test-readings',
      testStands: '/api/test-stands',
      testStandards: '/api/test-standards',
      testMethodConfig: '/api/test-method-config',
      testFormData: '/api/test-form-data'
    }
  });
});

// API status endpoint
app.get('/api/status', authMiddleware, (c) => {
  return c.json({
    success: true,
    status: 'healthy',
    database: 'connected',
    timestamp: new Date().toISOString()
  });
});

// Mount route handlers
app.route('/api/tests', tests);
app.route('/api/particle-types', particleTypes);
app.route('/api/test-readings', testReadings);
app.route('/api/test-stands', testStands);
app.route('/api/test-standards', testStandards);
app.route('/api/test-method-config', testMethodConfig);
app.route('/api/test-form-data', testFormData);

// 404 handler for API routes
app.notFound((c) => {
  return c.json({
    success: false,
    error: 'Endpoint not found',
    message: 'The requested API endpoint does not exist',
    availableEndpoints: {
      tests: '/api/tests',
      particleTypes: '/api/particle-types',
      testReadings: '/api/test-readings',
      testStands: '/api/test-stands',
      testStandards: '/api/test-standards',
      testMethodConfig: '/api/test-method-config',
      testFormData: '/api/test-form-data'
    }
  }, 404);
});

// Error handler
app.onError((error, c) => {
  console.error('API Error:', error);
  
  return c.json({
    success: false,
    error: 'Internal server error',
    message: error.message || 'An unexpected error occurred',
    timestamp: new Date().toISOString()
  }, 500);
});

// Graceful shutdown handler
const gracefulShutdown = (signal: string) => {
  console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
  
  try {
    closeDatabase();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error closing database:', error);
  }
  
  process.exit(0);
};

// Handle process termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;

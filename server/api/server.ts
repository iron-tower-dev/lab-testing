import { serve } from '@hono/node-server';
import app from './app';

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

console.log(`🚀 Starting Lab Testing API server...`);
console.log(`📊 Database: lab.db`);
console.log(`🌐 Server will run on: http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
}, (info) => {
  console.log(`🎉 Lab Testing API is running on http://localhost:${info.port}`);
  console.log(`\n📋 Available endpoints:`);
  console.log(`  GET    /                    - API info and health check`);
  console.log(`  GET    /api/status          - API status`);
  console.log(`  
🧪 Tests:
  GET    /api/tests           - Get all tests (with filtering)`);
  console.log(`  GET    /api/tests/:id       - Get specific test`);
  console.log(`  POST   /api/tests           - Create new test`);
  console.log(`  PUT    /api/tests/:id       - Update test`);
  console.log(`  DELETE /api/tests/:id       - Delete test`);
  console.log(`
🔬 Particle Types:
  GET    /api/particle-types  - Get all particle type definitions`);
  console.log(`  GET    /api/particle-types/:id - Get specific particle type`);
  console.log(`  POST   /api/particle-types  - Create new particle type`);
  console.log(`  PUT    /api/particle-types/:id - Update particle type`);
  console.log(`  DELETE /api/particle-types/:id - Delete particle type`);
  console.log(`
📊 Test Readings:
  GET    /api/test-readings   - Get test readings (with pagination)`);
  console.log(`  GET    /api/test-readings/:sampleId/:testId/:trialNumber - Get specific reading`);
  console.log(`  POST   /api/test-readings   - Create new test reading`);
  console.log(`  PUT    /api/test-readings/:sampleId/:testId/:trialNumber - Update reading`);
  console.log(`  DELETE /api/test-readings/:sampleId/:testId/:trialNumber - Delete reading`);
  console.log(`
🔧 Test Stands:
  GET    /api/test-stands     - Get all test stands`);
  console.log(`  GET    /api/test-stands/:id - Get specific test stand`);
  console.log(`  POST   /api/test-stands     - Create new test stand`);
  console.log(`  PUT    /api/test-stands/:id - Update test stand`);
  console.log(`  DELETE /api/test-stands/:id - Delete test stand`);
  console.log(`\n💡 Try: curl http://localhost:${port}/api/status`);
});

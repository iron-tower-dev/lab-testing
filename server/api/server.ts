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
  console.log(`
📋 Test Standards:
  GET    /api/test-standards     - Get all test standards`);
  console.log(`  GET    /api/test-standards/:testId - Get standards for test`);
  console.log(`  POST   /api/test-standards     - Create new standard`);
  console.log(`  PUT    /api/test-standards/:id - Update standard`);
  console.log(`  DELETE /api/test-standards/:id - Delete standard`);
  console.log(`
⚙️  Test Method Config:
  GET    /api/test-method-config     - Get all configurations`);
  console.log(`  GET    /api/test-method-config/:testId - Get configs for test`);
  console.log(`  POST   /api/test-method-config     - Create new config`);
  console.log(`  PUT    /api/test-method-config/:id - Update config`);
  console.log(`  DELETE /api/test-method-config/:id - Delete config`);
  console.log(`
💾 Test Form Data:
  GET    /api/test-form-data     - Get all form data`);
  console.log(`  GET    /api/test-form-data/:sampleId/:testId - Get latest form data`);
  console.log(`  POST   /api/test-form-data     - Save form data`);
  console.log(`  PUT    /api/test-form-data/:id - Update form data`);
  console.log(`  DELETE /api/test-form-data/:id - Delete form data`);
  console.log(`
🔧 M&TE Equipment:
  GET    /api/equipment          - Get all equipment (with filtering)`);
  console.log(`  GET    /api/equipment/:id      - Get specific equipment`);
  console.log(`  GET    /api/equipment/test/:testId - Get equipment for test`);
  console.log(`  GET    /api/equipment/type/:type - Get equipment by type`);
  console.log(`  POST   /api/equipment          - Create new equipment`);
  console.log(`  PUT    /api/equipment/:id      - Update equipment`);
  console.log(`  DELETE /api/equipment/:id      - Delete equipment (soft)`);
  console.log(`  GET    /api/equipment/:id/calibration - Get calibration history`);
  console.log(`  POST   /api/equipment/:id/calibration - Add calibration record`);
  console.log(`\n💡 Try: curl http://localhost:${port}/api/status`);
});

# Lab Testing API

A RESTful API built with Hono.js for managing laboratory testing data with full CRUD operations on the Drizzle SQLite database.

## 🚀 Quick Start

```bash
# Start the API server
npm run api

# Start the API server with auto-reload during development
npm run api:dev
```

The API will be available at `http://localhost:3001`

## 📋 Endpoints Overview

### Health & Status
- `GET /` - API information and available endpoints
- `GET /api/status` - API health check

### 🧪 Tests
- `GET /api/tests` - Get all tests with optional filtering
- `GET /api/tests/:id` - Get specific test by ID
- `POST /api/tests` - Create new test
- `PUT /api/tests/:id` - Update existing test
- `DELETE /api/tests/:id` - Delete test

### 🔬 Particle Types
- `GET /api/particle-types` - Get all particle type definitions
- `GET /api/particle-types/:id` - Get specific particle type
- `POST /api/particle-types` - Create new particle type
- `PUT /api/particle-types/:id` - Update particle type
- `DELETE /api/particle-types/:id` - Delete particle type

### 📊 Test Readings
- `GET /api/test-readings` - Get test readings with pagination
- `GET /api/test-readings/:sampleId/:testId/:trialNumber` - Get specific reading
- `POST /api/test-readings` - Create new test reading
- `PUT /api/test-readings/:sampleId/:testId/:trialNumber` - Update reading
- `DELETE /api/test-readings/:sampleId/:testId/:trialNumber` - Delete reading

### 🔧 Test Stands
- `GET /api/test-stands` - Get all test stands
- `GET /api/test-stands/:id` - Get specific test stand
- `POST /api/test-stands` - Create new test stand
- `PUT /api/test-stands/:id` - Update test stand
- `DELETE /api/test-stands/:id` - Delete test stand

## 📖 Usage Examples

### Get all tests with filtering
```bash
# Get all tests
curl http://localhost:3001/api/tests

# Search tests by name
curl "http://localhost:3001/api/tests?search=TAN"

# Filter by lab status
curl "http://localhost:3001/api/tests?lab=true"

# Combine filters
curl "http://localhost:3001/api/tests?search=Viscosity&lab=true&schedule=true"
```

### Get test readings with pagination
```bash
# Get recent test readings
curl http://localhost:3001/api/test-readings

# Get readings for specific sample
curl "http://localhost:3001/api/test-readings?sampleId=53629"

# Get readings with date range
curl "http://localhost:3001/api/test-readings?dateFrom=2020-01-01&dateTo=2020-12-31"

# Paginate results
curl "http://localhost:3001/api/test-readings?limit=50&offset=100"
```

### Create a new test
```bash
curl -X POST http://localhost:3001/api/tests \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Test Method",
    "abbrev": "NTM",
    "lab": true,
    "schedule": false,
    "sampleVolumeRequired": 25
  }'
```

### Update a test reading
```bash
curl -X PUT http://localhost:3001/api/test-readings/53629/10/1 \
  -H "Content-Type: application/json" \
  -d '{
    "value1": 2.95,
    "value2": 0.085,
    "trialComplete": true,
    "status": "completed",
    "mainComments": "Test completed successfully"
  }'
```

## 🔍 Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": { /* response data */ },
  "count": 42,
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message",
  "timestamp": "2025-01-05T01:12:53.000Z"
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [ /* array of results */ ],
  "count": 50,
  "pagination": {
    "limit": 50,
    "offset": 100,
    "hasMore": true
  }
}
```

## 🎛️ Query Parameters

### Tests (`/api/tests`)
- `search` - Search in name, abbrev, or shortAbbrev
- `lab` - Filter by lab status (`true`/`false`)
- `schedule` - Filter by schedule status (`true`/`false`)

### Particle Types (`/api/particle-types`)
- `search` - Search in type or description
- `active` - Filter by active status (`true`/`false`)

### Test Readings (`/api/test-readings`)
- `sampleId` - Filter by sample ID
- `testId` - Filter by test ID
- `status` - Filter by status
- `dateFrom` - Filter by entry date (from)
- `dateTo` - Filter by entry date (to)
- `limit` - Number of results per page (default: 100)
- `offset` - Number of results to skip (default: 0)
- `sortBy` - Field to sort by (default: entryDate)
- `sortOrder` - Sort direction (`asc`/`desc`, default: desc)

### Test Stands (`/api/test-stands`)
- `search` - Search in name

## 🛡️ CORS Configuration

The API is configured to accept requests from:
- `http://localhost:4200` (Angular development server)
- `http://localhost:3000` (Alternative local development)

## 🗄️ Database

The API connects to the SQLite database at `./lab.db` and uses the Drizzle ORM schema defined in `src/db/schema.ts`.

## 🔧 Error Handling

The API includes comprehensive error handling:
- **400 Bad Request** - Invalid input data
- **404 Not Found** - Resource not found
- **500 Internal Server Error** - Server-side errors

All errors include detailed messages to help with debugging.

## 🚦 Development

The API server supports hot-reloading during development:

```bash
npm run api:dev
```

This will automatically restart the server when files change.

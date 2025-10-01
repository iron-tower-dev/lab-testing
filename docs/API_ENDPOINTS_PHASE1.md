# Phase 1 API Endpoints Documentation

**Version:** 1.0.0  
**Base URL:** `http://localhost:3001/api`  
**Date:** 2025-09-30

---

## Overview

Phase 1 API endpoints for:
- **Qualifications** - User test qualifications and authorization
- **Samples** - Used lube sample management
- **Lookups** - Component and location reference data

All endpoints follow REST conventions and return standardized JSON responses.

---

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message",
  "count": 10
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error description",
  "message": "Detailed error message"
}
```

---

## Qualifications API

### GET `/qualifications`
Get all qualifications with optional filters.

**Query Parameters:**
- `employeeId` (string) - Filter by employee ID
- `testStandId` (number) - Filter by test stand
- `active` (boolean) - Filter active/inactive (`true`/`false`)
- `qualificationLevel` (string) - Filter by level (`TRAIN`, `Q`, `QAG`, `MicrE`)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "employeeId": "EMP001",
      "testStandId": 1,
      "qualificationLevel": "Q",
      "certifiedDate": 1704067200000,
      "certifiedBy": "SUPERVISOR01",
      "expirationDate": 1735603200000,
      "active": 1,
      "notes": null
    }
  ],
  "count": 1
}
```

---

### GET `/qualifications/:employeeId`
Get all qualifications for a specific employee.

**Path Parameters:**
- `employeeId` (string) - Employee identifier

**Query Parameters:**
- `activeOnly` (boolean) - Return only active qualifications

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "qualification": { ...},
      "testStand": {
        "id": 1,
        "name": "Viscosity"
      }
    }
  ]
}
```

---

### GET `/qualifications/:employeeId/:testStandId`
Check if employee is qualified for a specific test stand.

**Path Parameters:**
- `employeeId` (string)
- `testStandId` (number)

**Response:**
```json
{
  "success": true,
  "data": {
    "qualification": { ... },
    "testStand": { ... }
  },
  "isQualified": true,
  "isExpired": false,
  "expiresAt": 1735603200000
}
```

**Error (404):**
```json
{
  "success": false,
  "error": "Qualification not found or not active",
  "isQualified": false
}
```

---

### POST `/qualifications`
Create a new qualification.

**Request Body:**
```json
{
  "employeeId": "EMP001",
  "testStandId": 1,
  "qualificationLevel": "Q",
  "certifiedDate": 1704067200000,
  "certifiedBy": "SUPERVISOR01",
  "expirationDate": 1735603200000,
  "active": true,
  "notes": "Initial certification"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": { ... },
  "message": "Qualification created successfully"
}
```

---

### PUT `/qualifications/:id`
Update an existing qualification.

**Path Parameters:**
- `id` (number) - Qualification ID

**Request Body:** (all fields optional)
```json
{
  "qualificationLevel": "QAG",
  "expirationDate": 1767139200000,
  "notes": "Updated to QAG level"
}
```

---

### DELETE `/qualifications/:id`
Deactivate a qualification (soft delete).

**Path Parameters:**
- `id` (number) - Qualification ID

**Response:**
```json
{
  "success": true,
  "message": "Qualification deactivated successfully"
}
```

---

## Samples API

### GET `/samples`
Get all samples with optional filters.

**Query Parameters:**
- `status` (number) - Sample status code
- `assignedTo` (string) - Filter by assigned user (use `'unassigned'` for unassigned)
- `component` (string) - Component code
- `location` (string) - Location code
- `tagNumber` (string) - Search by tag number (partial match)
- `lubeType` (string) - Filter by lube type (partial match)
- `priority` (number) - Filter by priority
- `withDetails` (boolean) - Include component/location details

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "sample": {
        "id": 1,
        "tagNumber": "TAG-001",
        "component": "ENG",
        "location": "BLDG1",
        "lubeType": "15W-40",
        "newUsedFlag": 1,
        "sampleDate": 1704067200000,
        "status": 10,
        "priority": 1,
        "assignedTo": "EMP001",
        "comments": null
      },
      "componentInfo": {
        "code": "ENG",
        "name": "Engine"
      },
      "locationInfo": {
        "code": "BLDG1",
        "name": "Building 1"
      }
    }
  ]
}
```

---

### GET `/samples/:id`
Get a specific sample with full details.

**Path Parameters:**
- `id` (number) - Sample ID

**Response:**
```json
{
  "success": true,
  "data": {
    "sample": { ... },
    "componentInfo": { ... },
    "locationInfo": { ... }
  }
}
```

---

### POST `/samples`
Create a new sample.

**Request Body:**
```json
{
  "tagNumber": "TAG-002",
  "component": "ENG",
  "location": "BLDG1",
  "lubeType": "15W-40",
  "newUsedFlag": 1,
  "sampleDate": 1704067200000,
  "status": 10,
  "priority": 1,
  "comments": "Routine sample"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": { ... },
  "message": "Sample created successfully"
}
```

---

### PUT `/samples/:id`
Update an existing sample.

**Path Parameters:**
- `id` (number) - Sample ID

**Request Body:** (all fields optional)
```json
{
  "status": 20,
  "assignedTo": "EMP001",
  "priority": 2,
  "comments": "Updated priority"
}
```

---

### PATCH `/samples/:id/status`
Update sample status (and optionally set returnedDate for status 90).

**Path Parameters:**
- `id` (number) - Sample ID

**Request Body:**
```json
{
  "status": 90
}
```

**Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Sample status updated successfully"
}
```

---

### PATCH `/samples/:id/assign`
Assign a sample to a user.

**Path Parameters:**
- `id` (number) - Sample ID

**Request Body:**
```json
{
  "assignedTo": "EMP001"
}
```

**Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Sample assigned successfully"
}
```

*Note: Automatically sets status to 20 (Assigned) and sets assignedDate.*

---

### DELETE `/samples/:id`
Delete a sample.

**Path Parameters:**
- `id` (number) - Sample ID

---

## Lookups API

### Components

#### GET `/lookups/components`
Get all components.

**Query Parameters:**
- `activeOnly` (boolean) - Return only active components (default: true)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "code": "ENG",
      "name": "Engine",
      "description": "Main engine component",
      "active": 1,
      "sortOrder": 1
    }
  ]
}
```

---

#### GET `/lookups/components/:code`
Get a specific component.

---

#### POST `/lookups/components`
Create a new component.

**Request Body:**
```json
{
  "code": "TURBO",
  "name": "Turbocharger",
  "description": "Turbocharger component",
  "active": true,
  "sortOrder": 10
}
```

---

#### PUT `/lookups/components/:code`
Update a component.

---

#### DELETE `/lookups/components/:code`
Delete or deactivate a component.

**Query Parameters:**
- `soft` (boolean) - If `true`, deactivate instead of delete (default: false)

---

### Locations

#### GET `/lookups/locations`
Get all locations.

**Query Parameters:**
- `activeOnly` (boolean) - Return only active locations (default: true)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "code": "BLDG1",
      "name": "Building 1",
      "description": "Main building facility",
      "active": 1,
      "sortOrder": 1
    }
  ]
}
```

---

#### GET `/lookups/locations/:code`
Get a specific location.

---

#### POST `/lookups/locations`
Create a new location.

**Request Body:**
```json
{
  "code": "YARD2",
  "name": "Yard 2",
  "description": "Secondary yard area",
  "active": true,
  "sortOrder": 11
}
```

---

#### PUT `/lookups/locations/:code`
Update a location.

---

#### DELETE `/lookups/locations/:code`
Delete or deactivate a location.

**Query Parameters:**
- `soft` (boolean) - If `true`, deactivate instead of delete (default: false)

---

## Status Codes

### HTTP Status Codes
- `200 OK` - Successful GET/PUT/PATCH/DELETE
- `201 Created` - Successful POST
- `400 Bad Request` - Invalid request data
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource already exists (POST only)
- `500 Internal Server Error` - Server error

### Sample Status Codes
- `10` - Received/Pending
- `20` - Assigned
- `30` - In Progress
- `40` - Testing Complete
- `50` - Validated
- `90` - Returned/Complete

### Qualification Levels
- `TRAIN` - Trainee (level 1)
- `Q` - Qualified (level 2)
- `QAG` - QA Qualified (level 3)
- `MicrE` - Microscopy Expert (level 2)

---

## Authentication

Currently, authentication middleware is applied to all POST, PUT, PATCH, and DELETE operations globally. GET requests are currently unrestricted.

To add authentication to a request:
```typescript
headers: {
  'Authorization': 'Bearer YOUR_TOKEN_HERE'
}
```

---

## Examples

### Check User Qualification
```bash
curl http://localhost:3001/api/qualifications/EMP001/1
```

### Get Pending Samples
```bash
curl "http://localhost:3001/api/samples?status=10&withDetails=true"
```

### Assign Sample
```bash
curl -X PATCH http://localhost:3001/api/samples/123/assign \
  -H "Content-Type: application/json" \
  -d '{"assignedTo": "EMP001"}'
```

### Get Active Components
```bash
curl "http://localhost:3001/api/lookups/components?activeOnly=true"
```

---

## Error Handling

All endpoints use consistent error handling:

```json
{
  "success": false,
  "error": "Brief error description",
  "message": "Detailed error message"
}
```

Common errors:
- Missing required fields
- Invalid ID format
- Resource not found
- Duplicate entries
- Database errors

---

## Rate Limiting

Currently no rate limiting is implemented. Consider adding rate limiting in production.

---

## CORS

CORS is enabled for:
- `http://localhost:4200` (Angular dev server)
- `http://localhost:3000` (Alternative dev port)

Allowed methods: `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`

---

_Last Updated: 2025-09-30_

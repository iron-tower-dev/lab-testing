# Lab Testing API - .NET 8 Web API

A .NET 8 Web API using minimal APIs, organized by route folders, with Entity Framework Core and SQLite.

## Features

- ✅ **Minimal APIs** organized into separate endpoint files by route
- ✅ **Service Layer** pattern for clean separation of concerns  
- ✅ **Entity Framework Core** with SQLite database
- ✅ **Authentication Middleware** supporting API Key and Bearer Token
- ✅ **CORS** configured for Angular and local development
- ✅ **Swagger/OpenAPI** documentation
- ✅ **Structured Error Handling** with consistent API responses
- ✅ **Graceful Shutdown** handling

## Project Structure

```
LabTestingApi/
├── Data/
│   └── ApplicationDbContext.cs    # EF Core DbContext
├── DTOs/
│   └── ApiResponse.cs             # API response wrappers
├── Endpoints/                      # Minimal API endpoints by route
│   ├── TestsEndpoints.cs
│   ├── EquipmentEndpoints.cs
│   └── SamplesEndpoints.cs
├── Middleware/
│   └── AuthenticationMiddleware.cs # Custom auth middleware
├── Models/                         # Entity models
│   ├── Test.cs
│   ├── Equipment.cs
│   ├── Sample.cs
│   └── SupportingEntities.cs
├── Services/                       # Service layer
│   ├── TestsService.cs
│   ├── EquipmentService.cs
│   └── SamplesService.cs
├── Program.cs                      # Application entry point
├── GlobalUsings.cs                 # Global using statements
├── appsettings.json               # Configuration
└── LabTestingApi.csproj           # Project file
```

## Getting Started

### Prerequisites

- .NET 8 SDK
- SQLite database (located at `../db/lab.db`)

### Installation

1. **Navigate to the project directory:**
   ```bash
   cd server-dotnet/LabTestingApi
   ```

2. **Restore dependencies:**
   ```bash
   dotnet restore
   ```

3. **Build the project:**
   ```bash
   dotnet build
   ```

4. **Run the API:**
   ```bash
   dotnet run
   ```

The API will start at `http://localhost:5000` (or `https://localhost:5001` with HTTPS).

## API Endpoints

### Health Check
- `GET /` - API status and available endpoints
- `GET /api/status` - Health check (requires authentication)

### Tests
- `GET /api/tests` - Get all tests (with optional filters: search, lab, schedule)
- `GET /api/tests/{id}` - Get test by ID
- `POST /api/tests` - Create new test (requires auth)
- `PUT /api/tests/{id}` - Update test (requires auth)
- `DELETE /api/tests/{id}` - Delete test (requires auth)

### Equipment
- `GET /api/equipment` - Get all equipment (with optional filters: type, status, search)
- `GET /api/equipment/{id}` - Get equipment by ID
- `GET /api/equipment/test/{testId}` - Get equipment for specific test
- `GET /api/equipment/type/{type}` - Get equipment by type
- `POST /api/equipment` - Create new equipment (requires auth)
- `PUT /api/equipment/{id}` - Update equipment (requires auth)
- `DELETE /api/equipment/{id}` - Soft delete equipment (requires auth)
- `GET /api/equipment/{id}/calibration` - Get calibration history
- `POST /api/equipment/{id}/calibration` - Add calibration record (requires auth)

### Samples
- `GET /api/samples` - Get all samples (with optional filters: status, assignedTo, component, location, tagNumber, priority)
- `GET /api/samples/{id}` - Get sample by ID
- `POST /api/samples` - Create new sample (requires auth)
- `PUT /api/samples/{id}` - Update sample (requires auth)
- `PATCH /api/samples/{id}/status` - Update sample status (requires auth)
- `PATCH /api/samples/{id}/assign` - Assign sample to user (requires auth)
- `DELETE /api/samples/{id}` - Delete sample (requires auth)

## Authentication

The API uses a simple authentication middleware that supports:

### API Key Authentication
```bash
curl -H "Authorization: ApiKey dev-api-key-2024" http://localhost:5000/api/status
```

### Bearer Token Authentication
```bash
curl -H "Authorization: Bearer dev-bearer-token-2024" http://localhost:5000/api/status
```

**Note:** Authentication is only required for mutating operations (POST, PUT, PATCH, DELETE). GET requests do not require authentication.

## Configuration

Edit `appsettings.json` to configure:

- **Database Connection**: Update `ConnectionStrings:DefaultConnection`
- **CORS Origins**: Modify `Cors:AllowedOrigins` array
- **Authentication**: Change dev credentials in `Authentication` section

## Database

The API uses the existing SQLite database at `../db/lab.db`. Entity Framework Core maps C# entities to the existing SQLite schema:

- Table names use snake_case (e.g., `test_table`, `equipment_table`)
- Column names use camelCase (e.g., `testStandId`, `equipmentType`)
- Timestamps are stored as Unix timestamps (milliseconds since epoch)

## Development

### Swagger UI

When running in development mode, Swagger UI is available at:
- http://localhost:5000/swagger

### Adding New Endpoints

1. Create a new service interface and implementation in `Services/`
2. Create a new endpoints file in `Endpoints/`
3. Register the service in `Program.cs`
4. Map the endpoints in `Program.cs`

Example:
```csharp
// In Program.cs
builder.Services.AddScoped<IMyService, MyService>();
app.MapMyEndpoints();
```

### Service Pattern

All database operations are handled by service classes:
- Services implement interfaces for testability
- Services use dependency injection
- Services handle error logging
- Services return nullable types for not-found scenarios

## Testing

To run the API:
```bash
dotnet run
```

To test endpoints:
```bash
# Get all tests
curl http://localhost:5000/api/tests

# Get test by ID
curl http://localhost:5000/api/tests/1

# Create test (with auth)
curl -X POST http://localhost:5000/api/tests \
  -H "Authorization: ApiKey dev-api-key-2024" \
  -H "Content-Type: application/json" \
  -d '{"name":"New Test","lab":true,"schedule":false}'
```

## Error Handling

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "count": 10,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Comparison with Hono API

This .NET API is functionally equivalent to the Hono/TypeScript API:

| Feature | Hono API | .NET API |
|---------|----------|----------|
| Framework | Hono (Node.js) | ASP.NET Core 8 |
| API Style | Route handlers | Minimal APIs |
| Database | Drizzle ORM | Entity Framework Core |
| Organization | Route files | Endpoint classes |
| Middleware | Hono middleware | ASP.NET middleware |
| Validation | Manual checks | Model validation |
| Auth | Custom middleware | Custom middleware |

## License

This project uses the same SQLite database as the existing Hono API and maintains API compatibility.

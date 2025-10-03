using LabTestingApi.Endpoints;
using LabTestingApi.Middleware;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "Lab Testing API", Version = "v1.0.0" });
});

// Configure SQLite database
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") ?? "Data Source=../db/lab.db";
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlite(connectionString));

// Register services
builder.Services.AddScoped<ITestsService, TestsService>();
builder.Services.AddScoped<IEquipmentService, EquipmentService>();
builder.Services.AddScoped<ISamplesService, SamplesService>();

// Configure CORS
var corsOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() 
    ?? new[] { "http://localhost:4200", "http://localhost:3000" };

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(corsOrigins)
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Build the app
var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "Lab Testing API v1"));
}

// Add middleware
app.UseCors();
app.UseMiddleware<AuthenticationMiddleware>();

// Health check endpoint
app.MapGet("/", () =>
{
    return Results.Ok(new
    {
        success = true,
        message = "Lab Testing API is running",
        version = "1.0.0",
        timestamp = DateTime.UtcNow.ToString("o"),
        endpoints = new
        {
            tests = "/api/tests",
            equipment = "/api/equipment",
            samples = "/api/samples",
            swagger = "/swagger"
        }
    });
}).WithTags("Health");

// API status endpoint (requires auth)
app.MapGet("/api/status", (HttpContext context) =>
{
    return Results.Ok(new
    {
        success = true,
        status = "healthy",
        database = "connected",
        timestamp = DateTime.UtcNow.ToString("o"),
        user = context.Items["UserId"]
    });
}).WithTags("Health");

// Map all endpoint groups
app.MapTestsEndpoints();
app.MapEquipmentEndpoints();
app.MapSamplesEndpoints();

// 404 handler
app.MapFallback(() =>
{
    return Results.Json(new
    {
        success = false,
        error = "Endpoint not found",
        message = "The requested API endpoint does not exist",
        timestamp = DateTime.UtcNow.ToString("o"),
        availableEndpoints = new
        {
            tests = "/api/tests",
            equipment = "/api/equipment",
            samples = "/api/samples"
        }
    }, statusCode: 404);
});

// Global exception handler
app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        context.Response.StatusCode = 500;
        context.Response.ContentType = "application/json";

        var exceptionHandlerPathFeature = 
            context.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerPathFeature>();

        await context.Response.WriteAsJsonAsync(new
        {
            success = false,
            error = "Internal server error",
            message = exceptionHandlerPathFeature?.Error.Message ?? "An unexpected error occurred",
            timestamp = DateTime.UtcNow.ToString("o")
        });
    });
});

// Graceful shutdown handler
var lifetime = app.Services.GetRequiredService<IHostApplicationLifetime>();
lifetime.ApplicationStopping.Register(() =>
{
    Console.WriteLine("\n🛑 Shutting down gracefully...");
});

lifetime.ApplicationStopped.Register(() =>
{
    Console.WriteLine("✅ Application stopped");
});

Console.WriteLine("🚀 Starting Lab Testing API...");
Console.WriteLine($"📁 Database: {connectionString}");
Console.WriteLine($"🌐 CORS Origins: {string.Join(", ", corsOrigins)}");

app.Run();

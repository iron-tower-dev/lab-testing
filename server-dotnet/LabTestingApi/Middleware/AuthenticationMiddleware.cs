namespace LabTestingApi.Middleware;

public class AuthenticationMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthenticationMiddleware> _logger;

    public AuthenticationMiddleware(RequestDelegate next, IConfiguration configuration, ILogger<AuthenticationMiddleware> logger)
    {
        _next = next;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var path = context.Request.Path.Value?.ToLower();
        var method = context.Request.Method;

        // Skip authentication for health check and OPTIONS requests
        if (path == "/" || path == "/api/status" || method == "OPTIONS")
        {
            await _next(context);
            return;
        }

        // Only require authentication for mutating operations (POST, PUT, PATCH, DELETE)
        if (method == "POST" || method == "PUT" || method == "PATCH" || method == "DELETE")
        {
            if (!context.Request.Headers.ContainsKey("Authorization"))
            {
                context.Response.StatusCode = 401;
                await context.Response.WriteAsJsonAsync(new
                {
                    success = false,
                    error = "Authorization header is required",
                    timestamp = DateTime.UtcNow
                });
                return;
            }

            var authHeader = context.Request.Headers["Authorization"].ToString();
            var parts = authHeader.Split(' ', 2);

            if (parts.Length != 2)
            {
                context.Response.StatusCode = 401;
                await context.Response.WriteAsJsonAsync(new
                {
                    success = false,
                    error = "Invalid authorization format",
                    timestamp = DateTime.UtcNow
                });
                return;
            }

            var scheme = parts[0];
            var credentials = parts[1];

            if (!ValidateCredentials(scheme, credentials))
            {
                context.Response.StatusCode = 403;
                await context.Response.WriteAsJsonAsync(new
                {
                    success = false,
                    error = "Invalid or expired credentials",
                    timestamp = DateTime.UtcNow
                });
                return;
            }

            // Add user info to context for downstream handlers
            context.Items["UserId"] = "system";
            context.Items["UserRole"] = "admin";
        }

        await _next(context);
    }

    private bool ValidateCredentials(string scheme, string credentials)
    {
        var devApiKey = _configuration["Authentication:DevApiKey"];
        var devBearerToken = _configuration["Authentication:DevBearerToken"];

        if (scheme.Equals("ApiKey", StringComparison.OrdinalIgnoreCase))
        {
            return credentials == devApiKey;
        }

        if (scheme.Equals("Bearer", StringComparison.OrdinalIgnoreCase))
        {
            return credentials == devBearerToken;
        }

        return false;
    }
}

namespace LabTestingApi.Endpoints;

public static class TestsEndpoints
{
    public static void MapTestsEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/tests")
            .WithTags("Tests")
            .WithOpenApi();

        // GET /api/tests - Get all tests with optional filtering
        group.MapGet("/", async (ITestsService testsService, 
            string? search, string? lab, string? schedule) =>
        {
            try
            {
                bool? labFilter = lab == "true" ? true : lab == "false" ? false : null;
                bool? scheduleFilter = schedule == "true" ? true : schedule == "false" ? false : null;

                var tests = await testsService.GetAllTestsAsync(search, labFilter, scheduleFilter);

                return Results.Ok(ApiResponse<List<Test>>.SuccessResponse(tests, count: tests.Count));
            }
            catch (Exception ex)
            {
                return Results.Json(
                    ApiResponse<List<Test>>.ErrorResponse("Failed to fetch tests", ex.Message),
                    statusCode: 500);
            }
        });

        // GET /api/tests/{id} - Get a specific test by ID
        group.MapGet("/{id:int}", async (ITestsService testsService, int id) =>
        {
            try
            {
                var test = await testsService.GetTestByIdAsync(id);

                if (test == null)
                {
                    return Results.Json(
                        ApiResponse<Test>.ErrorResponse("Test not found"),
                        statusCode: 404);
                }

                return Results.Ok(ApiResponse<Test>.SuccessResponse(test));
            }
            catch (Exception ex)
            {
                return Results.Json(
                    ApiResponse<Test>.ErrorResponse("Failed to fetch test", ex.Message),
                    statusCode: 500);
            }
        });

        // POST /api/tests - Create a new test
        group.MapPost("/", async (ITestsService testsService, Test test) =>
        {
            try
            {
                if (string.IsNullOrEmpty(test.Name))
                {
                    return Results.Json(
                        ApiResponse<Test>.ErrorResponse("Name is required"),
                        statusCode: 400);
                }

                var newTest = await testsService.CreateTestAsync(test);

                return Results.Json(
                    ApiResponse<Test>.SuccessResponse(newTest, "Test created successfully"),
                    statusCode: 201);
            }
            catch (Exception ex)
            {
                return Results.Json(
                    ApiResponse<Test>.ErrorResponse("Failed to create test", ex.Message),
                    statusCode: 500);
            }
        });

        // PUT /api/tests/{id} - Update a test
        group.MapPut("/{id:int}", async (ITestsService testsService, int id, Test test) =>
        {
            try
            {
                var updatedTest = await testsService.UpdateTestAsync(id, test);

                if (updatedTest == null)
                {
                    return Results.Json(
                        ApiResponse<Test>.ErrorResponse("Test not found"),
                        statusCode: 404);
                }

                return Results.Ok(ApiResponse<Test>.SuccessResponse(updatedTest, "Test updated successfully"));
            }
            catch (Exception ex)
            {
                return Results.Json(
                    ApiResponse<Test>.ErrorResponse("Failed to update test", ex.Message),
                    statusCode: 500);
            }
        });

        // DELETE /api/tests/{id} - Delete a test
        group.MapDelete("/{id:int}", async (ITestsService testsService, int id) =>
        {
            try
            {
                var deleted = await testsService.DeleteTestAsync(id);

                if (!deleted)
                {
                    return Results.Json(
                        ApiResponse.ErrorResponse("Test not found"),
                        statusCode: 404);
                }

                return Results.Ok(ApiResponse.SuccessResponse("Test deleted successfully"));
            }
            catch (Exception ex)
            {
                return Results.Json(
                    ApiResponse.ErrorResponse("Failed to delete test", ex.Message),
                    statusCode: 500);
            }
        });
    }
}

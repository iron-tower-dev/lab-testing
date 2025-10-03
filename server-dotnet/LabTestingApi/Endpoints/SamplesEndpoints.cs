namespace LabTestingApi.Endpoints;

public static class SamplesEndpoints
{
    public static void MapSamplesEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/samples")
            .WithTags("Samples")
            .WithOpenApi();

        // GET /api/samples - Get all samples with optional filters
        group.MapGet("/", async (ISamplesService samplesService,
            int? status, string? assignedTo, string? component, string? location, 
            string? tagNumber, int? priority) =>
        {
            try
            {
                var samples = await samplesService.GetAllSamplesAsync(
                    status, assignedTo, component, location, tagNumber, priority);

                return Results.Ok(ApiResponse<List<Sample>>.SuccessResponse(samples, count: samples.Count));
            }
            catch (Exception ex)
            {
                return Results.Json(
                    ApiResponse<List<Sample>>.ErrorResponse("Failed to fetch samples", ex.Message),
                    statusCode: 500);
            }
        });

        // GET /api/samples/{id} - Get specific sample with details
        group.MapGet("/{id:int}", async (ISamplesService samplesService, int id) =>
        {
            try
            {
                var sample = await samplesService.GetSampleByIdAsync(id);

                if (sample == null)
                {
                    return Results.Json(
                        ApiResponse<Sample>.ErrorResponse("Sample not found"),
                        statusCode: 404);
                }

                return Results.Ok(ApiResponse<Sample>.SuccessResponse(sample));
            }
            catch (Exception ex)
            {
                return Results.Json(
                    ApiResponse<Sample>.ErrorResponse("Failed to fetch sample", ex.Message),
                    statusCode: 500);
            }
        });

        // POST /api/samples - Create new sample
        group.MapPost("/", async (ISamplesService samplesService, Sample sample) =>
        {
            try
            {
                if (string.IsNullOrEmpty(sample.TagNumber))
                {
                    return Results.Json(
                        ApiResponse<Sample>.ErrorResponse("tagNumber is required"),
                        statusCode: 400);
                }

                var newSample = await samplesService.CreateSampleAsync(sample);

                return Results.Json(
                    ApiResponse<Sample>.SuccessResponse(newSample, "Sample created successfully"),
                    statusCode: 201);
            }
            catch (Exception ex)
            {
                return Results.Json(
                    ApiResponse<Sample>.ErrorResponse("Failed to create sample", ex.Message),
                    statusCode: 500);
            }
        });

        // PUT /api/samples/{id} - Update sample
        group.MapPut("/{id:int}", async (ISamplesService samplesService, int id, Sample sample) =>
        {
            try
            {
                var updatedSample = await samplesService.UpdateSampleAsync(id, sample);

                if (updatedSample == null)
                {
                    return Results.Json(
                        ApiResponse<Sample>.ErrorResponse("Sample not found"),
                        statusCode: 404);
                }

                return Results.Ok(ApiResponse<Sample>.SuccessResponse(updatedSample, "Sample updated successfully"));
            }
            catch (Exception ex)
            {
                return Results.Json(
                    ApiResponse<Sample>.ErrorResponse("Failed to update sample", ex.Message),
                    statusCode: 500);
            }
        });

        // PATCH /api/samples/{id}/status - Update sample status
        group.MapPatch("/{id:int}/status", async (ISamplesService samplesService, int id, 
            UpdateStatusRequest request) =>
        {
            try
            {
                var updatedSample = await samplesService.UpdateSampleStatusAsync(id, request.Status);

                if (updatedSample == null)
                {
                    return Results.Json(
                        ApiResponse<Sample>.ErrorResponse("Sample not found"),
                        statusCode: 404);
                }

                return Results.Ok(ApiResponse<Sample>.SuccessResponse(updatedSample, "Sample status updated successfully"));
            }
            catch (Exception ex)
            {
                return Results.Json(
                    ApiResponse<Sample>.ErrorResponse("Failed to update sample status", ex.Message),
                    statusCode: 500);
            }
        });

        // PATCH /api/samples/{id}/assign - Assign sample to user
        group.MapPatch("/{id:int}/assign", async (ISamplesService samplesService, int id, 
            AssignSampleRequest request) =>
        {
            try
            {
                if (string.IsNullOrEmpty(request.AssignedTo))
                {
                    return Results.Json(
                        ApiResponse<Sample>.ErrorResponse("assignedTo is required"),
                        statusCode: 400);
                }

                var updatedSample = await samplesService.AssignSampleAsync(id, request.AssignedTo);

                if (updatedSample == null)
                {
                    return Results.Json(
                        ApiResponse<Sample>.ErrorResponse("Sample not found"),
                        statusCode: 404);
                }

                return Results.Ok(ApiResponse<Sample>.SuccessResponse(updatedSample, "Sample assigned successfully"));
            }
            catch (Exception ex)
            {
                return Results.Json(
                    ApiResponse<Sample>.ErrorResponse("Failed to assign sample", ex.Message),
                    statusCode: 500);
            }
        });

        // DELETE /api/samples/{id} - Delete sample
        group.MapDelete("/{id:int}", async (ISamplesService samplesService, int id) =>
        {
            try
            {
                var deleted = await samplesService.DeleteSampleAsync(id);

                if (!deleted)
                {
                    return Results.Json(
                        ApiResponse.ErrorResponse("Sample not found"),
                        statusCode: 404);
                }

                return Results.Ok(ApiResponse.SuccessResponse("Sample deleted successfully"));
            }
            catch (Exception ex)
            {
                return Results.Json(
                    ApiResponse.ErrorResponse("Failed to delete sample", ex.Message),
                    statusCode: 500);
            }
        });
    }

    private record UpdateStatusRequest(int Status);
    private record AssignSampleRequest(string AssignedTo);
}

namespace LabTestingApi.Endpoints;

public static class EquipmentEndpoints
{
    public static void MapEquipmentEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/equipment")
            .WithTags("Equipment")
            .WithOpenApi();

        // GET /api/equipment - Get all equipment with optional filtering
        group.MapGet("/", async (IEquipmentService equipmentService,
            string? type, string? status, string? search) =>
        {
            try
            {
                var equipment = await equipmentService.GetAllEquipmentAsync(type, status, search);

                return Results.Ok(ApiResponse<List<Equipment>>.SuccessResponse(equipment, count: equipment.Count));
            }
            catch (Exception ex)
            {
                return Results.Json(
                    ApiResponse<List<Equipment>>.ErrorResponse("Failed to fetch equipment", ex.Message),
                    statusCode: 500);
            }
        });

        // GET /api/equipment/{id} - Get specific equipment by ID
        group.MapGet("/{id:int}", async (IEquipmentService equipmentService, int id) =>
        {
            try
            {
                var equipment = await equipmentService.GetEquipmentByIdAsync(id);

                if (equipment == null)
                {
                    return Results.Json(
                        ApiResponse<Equipment>.ErrorResponse("Equipment not found"),
                        statusCode: 404);
                }

                return Results.Ok(ApiResponse<Equipment>.SuccessResponse(equipment));
            }
            catch (Exception ex)
            {
                return Results.Json(
                    ApiResponse<Equipment>.ErrorResponse("Failed to fetch equipment", ex.Message),
                    statusCode: 500);
            }
        });

        // GET /api/equipment/test/{testId} - Get equipment for specific test
        group.MapGet("/test/{testId:int}", async (IEquipmentService equipmentService, int testId) =>
        {
            try
            {
                var equipment = await equipmentService.GetEquipmentByTestIdAsync(testId);

                return Results.Ok(ApiResponse<List<Equipment>>.SuccessResponse(equipment, count: equipment.Count));
            }
            catch (Exception ex)
            {
                return Results.Json(
                    ApiResponse<List<Equipment>>.ErrorResponse("Failed to fetch equipment for test", ex.Message),
                    statusCode: 500);
            }
        });

        // GET /api/equipment/type/{type} - Get equipment by type
        group.MapGet("/type/{type}", async (IEquipmentService equipmentService, string type) =>
        {
            try
            {
                var equipment = await equipmentService.GetEquipmentByTypeAsync(type);

                return Results.Ok(ApiResponse<List<Equipment>>.SuccessResponse(equipment, count: equipment.Count));
            }
            catch (Exception ex)
            {
                return Results.Json(
                    ApiResponse<List<Equipment>>.ErrorResponse("Failed to fetch equipment by type", ex.Message),
                    statusCode: 500);
            }
        });

        // POST /api/equipment - Create new equipment
        group.MapPost("/", async (IEquipmentService equipmentService, Equipment equipment) =>
        {
            try
            {
                if (string.IsNullOrEmpty(equipment.EquipmentId) || 
                    string.IsNullOrEmpty(equipment.EquipmentType) || 
                    string.IsNullOrEmpty(equipment.Name))
                {
                    return Results.Json(
                        ApiResponse<Equipment>.ErrorResponse("equipmentId, equipmentType, and name are required"),
                        statusCode: 400);
                }

                var newEquipment = await equipmentService.CreateEquipmentAsync(equipment);

                return Results.Json(
                    ApiResponse<Equipment>.SuccessResponse(newEquipment, "Equipment created successfully"),
                    statusCode: 201);
            }
            catch (Exception ex)
            {
                return Results.Json(
                    ApiResponse<Equipment>.ErrorResponse("Failed to create equipment", ex.Message),
                    statusCode: 500);
            }
        });

        // PUT /api/equipment/{id} - Update equipment
        group.MapPut("/{id:int}", async (IEquipmentService equipmentService, int id, Equipment equipment) =>
        {
            try
            {
                var updatedEquipment = await equipmentService.UpdateEquipmentAsync(id, equipment);

                if (updatedEquipment == null)
                {
                    return Results.Json(
                        ApiResponse<Equipment>.ErrorResponse("Equipment not found"),
                        statusCode: 404);
                }

                return Results.Ok(ApiResponse<Equipment>.SuccessResponse(updatedEquipment, "Equipment updated successfully"));
            }
            catch (Exception ex)
            {
                return Results.Json(
                    ApiResponse<Equipment>.ErrorResponse("Failed to update equipment", ex.Message),
                    statusCode: 500);
            }
        });

        // DELETE /api/equipment/{id} - Delete equipment (soft delete)
        group.MapDelete("/{id:int}", async (IEquipmentService equipmentService, int id) =>
        {
            try
            {
                var deleted = await equipmentService.DeleteEquipmentAsync(id);

                if (!deleted)
                {
                    return Results.Json(
                        ApiResponse.ErrorResponse("Equipment not found"),
                        statusCode: 404);
                }

                return Results.Ok(ApiResponse.SuccessResponse("Equipment deleted (marked as inactive) successfully"));
            }
            catch (Exception ex)
            {
                return Results.Json(
                    ApiResponse.ErrorResponse("Failed to delete equipment", ex.Message),
                    statusCode: 500);
            }
        });

        // GET /api/equipment/{id}/calibration - Get calibration history
        group.MapGet("/{id:int}/calibration", async (IEquipmentService equipmentService, int id) =>
        {
            try
            {
                var history = await equipmentService.GetCalibrationHistoryAsync(id);

                return Results.Ok(ApiResponse<List<EquipmentCalibrationHistory>>.SuccessResponse(history, count: history.Count));
            }
            catch (Exception ex)
            {
                return Results.Json(
                    ApiResponse<List<EquipmentCalibrationHistory>>.ErrorResponse("Failed to fetch calibration history", ex.Message),
                    statusCode: 500);
            }
        });

        // POST /api/equipment/{id}/calibration - Add calibration record
        group.MapPost("/{id:int}/calibration", async (IEquipmentService equipmentService, int id, 
            EquipmentCalibrationHistory record) =>
        {
            try
            {
                if (record.CalibrationDate == default || record.CalibrationValue == null)
                {
                    return Results.Json(
                        ApiResponse<EquipmentCalibrationHistory>.ErrorResponse("calibrationDate and calibrationValue are required"),
                        statusCode: 400);
                }

                var newRecord = await equipmentService.AddCalibrationRecordAsync(id, record);

                return Results.Json(
                    ApiResponse<EquipmentCalibrationHistory>.SuccessResponse(newRecord, "Calibration record added successfully"),
                    statusCode: 201);
            }
            catch (Exception ex)
            {
                return Results.Json(
                    ApiResponse<EquipmentCalibrationHistory>.ErrorResponse("Failed to add calibration record", ex.Message),
                    statusCode: 500);
            }
        });
    }
}

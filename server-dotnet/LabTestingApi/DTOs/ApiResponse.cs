namespace LabTestingApi.DTOs;

public class ApiResponse<T>
{
    public bool Success { get; set; }
    public T? Data { get; set; }
    public int? Count { get; set; }
    public string? Message { get; set; }
    public string? Error { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public static ApiResponse<T> SuccessResponse(T data, string? message = null, int? count = null)
    {
        return new ApiResponse<T>
        {
            Success = true,
            Data = data,
            Message = message,
            Count = count
        };
    }

    public static ApiResponse<T> ErrorResponse(string error, string? message = null)
    {
        return new ApiResponse<T>
        {
            Success = false,
            Error = error,
            Message = message
        };
    }
}

public class ApiResponse
{
    public bool Success { get; set; }
    public string? Message { get; set; }
    public string? Error { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public static ApiResponse SuccessResponse(string? message = null)
    {
        return new ApiResponse
        {
            Success = true,
            Message = message
        };
    }

    public static ApiResponse ErrorResponse(string error, string? message = null)
    {
        return new ApiResponse
        {
            Success = false,
            Error = error,
            Message = message
        };
    }
}

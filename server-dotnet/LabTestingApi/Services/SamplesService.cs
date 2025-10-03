namespace LabTestingApi.Services;

public interface ISamplesService
{
    Task<List<Sample>> GetAllSamplesAsync(int? status = null, string? assignedTo = null, 
        string? component = null, string? location = null, string? tagNumber = null, int? priority = null);
    Task<Sample?> GetSampleByIdAsync(int id);
    Task<Sample> CreateSampleAsync(Sample sample);
    Task<Sample?> UpdateSampleAsync(int id, Sample sample);
    Task<Sample?> UpdateSampleStatusAsync(int id, int status);
    Task<Sample?> AssignSampleAsync(int id, string assignedTo);
    Task<bool> DeleteSampleAsync(int id);
}

public class SamplesService : ISamplesService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<SamplesService> _logger;

    public SamplesService(ApplicationDbContext context, ILogger<SamplesService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<List<Sample>> GetAllSamplesAsync(int? status = null, string? assignedTo = null, 
        string? component = null, string? location = null, string? tagNumber = null, int? priority = null)
    {
        try
        {
            var query = _context.Samples.AsQueryable();

            if (status.HasValue)
            {
                query = query.Where(s => s.Status == status.Value);
            }

            if (!string.IsNullOrEmpty(assignedTo))
            {
                if (assignedTo == "unassigned")
                {
                    query = query.Where(s => s.AssignedTo == null);
                }
                else
                {
                    query = query.Where(s => s.AssignedTo == assignedTo);
                }
            }

            if (!string.IsNullOrEmpty(component))
            {
                query = query.Where(s => s.Component == component);
            }

            if (!string.IsNullOrEmpty(location))
            {
                query = query.Where(s => s.Location == location);
            }

            if (!string.IsNullOrEmpty(tagNumber))
            {
                query = query.Where(s => EF.Functions.Like(s.TagNumber ?? "", $"%{tagNumber}%"));
            }

            if (priority.HasValue)
            {
                query = query.Where(s => s.Priority == priority.Value);
            }

            return await query
                .OrderByDescending(s => s.Priority)
                .ThenByDescending(s => s.SampleDate)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching samples");
            throw;
        }
    }

    public async Task<Sample?> GetSampleByIdAsync(int id)
    {
        try
        {
            return await _context.Samples
                .Include(s => s.TestReadings)
                .Include(s => s.ParticleTypes)
                .FirstOrDefaultAsync(s => s.Id == id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching sample with id {Id}", id);
            throw;
        }
    }

    public async Task<Sample> CreateSampleAsync(Sample sample)
    {
        try
        {
            // Set defaults
            if (!sample.Status.HasValue)
            {
                sample.Status = 10; // Default to "Received/Pending"
            }

            if (!sample.ReceivedDate.HasValue)
            {
                sample.ReceivedDate = DateTime.UtcNow;
            }

            _context.Samples.Add(sample);
            await _context.SaveChangesAsync();
            return sample;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating sample");
            throw;
        }
    }

    public async Task<Sample?> UpdateSampleAsync(int id, Sample sample)
    {
        try
        {
            var existing = await _context.Samples.FindAsync(id);
            if (existing == null)
                return null;

            existing.TagNumber = sample.TagNumber ?? existing.TagNumber;
            existing.Component = sample.Component ?? existing.Component;
            existing.Location = sample.Location ?? existing.Location;
            existing.LubeType = sample.LubeType ?? existing.LubeType;
            existing.NewUsedFlag = sample.NewUsedFlag ?? existing.NewUsedFlag;
            existing.SampleDate = sample.SampleDate ?? existing.SampleDate;
            existing.Status = sample.Status ?? existing.Status;
            existing.ReturnedDate = sample.ReturnedDate ?? existing.ReturnedDate;
            existing.Priority = sample.Priority ?? existing.Priority;
            existing.AssignedDate = sample.AssignedDate ?? existing.AssignedDate;
            existing.AssignedTo = sample.AssignedTo ?? existing.AssignedTo;
            existing.ReceivedDate = sample.ReceivedDate ?? existing.ReceivedDate;
            existing.OilAdded = sample.OilAdded ?? existing.OilAdded;
            existing.Comments = sample.Comments ?? existing.Comments;

            await _context.SaveChangesAsync();
            return existing;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating sample with id {Id}", id);
            throw;
        }
    }

    public async Task<Sample?> UpdateSampleStatusAsync(int id, int status)
    {
        try
        {
            var sample = await _context.Samples.FindAsync(id);
            if (sample == null)
                return null;

            sample.Status = status;

            // If status is 90 (Complete) and returnedDate is not set, set it
            if (status == 90 && !sample.ReturnedDate.HasValue)
            {
                sample.ReturnedDate = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return sample;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating sample status for id {Id}", id);
            throw;
        }
    }

    public async Task<Sample?> AssignSampleAsync(int id, string assignedTo)
    {
        try
        {
            var sample = await _context.Samples.FindAsync(id);
            if (sample == null)
                return null;

            sample.AssignedTo = assignedTo;
            sample.AssignedDate = DateTime.UtcNow;
            sample.Status = 20; // Assigned status

            await _context.SaveChangesAsync();
            return sample;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error assigning sample with id {Id}", id);
            throw;
        }
    }

    public async Task<bool> DeleteSampleAsync(int id)
    {
        try
        {
            var sample = await _context.Samples.FindAsync(id);
            if (sample == null)
                return false;

            _context.Samples.Remove(sample);
            await _context.SaveChangesAsync();
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting sample with id {Id}", id);
            throw;
        }
    }
}

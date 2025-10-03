namespace LabTestingApi.Services;

public interface ITestsService
{
    Task<List<Test>> GetAllTestsAsync(string? search = null, bool? lab = null, bool? schedule = null);
    Task<Test?> GetTestByIdAsync(int id);
    Task<Test> CreateTestAsync(Test test);
    Task<Test?> UpdateTestAsync(int id, Test test);
    Task<bool> DeleteTestAsync(int id);
}

public class TestsService : ITestsService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<TestsService> _logger;

    public TestsService(ApplicationDbContext context, ILogger<TestsService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<List<Test>> GetAllTestsAsync(string? search = null, bool? lab = null, bool? schedule = null)
    {
        try
        {
            var query = _context.Tests.AsQueryable();

            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(t => 
                    EF.Functions.Like(t.Name ?? "", $"%{search}%") ||
                    EF.Functions.Like(t.Abbrev ?? "", $"%{search}%") ||
                    EF.Functions.Like(t.ShortAbbrev ?? "", $"%{search}%"));
            }

            if (lab.HasValue)
            {
                query = query.Where(t => t.Lab == lab.Value);
            }

            if (schedule.HasValue)
            {
                query = query.Where(t => t.Schedule == schedule.Value);
            }

            return await query.ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching tests");
            throw;
        }
    }

    public async Task<Test?> GetTestByIdAsync(int id)
    {
        try
        {
            return await _context.Tests
                .Include(t => t.TestStand)
                .Include(t => t.TestStandards)
                .FirstOrDefaultAsync(t => t.Id == id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching test with id {Id}", id);
            throw;
        }
    }

    public async Task<Test> CreateTestAsync(Test test)
    {
        try
        {
            _context.Tests.Add(test);
            await _context.SaveChangesAsync();
            return test;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating test");
            throw;
        }
    }

    public async Task<Test?> UpdateTestAsync(int id, Test test)
    {
        try
        {
            var existing = await _context.Tests.FindAsync(id);
            if (existing == null)
                return null;

            existing.Name = test.Name ?? existing.Name;
            existing.TestStandId = test.TestStandId ?? existing.TestStandId;
            existing.SampleVolumeRequired = test.SampleVolumeRequired ?? existing.SampleVolumeRequired;
            existing.Exclude = test.Exclude ?? existing.Exclude;
            existing.Abbrev = test.Abbrev ?? existing.Abbrev;
            existing.DisplayedGroupId = test.DisplayedGroupId ?? existing.DisplayedGroupId;
            existing.GroupName = test.GroupName ?? existing.GroupName;
            existing.Lab = test.Lab;
            existing.Schedule = test.Schedule;
            existing.ShortAbbrev = test.ShortAbbrev ?? existing.ShortAbbrev;

            await _context.SaveChangesAsync();
            return existing;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating test with id {Id}", id);
            throw;
        }
    }

    public async Task<bool> DeleteTestAsync(int id)
    {
        try
        {
            var test = await _context.Tests.FindAsync(id);
            if (test == null)
                return false;

            _context.Tests.Remove(test);
            await _context.SaveChangesAsync();
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting test with id {Id}", id);
            throw;
        }
    }
}

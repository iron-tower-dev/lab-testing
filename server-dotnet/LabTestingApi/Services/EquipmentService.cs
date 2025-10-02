namespace LabTestingApi.Services;

public interface IEquipmentService
{
    Task<List<Equipment>> GetAllEquipmentAsync(string? type = null, string? status = null, string? search = null);
    Task<Equipment?> GetEquipmentByIdAsync(int id);
    Task<List<Equipment>> GetEquipmentByTestIdAsync(int testId);
    Task<List<Equipment>> GetEquipmentByTypeAsync(string type);
    Task<Equipment> CreateEquipmentAsync(Equipment equipment);
    Task<Equipment?> UpdateEquipmentAsync(int id, Equipment equipment);
    Task<bool> DeleteEquipmentAsync(int id);
    Task<List<EquipmentCalibrationHistory>> GetCalibrationHistoryAsync(int equipmentId);
    Task<EquipmentCalibrationHistory> AddCalibrationRecordAsync(int equipmentId, EquipmentCalibrationHistory record);
}

public class EquipmentService : IEquipmentService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<EquipmentService> _logger;

    public EquipmentService(ApplicationDbContext context, ILogger<EquipmentService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<List<Equipment>> GetAllEquipmentAsync(string? type = null, string? status = null, string? search = null)
    {
        try
        {
            var query = _context.Equipment.AsQueryable();

            if (!string.IsNullOrEmpty(type))
            {
                query = query.Where(e => e.EquipmentType == type);
            }

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(e => e.Status == status);
            }

            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(e =>
                    EF.Functions.Like(e.Name, $"%{search}%") ||
                    EF.Functions.Like(e.Description ?? "", $"%{search}%") ||
                    EF.Functions.Like(e.EquipmentId, $"%{search}%"));
            }

            return await query.OrderBy(e => e.Name).ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching equipment");
            throw;
        }
    }

    public async Task<Equipment?> GetEquipmentByIdAsync(int id)
    {
        try
        {
            return await _context.Equipment
                .Include(e => e.TestAssociations)
                    .ThenInclude(ta => ta.Test)
                .FirstOrDefaultAsync(e => e.Id == id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching equipment with id {Id}", id);
            throw;
        }
    }

    public async Task<List<Equipment>> GetEquipmentByTestIdAsync(int testId)
    {
        try
        {
            var equipmentIds = await _context.EquipmentTestAssociations
                .Where(eta => eta.TestId == testId && eta.Active)
                .Select(eta => eta.EquipmentId)
                .ToListAsync();

            return await _context.Equipment
                .Where(e => equipmentIds.Contains(e.Id) && e.Status == "active")
                .OrderBy(e => e.Name)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching equipment for test {TestId}", testId);
            throw;
        }
    }

    public async Task<List<Equipment>> GetEquipmentByTypeAsync(string type)
    {
        try
        {
            return await _context.Equipment
                .Where(e => e.EquipmentType == type && e.Status == "active")
                .OrderBy(e => e.Name)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching equipment by type {Type}", type);
            throw;
        }
    }

    public async Task<Equipment> CreateEquipmentAsync(Equipment equipment)
    {
        try
        {
            equipment.CreatedAt = DateTime.UtcNow;
            equipment.UpdatedAt = DateTime.UtcNow;
            
            _context.Equipment.Add(equipment);
            await _context.SaveChangesAsync();
            return equipment;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating equipment");
            throw;
        }
    }

    public async Task<Equipment?> UpdateEquipmentAsync(int id, Equipment equipment)
    {
        try
        {
            var existing = await _context.Equipment.FindAsync(id);
            if (existing == null)
                return null;

            existing.EquipmentId = equipment.EquipmentId;
            existing.EquipmentType = equipment.EquipmentType;
            existing.Name = equipment.Name;
            existing.Description = equipment.Description;
            existing.Manufacturer = equipment.Manufacturer;
            existing.ModelNumber = equipment.ModelNumber;
            existing.SerialNumber = equipment.SerialNumber;
            existing.CalibrationValue = equipment.CalibrationValue;
            existing.CalibrationUnit = equipment.CalibrationUnit;
            existing.CalibrationDate = equipment.CalibrationDate;
            existing.CalibrationDueDate = equipment.CalibrationDueDate;
            existing.CalibrationCertificate = equipment.CalibrationCertificate;
            existing.Status = equipment.Status;
            existing.Location = equipment.Location;
            existing.AssignedTo = equipment.AssignedTo;
            existing.PurchaseDate = equipment.PurchaseDate;
            existing.PurchaseCost = equipment.PurchaseCost;
            existing.Notes = equipment.Notes;
            existing.UpdatedAt = DateTime.UtcNow;
            existing.UpdatedBy = equipment.UpdatedBy;

            await _context.SaveChangesAsync();
            return existing;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating equipment with id {Id}", id);
            throw;
        }
    }

    public async Task<bool> DeleteEquipmentAsync(int id)
    {
        try
        {
            var equipment = await _context.Equipment.FindAsync(id);
            if (equipment == null)
                return false;

            // Soft delete by setting status to inactive
            equipment.Status = "inactive";
            equipment.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting equipment with id {Id}", id);
            throw;
        }
    }

    public async Task<List<EquipmentCalibrationHistory>> GetCalibrationHistoryAsync(int equipmentId)
    {
        try
        {
            return await _context.EquipmentCalibrationHistory
                .Where(ch => ch.EquipmentId == equipmentId)
                .OrderByDescending(ch => ch.CalibrationDate)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching calibration history for equipment {EquipmentId}", equipmentId);
            throw;
        }
    }

    public async Task<EquipmentCalibrationHistory> AddCalibrationRecordAsync(int equipmentId, EquipmentCalibrationHistory record)
    {
        try
        {
            record.EquipmentId = equipmentId;
            record.CreatedAt = DateTime.UtcNow;

            _context.EquipmentCalibrationHistory.Add(record);

            // Update equipment with latest calibration info
            var equipment = await _context.Equipment.FindAsync(equipmentId);
            if (equipment != null)
            {
                equipment.CalibrationValue = record.CalibrationValue;
                equipment.CalibrationUnit = record.CalibrationUnit;
                equipment.CalibrationDate = record.CalibrationDate;
                equipment.CalibrationDueDate = record.NextCalibrationDate;
                equipment.CalibrationCertificate = record.CertificateFile;
                equipment.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return record;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding calibration record for equipment {EquipmentId}", equipmentId);
            throw;
        }
    }
}

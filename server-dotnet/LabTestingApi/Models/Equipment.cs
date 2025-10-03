namespace LabTestingApi.Models;

public class Equipment
{
    public int Id { get; set; }
    public string EquipmentId { get; set; } = string.Empty;
    public string EquipmentType { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Manufacturer { get; set; }
    public string? ModelNumber { get; set; }
    public string? SerialNumber { get; set; }

    // Calibration data
    public double? CalibrationValue { get; set; }
    public string? CalibrationUnit { get; set; }
    public DateTime? CalibrationDate { get; set; }
    public DateTime? CalibrationDueDate { get; set; }
    public string? CalibrationCertificate { get; set; }

    // Status
    public string Status { get; set; } = "active";
    public string? Location { get; set; }
    public string? AssignedTo { get; set; }

    // Metadata
    public DateTime? PurchaseDate { get; set; }
    public double? PurchaseCost { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }

    // Navigation properties
    public ICollection<EquipmentTestAssociation> TestAssociations { get; set; } = new List<EquipmentTestAssociation>();
    public ICollection<EquipmentCalibrationHistory> CalibrationHistory { get; set; } = new List<EquipmentCalibrationHistory>();
    public ICollection<EquipmentMaintenanceLog> MaintenanceLogs { get; set; } = new List<EquipmentMaintenanceLog>();
}

namespace LabTestingApi.Models;

public class TestStand
{
    public int Id { get; set; }
    public string? Name { get; set; }

    public ICollection<Test> Tests { get; set; } = new List<Test>();
}

public class TestReading
{
    public int? SampleId { get; set; }
    public int? TestId { get; set; }
    public int? TrialNumber { get; set; }
    public double? Value1 { get; set; }
    public double? Value2 { get; set; }
    public double? Value3 { get; set; }
    public double? TrialCalc { get; set; }
    public string? Id1 { get; set; }
    public string? Id2 { get; set; }
    public string? Id3 { get; set; }
    public bool? TrialComplete { get; set; }
    public string? Status { get; set; }
    public string? SchedType { get; set; }
    public string? EntryId { get; set; }
    public string? ValidateId { get; set; }
    public DateTime? EntryDate { get; set; }
    public DateTime? ValiDate { get; set; }
    public string? MainComments { get; set; }

    public Sample? Sample { get; set; }
    public Test? Test { get; set; }
}

public class TestStandard
{
    public int Id { get; set; }
    public int TestId { get; set; }
    public string StandardCode { get; set; } = string.Empty;
    public string StandardName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsDefault { get; set; }
    public bool Active { get; set; } = true;
    public int SortOrder { get; set; }

    public Test? Test { get; set; }
}

public class TestMethodConfig
{
    public int Id { get; set; }
    public int TestId { get; set; }
    public string ConfigKey { get; set; } = string.Empty;
    public string ConfigValue { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool Active { get; set; } = true;

    public Test? Test { get; set; }
}

public class ParticleType
{
    public int SampleId { get; set; }
    public int TestId { get; set; }
    public int ParticleTypeDefinitionId { get; set; }
    public string? Status { get; set; }
    public string? Comments { get; set; }

    public Sample? Sample { get; set; }
    public ParticleTypeDefinition? ParticleTypeDefinition { get; set; }
}

public class ParticleTypeDefinition
{
    public int Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Image1 { get; set; } = string.Empty;
    public string Image2 { get; set; } = string.Empty;
    public string? Active { get; set; }
    public int? SortOrder { get; set; }

    public ICollection<ParticleType> ParticleTypes { get; set; } = new List<ParticleType>();
}

public class EquipmentTestAssociation
{
    public int Id { get; set; }
    public int EquipmentId { get; set; }
    public int TestId { get; set; }
    public bool IsPrimary { get; set; }
    public bool Active { get; set; } = true;

    public Equipment? Equipment { get; set; }
    public Test? Test { get; set; }
}

public class EquipmentCalibrationHistory
{
    public int Id { get; set; }
    public int EquipmentId { get; set; }
    public DateTime CalibrationDate { get; set; }
    public double? CalibrationValue { get; set; }
    public string? CalibrationUnit { get; set; }
    public string? CalibratedBy { get; set; }
    public string? CertificateNumber { get; set; }
    public string? CertificateFile { get; set; }
    public DateTime? NextCalibrationDate { get; set; }
    public string? CalibrationStandard { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }

    public Equipment? Equipment { get; set; }
}

public class EquipmentMaintenanceLog
{
    public int Id { get; set; }
    public int EquipmentId { get; set; }
    public DateTime MaintenanceDate { get; set; }
    public string MaintenanceType { get; set; } = string.Empty;
    public string? PerformedBy { get; set; }
    public string Description { get; set; } = string.Empty;
    public double? Cost { get; set; }
    public int? Downtime { get; set; }
    public string? PartsReplaced { get; set; }
    public DateTime? NextMaintenanceDate { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }

    public Equipment? Equipment { get; set; }
}

public class LubeSamplingPoint
{
    public int Id { get; set; }
    public string? TagNumber { get; set; }
    public string? Component { get; set; }
    public string? Location { get; set; }
    public string? LubeClassItemNumber { get; set; }
    public double? LubeQuantityRequired { get; set; }
    public string? LubeUnitsOfMeasure { get; set; }
    public string? TestCategory { get; set; }
    public string? QualityClass { get; set; }
    public int? PricingPackageId { get; set; }
    public int? TestPricesId { get; set; }
    public DateTime? LastSampleDate { get; set; }
    public string? ChangeTaskNumber { get; set; }
    public string? ChangeIntervalType { get; set; }
    public int? ChangeIntervalNumber { get; set; }
    public DateTime? LastChangeDate { get; set; }
    public bool? InProgram { get; set; }
    public bool? TestScheduled { get; set; }
    public int? ApplId { get; set; }
    public string? MaterialInfo { get; set; }
}

public class LubeTechQualification
{
    public int Id { get; set; }
    public string EmployeeId { get; set; } = string.Empty;
    public int TestStandId { get; set; }
    public string QualificationLevel { get; set; } = string.Empty;
    public DateTime CertifiedDate { get; set; }
    public string? CertifiedBy { get; set; }
    public DateTime? ExpirationDate { get; set; }
    public bool Active { get; set; } = true;
    public string? Notes { get; set; }

    public TestStand? TestStand { get; set; }
}

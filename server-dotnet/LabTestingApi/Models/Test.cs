namespace LabTestingApi.Models;

public class Test
{
    public int Id { get; set; }
    public string? Name { get; set; }
    public int? TestStandId { get; set; }
    public int? SampleVolumeRequired { get; set; }
    public string? Exclude { get; set; }
    public string? Abbrev { get; set; }
    public int? DisplayedGroupId { get; set; }
    public string? GroupName { get; set; }
    public bool Lab { get; set; }
    public bool Schedule { get; set; }
    public string? ShortAbbrev { get; set; }

    // Navigation properties
    public TestStand? TestStand { get; set; }
    public ICollection<TestReading> TestReadings { get; set; } = new List<TestReading>();
    public ICollection<TestStandard> TestStandards { get; set; } = new List<TestStandard>();
    public ICollection<TestMethodConfig> TestMethodConfigs { get; set; } = new List<TestMethodConfig>();
    public ICollection<EquipmentTestAssociation> EquipmentAssociations { get; set; } = new List<EquipmentTestAssociation>();
}

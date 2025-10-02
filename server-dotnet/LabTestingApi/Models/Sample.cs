namespace LabTestingApi.Models;

public class Sample
{
    public int Id { get; set; }
    public string? TagNumber { get; set; }
    public string? Component { get; set; }
    public string? Location { get; set; }
    public string? LubeType { get; set; }
    public int? NewUsedFlag { get; set; }
    public DateTime? SampleDate { get; set; }
    public int? Status { get; set; }
    public DateTime? ReturnedDate { get; set; }
    public int? Priority { get; set; }
    public DateTime? AssignedDate { get; set; }
    public string? AssignedTo { get; set; }
    public DateTime? ReceivedDate { get; set; }
    public double? OilAdded { get; set; }
    public string? Comments { get; set; }

    // Navigation properties
    public ICollection<TestReading> TestReadings { get; set; } = new List<TestReading>();
    public ICollection<ParticleType> ParticleTypes { get; set; } = new List<ParticleType>();
}

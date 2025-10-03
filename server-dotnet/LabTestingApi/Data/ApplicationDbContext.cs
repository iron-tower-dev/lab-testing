namespace LabTestingApi.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    // DbSets
    public DbSet<Test> Tests => Set<Test>();
    public DbSet<TestStand> TestStands => Set<TestStand>();
    public DbSet<TestStandard> TestStandards => Set<TestStandard>();
    public DbSet<TestMethodConfig> TestMethodConfigs => Set<TestMethodConfig>();
    public DbSet<TestReading> TestReadings => Set<TestReading>();
    public DbSet<Equipment> Equipment => Set<Equipment>();
    public DbSet<EquipmentTestAssociation> EquipmentTestAssociations => Set<EquipmentTestAssociation>();
    public DbSet<EquipmentCalibrationHistory> EquipmentCalibrationHistory => Set<EquipmentCalibrationHistory>();
    public DbSet<EquipmentMaintenanceLog> EquipmentMaintenanceLogs => Set<EquipmentMaintenanceLog>();
    public DbSet<Sample> Samples => Set<Sample>();
    public DbSet<ParticleType> ParticleTypes => Set<ParticleType>();
    public DbSet<ParticleTypeDefinition> ParticleTypeDefinitions => Set<ParticleTypeDefinition>();
    public DbSet<LubeSamplingPoint> LubeSamplingPoints => Set<LubeSamplingPoint>();
    public DbSet<LubeTechQualification> LubeTechQualifications => Set<LubeTechQualification>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure table names to match SQLite schema
        modelBuilder.Entity<Test>().ToTable("test_table");
        modelBuilder.Entity<TestStand>().ToTable("test_stand_table");
        modelBuilder.Entity<TestStandard>().ToTable("test_standards_table");
        modelBuilder.Entity<TestMethodConfig>().ToTable("test_method_config_table");
        modelBuilder.Entity<TestReading>().ToTable("test_readings_table");
        modelBuilder.Entity<Equipment>().ToTable("equipment_table");
        modelBuilder.Entity<EquipmentTestAssociation>().ToTable("equipment_test_association_table");
        modelBuilder.Entity<EquipmentCalibrationHistory>().ToTable("equipment_calibration_history_table");
        modelBuilder.Entity<EquipmentMaintenanceLog>().ToTable("equipment_maintenance_log_table");
        modelBuilder.Entity<Sample>().ToTable("used_lube_samples_table");
        modelBuilder.Entity<ParticleType>().ToTable("particle_type_table");
        modelBuilder.Entity<ParticleTypeDefinition>().ToTable("particle_type_definition_table");
        modelBuilder.Entity<LubeSamplingPoint>().ToTable("lube_sampling_point_table");
        modelBuilder.Entity<LubeTechQualification>().ToTable("lube_tech_qualification_table");

        // Configure Test entity
        modelBuilder.Entity<Test>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Name).HasColumnName("name");
            entity.Property(e => e.TestStandId).HasColumnName("testStandId");
            entity.Property(e => e.SampleVolumeRequired).HasColumnName("sampleVolumeRequired");
            entity.Property(e => e.Exclude).HasColumnName("exclude");
            entity.Property(e => e.Abbrev).HasColumnName("abbrev");
            entity.Property(e => e.DisplayedGroupId).HasColumnName("displayedGroupId");
            entity.Property(e => e.GroupName).HasColumnName("groupName");
            entity.Property(e => e.Lab).HasColumnName("lab");
            entity.Property(e => e.Schedule).HasColumnName("schedule");
            entity.Property(e => e.ShortAbbrev).HasColumnName("shortAbbrev");

            entity.HasOne(e => e.TestStand)
                .WithMany(ts => ts.Tests)
                .HasForeignKey(e => e.TestStandId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Configure Equipment entity
        modelBuilder.Entity<Equipment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.EquipmentId).HasColumnName("equipmentId").IsRequired();
            entity.Property(e => e.EquipmentType).HasColumnName("equipmentType").IsRequired();
            entity.Property(e => e.Name).HasColumnName("name").IsRequired();
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.Manufacturer).HasColumnName("manufacturer");
            entity.Property(e => e.ModelNumber).HasColumnName("modelNumber");
            entity.Property(e => e.SerialNumber).HasColumnName("serialNumber");
            entity.Property(e => e.CalibrationValue).HasColumnName("calibrationValue");
            entity.Property(e => e.CalibrationUnit).HasColumnName("calibrationUnit");
            entity.Property(e => e.CalibrationDate).HasColumnName("calibrationDate");
            entity.Property(e => e.CalibrationDueDate).HasColumnName("calibrationDueDate");
            entity.Property(e => e.CalibrationCertificate).HasColumnName("calibrationCertificate");
            entity.Property(e => e.Status).HasColumnName("status").HasDefaultValue("active");
            entity.Property(e => e.Location).HasColumnName("location");
            entity.Property(e => e.AssignedTo).HasColumnName("assignedTo");
            entity.Property(e => e.PurchaseDate).HasColumnName("purchaseDate");
            entity.Property(e => e.PurchaseCost).HasColumnName("purchaseCost");
            entity.Property(e => e.Notes).HasColumnName("notes");
            entity.Property(e => e.CreatedAt).HasColumnName("createdAt").IsRequired();
            entity.Property(e => e.UpdatedAt).HasColumnName("updatedAt").IsRequired();
            entity.Property(e => e.CreatedBy).HasColumnName("createdBy");
            entity.Property(e => e.UpdatedBy).HasColumnName("updatedBy");

            entity.HasIndex(e => e.EquipmentId).IsUnique();
            entity.HasIndex(e => e.EquipmentType);
            entity.HasIndex(e => e.Status);
        });

        // Configure Sample entity
        modelBuilder.Entity<Sample>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.TagNumber).HasColumnName("tagNumber");
            entity.Property(e => e.Component).HasColumnName("component");
            entity.Property(e => e.Location).HasColumnName("location");
            entity.Property(e => e.LubeType).HasColumnName("lubeType");
            entity.Property(e => e.NewUsedFlag).HasColumnName("newUsedFlag");
            entity.Property(e => e.SampleDate).HasColumnName("sampleDate");
            entity.Property(e => e.Status).HasColumnName("status");
            entity.Property(e => e.ReturnedDate).HasColumnName("returnedDate");
            entity.Property(e => e.Priority).HasColumnName("priority");
            entity.Property(e => e.AssignedDate).HasColumnName("assignedDate");
            entity.Property(e => e.AssignedTo).HasColumnName("assignedTo");
            entity.Property(e => e.ReceivedDate).HasColumnName("receivedDate");
            entity.Property(e => e.OilAdded).HasColumnName("oilAdded");
            entity.Property(e => e.Comments).HasColumnName("comments");

            entity.HasIndex(e => e.TagNumber);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.AssignedTo);
        });

        // Configure TestStandard entity
        modelBuilder.Entity<TestStandard>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.TestId).HasColumnName("testId");
            entity.Property(e => e.StandardCode).HasColumnName("standardCode");
            entity.Property(e => e.StandardName).HasColumnName("standardName");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.IsDefault).HasColumnName("isDefault");
            entity.Property(e => e.Active).HasColumnName("active");
            entity.Property(e => e.SortOrder).HasColumnName("sortOrder");

            entity.HasOne(e => e.Test)
                .WithMany(t => t.TestStandards)
                .HasForeignKey(e => e.TestId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => new { e.TestId, e.StandardCode }).IsUnique();
        });

        // Configure EquipmentTestAssociation entity
        modelBuilder.Entity<EquipmentTestAssociation>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.EquipmentId).HasColumnName("equipmentId");
            entity.Property(e => e.TestId).HasColumnName("testId");
            entity.Property(e => e.IsPrimary).HasColumnName("isPrimary");
            entity.Property(e => e.Active).HasColumnName("active");

            entity.HasOne(e => e.Equipment)
                .WithMany(eq => eq.TestAssociations)
                .HasForeignKey(e => e.EquipmentId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Test)
                .WithMany(t => t.EquipmentAssociations)
                .HasForeignKey(e => e.TestId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => new { e.EquipmentId, e.TestId }).IsUnique();
        });

        // Configure ParticleType entity
        modelBuilder.Entity<ParticleType>(entity =>
        {
            entity.HasKey(e => new { e.SampleId, e.TestId, e.ParticleTypeDefinitionId });
            entity.Property(e => e.SampleId).HasColumnName("sampleId");
            entity.Property(e => e.TestId).HasColumnName("testId");
            entity.Property(e => e.ParticleTypeDefinitionId).HasColumnName("particleTypeDefinitionId");
            entity.Property(e => e.Status).HasColumnName("status");
            entity.Property(e => e.Comments).HasColumnName("comments");

            entity.HasOne(e => e.Sample)
                .WithMany(s => s.ParticleTypes)
                .HasForeignKey(e => e.SampleId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.ParticleTypeDefinition)
                .WithMany(ptd => ptd.ParticleTypes)
                .HasForeignKey(e => e.ParticleTypeDefinitionId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Configure TestReading entity (no primary key as per schema)
        modelBuilder.Entity<TestReading>(entity =>
        {
            entity.HasNoKey();
            entity.Property(e => e.SampleId).HasColumnName("sampleId");
            entity.Property(e => e.TestId).HasColumnName("testId");
            entity.Property(e => e.TrialNumber).HasColumnName("trialNumber");
            entity.Property(e => e.Value1).HasColumnName("value1");
            entity.Property(e => e.Value2).HasColumnName("value2");
            entity.Property(e => e.Value3).HasColumnName("value3");
            entity.Property(e => e.TrialCalc).HasColumnName("trialCalc");
            entity.Property(e => e.Id1).HasColumnName("id1");
            entity.Property(e => e.Id2).HasColumnName("id2");
            entity.Property(e => e.Id3).HasColumnName("id3");
            entity.Property(e => e.TrialComplete).HasColumnName("trialComplete");
            entity.Property(e => e.Status).HasColumnName("status");
            entity.Property(e => e.SchedType).HasColumnName("schedType");
            entity.Property(e => e.EntryId).HasColumnName("entryId");
            entity.Property(e => e.ValidateId).HasColumnName("validateId");
            entity.Property(e => e.EntryDate).HasColumnName("entryDate");
            entity.Property(e => e.ValiDate).HasColumnName("valiDate");
            entity.Property(e => e.MainComments).HasColumnName("mainComments");
        });
    }
}

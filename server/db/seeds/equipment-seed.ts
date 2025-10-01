import { db } from '../db';
import { equipmentTable, equipmentTestAssociationTable } from '../schema-equipment';

/**
 * Seed equipment data - Viscosity tubes and thermometers
 */
export async function seedEquipment() {
  console.log('🔧 Seeding M&TE equipment...');

  const now = Date.now();
  const oneYearFromNow = now + (365 * 24 * 60 * 60 * 1000);

  // Viscosity tubes for Vis@40 and Vis@100 tests
  const viscosityTubes = [
    {
      equipmentId: 'TUBE-A1',
      equipmentType: 'tube',
      name: 'Viscosity Tube A1',
      description: 'Cannon-Fenske Routine Viscometer, Size 50',
      manufacturer: 'Cannon Instrument Company',
      modelNumber: 'CF-50-T40',
      serialNumber: 'CF50-2024-001',
      calibrationValue: 0.0045,
      calibrationUnit: 'cSt/s',
      calibrationDate: now - (30 * 24 * 60 * 60 * 1000), // 30 days ago
      calibrationDueDate: oneYearFromNow,
      calibrationCertificate: 'CERT-2024-001.pdf',
      status: 'active',
      location: 'Lab Bench 1',
      assignedTo: 'Lab Technician',
      purchaseDate: now - (730 * 24 * 60 * 60 * 1000), // 2 years ago
      purchaseCost: 450.00,
      notes: 'Primary tube for low viscosity samples',
      createdAt: now,
      updatedAt: now,
      createdBy: 'system',
      updatedBy: 'system',
    },
    {
      equipmentId: 'TUBE-B2',
      equipmentType: 'tube',
      name: 'Viscosity Tube B2',
      description: 'Cannon-Fenske Routine Viscometer, Size 75',
      manufacturer: 'Cannon Instrument Company',
      modelNumber: 'CF-75-T40',
      serialNumber: 'CF75-2024-002',
      calibrationValue: 0.0052,
      calibrationUnit: 'cSt/s',
      calibrationDate: now - (45 * 24 * 60 * 60 * 1000), // 45 days ago
      calibrationDueDate: oneYearFromNow,
      calibrationCertificate: 'CERT-2024-002.pdf',
      status: 'active',
      location: 'Lab Bench 1',
      assignedTo: 'Lab Technician',
      purchaseDate: now - (730 * 24 * 60 * 60 * 1000),
      purchaseCost: 450.00,
      notes: 'Medium viscosity range',
      createdAt: now,
      updatedAt: now,
      createdBy: 'system',
      updatedBy: 'system',
    },
    {
      equipmentId: 'TUBE-C3',
      equipmentType: 'tube',
      name: 'Viscosity Tube C3',
      description: 'Cannon-Fenske Routine Viscometer, Size 100',
      manufacturer: 'Cannon Instrument Company',
      modelNumber: 'CF-100-T40',
      serialNumber: 'CF100-2024-003',
      calibrationValue: 0.0038,
      calibrationUnit: 'cSt/s',
      calibrationDate: now - (60 * 24 * 60 * 60 * 1000), // 60 days ago
      calibrationDueDate: oneYearFromNow,
      calibrationCertificate: 'CERT-2024-003.pdf',
      status: 'active',
      location: 'Lab Bench 2',
      assignedTo: 'Lab Technician',
      purchaseDate: now - (730 * 24 * 60 * 60 * 1000),
      purchaseCost: 475.00,
      notes: 'Lower viscosity range, high precision',
      createdAt: now,
      updatedAt: now,
      createdBy: 'system',
      updatedBy: 'system',
    },
    {
      equipmentId: 'TUBE-D4',
      equipmentType: 'tube',
      name: 'Viscosity Tube D4',
      description: 'Cannon-Fenske Routine Viscometer, Size 150',
      manufacturer: 'Cannon Instrument Company',
      modelNumber: 'CF-150-T40',
      serialNumber: 'CF150-2024-004',
      calibrationValue: 0.0061,
      calibrationUnit: 'cSt/s',
      calibrationDate: now - (20 * 24 * 60 * 60 * 1000), // 20 days ago
      calibrationDueDate: oneYearFromNow,
      calibrationCertificate: 'CERT-2024-004.pdf',
      status: 'active',
      location: 'Lab Bench 2',
      assignedTo: 'Lab Technician',
      purchaseDate: now - (365 * 24 * 60 * 60 * 1000), // 1 year ago
      purchaseCost: 475.00,
      notes: 'Higher viscosity range',
      createdAt: now,
      updatedAt: now,
      createdBy: 'system',
      updatedBy: 'system',
    },
    {
      equipmentId: 'TUBE-E5',
      equipmentType: 'tube',
      name: 'Viscosity Tube E5',
      description: 'Cannon-Fenske Routine Viscometer, Size 200',
      manufacturer: 'Cannon Instrument Company',
      modelNumber: 'CF-200-T100',
      serialNumber: 'CF200-2024-005',
      calibrationValue: 0.0055,
      calibrationUnit: 'cSt/s',
      calibrationDate: now - (10 * 24 * 60 * 60 * 1000), // 10 days ago
      calibrationDueDate: oneYearFromNow,
      calibrationCertificate: 'CERT-2024-005.pdf',
      status: 'active',
      location: 'Lab Bench 3',
      assignedTo: 'Lab Technician',
      purchaseDate: now - (365 * 24 * 60 * 60 * 1000),
      purchaseCost: 500.00,
      notes: 'Optimized for 100°C testing',
      createdAt: now,
      updatedAt: now,
      createdBy: 'system',
      updatedBy: 'system',
    },
  ];

  // Thermometers for viscosity testing
  const thermometers = [
    {
      equipmentId: 'THERM-001',
      equipmentType: 'thermometer',
      name: 'Digital Thermometer T1',
      description: 'ASTM Calibrated Digital Thermometer -50 to 300°C',
      manufacturer: 'Fluke',
      modelNumber: '1523',
      serialNumber: 'FL1523-2024-001',
      calibrationValue: 0.01, // Accuracy in °C
      calibrationUnit: '°C',
      calibrationDate: now - (90 * 24 * 60 * 60 * 1000), // 90 days ago
      calibrationDueDate: now + (275 * 24 * 60 * 60 * 1000), // 275 days from now
      calibrationCertificate: 'CERT-THERM-2024-001.pdf',
      status: 'active',
      location: 'Viscosity Bath 1',
      assignedTo: 'Lab Technician',
      purchaseDate: now - (1095 * 24 * 60 * 60 * 1000), // 3 years ago
      purchaseCost: 1200.00,
      notes: 'Primary thermometer for viscosity baths',
      createdAt: now,
      updatedAt: now,
      createdBy: 'system',
      updatedBy: 'system',
    },
    {
      equipmentId: 'THERM-002',
      equipmentType: 'thermometer',
      name: 'Digital Thermometer T2',
      description: 'ASTM Calibrated Digital Thermometer -50 to 300°C',
      manufacturer: 'Fluke',
      modelNumber: '1523',
      serialNumber: 'FL1523-2024-002',
      calibrationValue: 0.01,
      calibrationUnit: '°C',
      calibrationDate: now - (100 * 24 * 60 * 60 * 1000),
      calibrationDueDate: now + (265 * 24 * 60 * 60 * 1000),
      calibrationCertificate: 'CERT-THERM-2024-002.pdf',
      status: 'active',
      location: 'Viscosity Bath 2',
      assignedTo: 'Lab Technician',
      purchaseDate: now - (1095 * 24 * 60 * 60 * 1000),
      purchaseCost: 1200.00,
      notes: 'Backup thermometer',
      createdAt: now,
      updatedAt: now,
      createdBy: 'system',
      updatedBy: 'system',
    },
  ];

  try {
    // Insert equipment
    const insertedEquipment = await db.insert(equipmentTable).values([
      ...viscosityTubes,
      ...thermometers,
    ]).returning();

    console.log(`✅ Inserted ${insertedEquipment.length} equipment items`);

    // Create equipment-test associations
    // Note: Assumes testTable has viscosity test IDs 50 (Vis@40) and 60 (Vis@100)
    // Adjust these IDs based on your actual test table data
    const associations = [];

    // Associate viscosity tubes with Vis@40 (testId: 50) and Vis@100 (testId: 60)
    const tubeIds = insertedEquipment.filter(e => e.equipmentType === 'tube').map(e => e.id);
    const thermIds = insertedEquipment.filter(e => e.equipmentType === 'thermometer').map(e => e.id);

    for (const tubeId of tubeIds) {
      associations.push(
        { equipmentId: tubeId, testId: 50, isPrimary: true, active: true }, // Vis@40
        { equipmentId: tubeId, testId: 60, isPrimary: true, active: true }  // Vis@100
      );
    }

    for (const thermId of thermIds) {
      associations.push(
        { equipmentId: thermId, testId: 50, isPrimary: false, active: true }, // Vis@40
        { equipmentId: thermId, testId: 60, isPrimary: false, active: true }  // Vis@100
      );
    }

    if (associations.length > 0) {
      await db.insert(equipmentTestAssociationTable).values(associations);
      console.log(`✅ Created ${associations.length} equipment-test associations`);
    }

    console.log('✅ Equipment seeding complete');
    return insertedEquipment;
  } catch (error) {
    console.error('❌ Error seeding equipment:', error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  seedEquipment()
    .then(() => {
      console.log('Equipment seed completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Equipment seed failed:', error);
      process.exit(1);
    });
}

/**
 * Component Lookup Table Seed Data
 * Equipment component codes from legacy VB.NET system
 */

export const componentSeedData = [
  {
    code: 'ENG',
    name: 'Engine',
    description: 'Main engine component',
    active: true,
    sortOrder: 1,
  },
  {
    code: 'GBOX',
    name: 'Gearbox',
    description: 'Transmission/gearbox component',
    active: true,
    sortOrder: 2,
  },
  {
    code: 'HYD',
    name: 'Hydraulic System',
    description: 'Hydraulic system component',
    active: true,
    sortOrder: 3,
  },
  {
    code: 'TRANS',
    name: 'Transmission',
    description: 'Transmission component',
    active: true,
    sortOrder: 4,
  },
  {
    code: 'DIFF',
    name: 'Differential',
    description: 'Differential component',
    active: true,
    sortOrder: 5,
  },
  {
    code: 'COMP',
    name: 'Compressor',
    description: 'Air compressor component',
    active: true,
    sortOrder: 6,
  },
  {
    code: 'PUMP',
    name: 'Pump',
    description: 'Pump component',
    active: true,
    sortOrder: 7,
  },
  {
    code: 'GEN',
    name: 'Generator',
    description: 'Generator component',
    active: true,
    sortOrder: 8,
  },
  {
    code: 'COOL',
    name: 'Cooling System',
    description: 'Cooling system component',
    active: true,
    sortOrder: 9,
  },
  {
    code: 'OTHER',
    name: 'Other',
    description: 'Other/miscellaneous component',
    active: true,
    sortOrder: 99,
  },
] as const;

export type ComponentCode = typeof componentSeedData[number]['code'];

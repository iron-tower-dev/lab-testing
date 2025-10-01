/**
 * Location Lookup Table Seed Data
 * Equipment location codes from legacy VB.NET system
 */

export const locationSeedData = [
  {
    code: 'BLDG1',
    name: 'Building 1',
    description: 'Main building facility',
    active: true,
    sortOrder: 1,
  },
  {
    code: 'BLDG2',
    name: 'Building 2',
    description: 'Secondary building facility',
    active: true,
    sortOrder: 2,
  },
  {
    code: 'SHOP',
    name: 'Shop',
    description: 'Maintenance shop',
    active: true,
    sortOrder: 3,
  },
  {
    code: 'YARD',
    name: 'Yard',
    description: 'Outdoor yard area',
    active: true,
    sortOrder: 4,
  },
  {
    code: 'DOCK',
    name: 'Dock',
    description: 'Loading dock area',
    active: true,
    sortOrder: 5,
  },
  {
    code: 'LAB',
    name: 'Laboratory',
    description: 'Lab testing facility',
    active: true,
    sortOrder: 6,
  },
  {
    code: 'WAREHOUSE',
    name: 'Warehouse',
    description: 'Storage warehouse',
    active: true,
    sortOrder: 7,
  },
  {
    code: 'FIELD',
    name: 'Field',
    description: 'Field location',
    active: true,
    sortOrder: 8,
  },
  {
    code: 'REMOTE',
    name: 'Remote Site',
    description: 'Remote site location',
    active: true,
    sortOrder: 9,
  },
  {
    code: 'OTHER',
    name: 'Other',
    description: 'Other/unspecified location',
    active: true,
    sortOrder: 99,
  },
] as const;

export type LocationCode = typeof locationSeedData[number]['code'];

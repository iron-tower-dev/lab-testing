export interface MTEquipmentResponse {
  equipName: string | null;
  dueDate: Date | null;
}

export interface ParticleSubTypeResponse {
  category: string;
  definitions: string[];
}

export interface ParticleTypeResponse {
  id: number;
  type: string;
  description: string;
  image1: string;
  image2: string;
}

export interface FerrogramTestResultResponse {
  sampleId: number | null;
  testReading1: string | null;
  testReading2: string | null;
  particleTypeDefinitionId: number | null;
  status: string | null;
  comments: string | null;
  heat: number | null;
  concentration: number | null;
  sizeAve: number | null;
  sizeMax: number | null;
  color: number | null;
  texture: number | null;
  compostion: number | null;
  severity: number | null;
}

export interface ResultsHeaderResponse {
  sampleId: number;
  tagNumber: string | null;
  lubeType: string | null;
  newUsedFlag: number | null;
  qualityClass: string | null;
  compCode: string | null;
  compName: string | null;
  locCode: string | null;
  locName: string | null;
  labComments: string[] | null;
}

export type TestCode =
  | 'TAN'
  | 'KF'
  | 'SpecStd'
  | 'SpecLrg'
  | 'Vis40'
  | 'Vis100'
  | 'FTIR'
  | 'FlashPt'
  | 'TBN'
  | 'InspectFilter'
  | 'GrPen60'
  | 'GrDropPt'
  | 'Pcnt'
  | 'RBOT'
  | 'FltrRes'
  | 'Ferrography'
  | 'Rust'
  | 'TFOUT'
  | 'DebrisID'
  | 'Deleterious'
  | 'Rheometry'
  | 'DInch'
  | 'OilContent'
  | 'VPR';

export const testCodeToType: Record<TestCode, string> = {
  TAN: 'TAN by Color Indication',
  KF: 'Water Content by Karl Fischer',
  SpecStd: 'Emission Spectroscopy - Standard',
  SpecLrg: 'Emission Spectroscopy - Large',
  Vis40: 'Viscosity - 40°C',
  Vis100: 'Viscosity - 100°C',
  FTIR: 'FTIR',
  FlashPt: 'Flash Point',
  TBN: 'TBN by Auto Titration',
  InspectFilter: 'Inspect Filter',
  GrPen60: 'Grease Penetration - 60°C',
  GrDropPt: 'Grease Drop Point',
  Pcnt: 'Particle Count',
  RBOT: 'Rheology - Brookfield',
  FltrRes: 'Filter Residue',
  Ferrography: 'Ferrography',
  Rust: 'Rust',
  TFOUT: 'TFOUT',
  DebrisID: 'Debris Identification',
  Deleterious: 'Deleterious',
  Rheometry: 'Rheometry',
  DInch: 'Diameter Inch',
  OilContent: 'Oil Content',
  VPR: 'Varnish Potential Rating',
};

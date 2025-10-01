/**
 * Qualification Level Constants
 * Based on legacy VB.NET system qualification levels
 */

export const QUALIFICATION_LEVELS = {
  TRAIN: 'TRAIN',      // Trainee - can enter data under supervision
  Q: 'Q',              // Qualified - can enter data independently
  QAG: 'QAG',          // Qualified with approval - can validate/approve data
  MICRE: 'MicrE',      // Microscopy expert - specialized qualification
} as const;

export type QualificationLevel = typeof QUALIFICATION_LEVELS[keyof typeof QUALIFICATION_LEVELS];

/**
 * Qualification level hierarchy for authorization checks
 */
export const QUALIFICATION_HIERARCHY: Record<QualificationLevel, number> = {
  [QUALIFICATION_LEVELS.TRAIN]: 1,
  [QUALIFICATION_LEVELS.Q]: 2,
  [QUALIFICATION_LEVELS.QAG]: 3,
  [QUALIFICATION_LEVELS.MICRE]: 2, // Same level as Q but for microscopy
};

/**
 * Check if a user has sufficient qualification level
 */
export function hasQualificationLevel(
  userLevel: QualificationLevel,
  requiredLevel: QualificationLevel
): boolean {
  return QUALIFICATION_HIERARCHY[userLevel] >= QUALIFICATION_HIERARCHY[requiredLevel];
}

/**
 * Sample qualification seed data for testing
 * Note: In production, these should be populated from actual employee records
 */
export const sampleQualificationData = [
  {
    employeeId: 'EMP001',
    testStandId: 1, // Example test stand
    qualificationLevel: QUALIFICATION_LEVELS.QAG,
    certifiedDate: new Date('2024-01-15'),
    certifiedBy: 'SUPERVISOR01',
    expirationDate: new Date('2025-01-15'),
    active: true,
    notes: 'Annual recertification required',
  },
  {
    employeeId: 'EMP002',
    testStandId: 1,
    qualificationLevel: QUALIFICATION_LEVELS.Q,
    certifiedDate: new Date('2024-06-01'),
    certifiedBy: 'SUPERVISOR01',
    expirationDate: new Date('2025-06-01'),
    active: true,
    notes: null,
  },
  {
    employeeId: 'EMP003',
    testStandId: 2, // Different test stand
    qualificationLevel: QUALIFICATION_LEVELS.TRAIN,
    certifiedDate: new Date('2024-09-01'),
    certifiedBy: 'SUPERVISOR02',
    expirationDate: null, // No expiration for trainees
    active: true,
    notes: 'In training program',
  },
] as const;

import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService, ApiResponse } from './api.service';

export interface Qualification {
  id: number;
  employeeId: string;
  testStandId: number;
  qualificationLevel: 'TRAIN' | 'Q' | 'QAG' | 'MicrE';
  certifiedDate: number;
  certifiedBy: string | null;
  expirationDate: number | null;
  active: number;
  notes: string | null;
}

export interface QualificationWithTestStand extends Qualification {
  testStand?: {
    id: number;
    name: string | null;
  };
}

export interface QualificationCreate {
  employeeId: string;
  testStandId: number;
  qualificationLevel: 'TRAIN' | 'Q' | 'QAG' | 'MicrE';
  certifiedDate: number;
  certifiedBy?: string;
  expirationDate?: number;
  active?: boolean;
  notes?: string;
}

export interface QualificationCheckResponse {
  qualification: QualificationWithTestStand;
  testStand?: {
    id: number;
    name: string | null;
  };
  isQualified: boolean;
  isExpired: boolean;
  expiresAt: number | null;
}

/**
 * Qualification levels hierarchy
 */
export const QUALIFICATION_LEVELS = {
  TRAIN: 'TRAIN',
  Q: 'Q',
  QAG: 'QAG',
  MICRE: 'MicrE'
} as const;

export const QUALIFICATION_HIERARCHY: Record<string, number> = {
  [QUALIFICATION_LEVELS.TRAIN]: 1,
  [QUALIFICATION_LEVELS.Q]: 2,
  [QUALIFICATION_LEVELS.QAG]: 3,
  [QUALIFICATION_LEVELS.MICRE]: 2
};

@Injectable({
  providedIn: 'root'
})
export class QualificationService {
  private readonly apiService = inject(ApiService);

  // Reactive state using signals
  private readonly _userQualifications = signal<Qualification[]>([]);
  private readonly _currentEmployeeId = signal<string | null>(null);
  private readonly _loading = signal(false);

  // Public computed signals
  readonly userQualifications = this._userQualifications.asReadonly();
  readonly currentEmployeeId = this._currentEmployeeId.asReadonly();
  readonly loading = this._loading.asReadonly();

  // Computed: Active qualifications only
  readonly activeQualifications = computed(() =>
    this._userQualifications().filter(q => q.active === 1)
  );

  // Computed: Qualified test stands (IDs)
  readonly qualifiedTestStands = computed(() =>
    this.activeQualifications()
      .filter(q => !this.isExpired(q))
      .map(q => q.testStandId)
  );

  /**
   * Check if a qualification level meets or exceeds required level
   */
  hasQualificationLevel(
    userLevel: string,
    requiredLevel: string
  ): boolean {
    return (
      QUALIFICATION_HIERARCHY[userLevel] >= QUALIFICATION_HIERARCHY[requiredLevel]
    );
  }

  /**
   * Check if a qualification is expired
   */
  isExpired(qualification: Qualification): boolean {
    if (!qualification.expirationDate) return false;
    return qualification.expirationDate < Date.now();
  }

  /**
   * Check if user is qualified for a specific test stand
   */
  isQualifiedForTestStand(testStandId: number): boolean {
    return this.qualifiedTestStands().includes(testStandId);
  }

  /**
   * Get user's qualification level for a test stand
   */
  getQualificationLevel(testStandId: number): string | null {
    const qual = this.activeQualifications().find(
      q => q.testStandId === testStandId && !this.isExpired(q)
    );
    return qual?.qualificationLevel || null;
  }

  /**
   * Load qualifications for current user
   */
  loadUserQualifications(employeeId: string): Observable<ApiResponse<any[]>> {
    this._loading.set(true);
    this._currentEmployeeId.set(employeeId);

    return this.apiService.get<any[]>(`qualifications/${employeeId}`, { activeOnly: 'true' }).pipe(
      tap(response => {
        if (response.success && response.data) {
          // Extract qualifications from response (may include testStand data)
          const quals = response.data.map((item: any) => 
            item.qualification || item
          );
          this._userQualifications.set(quals);
        }
        this._loading.set(false);
      })
    );
  }

  /**
   * Get all qualifications with optional filters
   */
  getQualifications(params?: {
    employeeId?: string;
    testStandId?: number;
    active?: boolean;
    qualificationLevel?: string;
  }): Observable<ApiResponse<Qualification[]>> {
    const queryParams: Record<string, string> = {};

    if (params?.employeeId) queryParams['employeeId'] = params.employeeId;
    if (params?.testStandId) queryParams['testStandId'] = params.testStandId.toString();
    if (params?.active !== undefined) queryParams['active'] = params.active.toString();
    if (params?.qualificationLevel) queryParams['qualificationLevel'] = params.qualificationLevel;

    return this.apiService.get<Qualification[]>('qualifications', queryParams);
  }

  /**
   * Get all qualifications for a specific employee
   */
  getEmployeeQualifications(
    employeeId: string,
    activeOnly = true
  ): Observable<ApiResponse<any[]>> {
    const params = activeOnly ? { activeOnly: 'true' } : {};
    return this.apiService.get<any[]>(`qualifications/${employeeId}`, params);
  }

  /**
   * Check specific qualification for employee and test stand
   */
  checkQualification(
    employeeId: string,
    testStandId: number
  ): Observable<ApiResponse<QualificationCheckResponse>> {
    return this.apiService.get<QualificationCheckResponse>(
      `qualifications/${employeeId}/${testStandId}`
    );
  }

  /**
   * Create a new qualification
   */
  createQualification(
    qualification: QualificationCreate
  ): Observable<ApiResponse<Qualification>> {
    return this.apiService.post<Qualification>('qualifications', qualification);
  }

  /**
   * Update an existing qualification
   */
  updateQualification(
    id: number,
    updates: Partial<QualificationCreate>
  ): Observable<ApiResponse<Qualification>> {
    return this.apiService.put<Qualification>(`qualifications/${id}`, updates);
  }

  /**
   * Deactivate a qualification (soft delete)
   */
  deactivateQualification(id: number): Observable<ApiResponse<void>> {
    return this.apiService.delete<void>(`qualifications/${id}`);
  }

  /**
   * Refresh qualifications for current user
   */
  refreshQualifications(): void {
    const currentEmployeeId = this._currentEmployeeId();
    if (currentEmployeeId) {
      this.loadUserQualifications(currentEmployeeId).subscribe();
    }
  }

  /**
   * Clear loaded qualifications
   */
  clearQualifications(): void {
    this._userQualifications.set([]);
    this._currentEmployeeId.set(null);
  }

  /**
   * Get qualification badge info for UI display
   */
  getQualificationBadge(testStandId: number): {
    level: string | null;
    label: string;
    color: string;
    isExpired: boolean;
  } | null {
    const qual = this.activeQualifications().find(
      q => q.testStandId === testStandId
    );

    if (!qual) {
      return null;
    }

    const isExpired = this.isExpired(qual);
    
    const badges: Record<string, { label: string; color: string }> = {
      [QUALIFICATION_LEVELS.TRAIN]: { label: 'Trainee', color: 'warning' },
      [QUALIFICATION_LEVELS.Q]: { label: 'Qualified', color: 'success' },
      [QUALIFICATION_LEVELS.QAG]: { label: 'QA Qualified', color: 'primary' },
      [QUALIFICATION_LEVELS.MICRE]: { label: 'Microscopy', color: 'info' }
    };

    const badge = badges[qual.qualificationLevel] || { label: 'Unknown', color: 'secondary' };

    return {
      level: qual.qualificationLevel,
      label: badge.label,
      color: isExpired ? 'danger' : badge.color,
      isExpired
    };
  }

  /**
   * Get days until qualification expires (null if no expiration)
   */
  getDaysUntilExpiration(qualification: Qualification): number | null {
    if (!qualification.expirationDate) return null;
    
    const now = Date.now();
    const msUntilExpiration = qualification.expirationDate - now;
    return Math.ceil(msUntilExpiration / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if qualification expires soon (within 30 days)
   */
  isExpiringSoon(qualification: Qualification, daysThreshold = 30): boolean {
    const daysUntilExp = this.getDaysUntilExpiration(qualification);
    return daysUntilExp !== null && daysUntilExp > 0 && daysUntilExp <= daysThreshold;
  }
}

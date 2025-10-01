import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, ApiResponse } from './api.service';

/**
 * Equipment type definition
 */
export interface Equipment {
  id: number;
  equipmentId: string;
  equipmentType: 'tube' | 'thermometer' | 'balance' | 'timer' | 'other';
  name: string;
  description?: string | null;
  manufacturer?: string | null;
  modelNumber?: string | null;
  serialNumber?: string | null;
  calibrationValue?: number | null;
  calibrationUnit?: string | null;
  calibrationDate?: number | null;
  calibrationDueDate?: number | null;
  calibrationCertificate?: string | null;
  status: 'active' | 'inactive' | 'calibration_due' | 'out_of_service';
  location?: string | null;
  assignedTo?: string | null;
  purchaseDate?: number | null;
  purchaseCost?: number | null;
  notes?: string | null;
  createdAt: number;
  updatedAt: number;
  createdBy?: string | null;
  updatedBy?: string | null;
  // Optional fields added by API
  isPrimary?: boolean;
  associatedTests?: TestAssociation[];
}

/**
 * Test association for equipment
 */
export interface TestAssociation {
  testId: number;
  testName?: string | null;
  isPrimary: boolean;
}

/**
 * Equipment calibration history record
 */
export interface EquipmentCalibrationHistory {
  id: number;
  equipmentId: number;
  calibrationDate: number;
  calibrationValue?: number | null;
  calibrationUnit?: string | null;
  calibratedBy?: string | null;
  certificateNumber?: string | null;
  certificateFile?: string | null;
  nextCalibrationDate?: number | null;
  calibrationStandard?: string | null;
  notes?: string | null;
  createdAt: number;
}

/**
 * Equipment filter parameters
 */
export interface EquipmentFilter {
  type?: string;
  status?: string;
  search?: string;
  testId?: number;
  active?: boolean;
}

/**
 * Tube option for dropdown selection
 */
export interface TubeOption {
  value: string; // Format: "equipmentId|calibrationValue"
  label: string; // Format: "Name (calibrationValue unit)"
}

/**
 * Equipment Service
 * Handles all M&TE (Measuring & Test Equipment) operations
 */
@Injectable({
  providedIn: 'root'
})
export class EquipmentService {
  private readonly apiService = inject(ApiService);

  /**
   * Get all equipment with optional filtering
   */
  getEquipment(filter?: EquipmentFilter): Observable<ApiResponse<Equipment[]>> {
    const params: Record<string, string> = {};
    
    if (filter?.type) params['type'] = filter.type;
    if (filter?.status) params['status'] = filter.status;
    if (filter?.search) params['search'] = filter.search;
    if (filter?.testId !== undefined) params['testId'] = filter.testId.toString();
    if (filter?.active !== undefined) params['active'] = filter.active.toString();
    
    return this.apiService.get<Equipment[]>('equipment', params);
  }

  /**
   * Get specific equipment by ID
   */
  getEquipmentById(id: number): Observable<ApiResponse<Equipment>> {
    return this.apiService.get<Equipment>(`equipment/${id}`);
  }

  /**
   * Get equipment associated with a specific test
   */
  getEquipmentForTest(testId: number): Observable<ApiResponse<Equipment[]>> {
    return this.apiService.get<Equipment[]>(`equipment/test/${testId}`);
  }

  /**
   * Get equipment by type (tube, thermometer, etc.)
   */
  getEquipmentByType(type: string): Observable<ApiResponse<Equipment[]>> {
    return this.apiService.get<Equipment[]>(`equipment/type/${type}`);
  }

  /**
   * Get viscosity tubes formatted for dropdown selection
   * Returns tubes in piped format: "equipmentId|calibrationValue"
   */
  getViscosityTubesForTest(testId: number): Observable<TubeOption[]> {
    return new Observable(observer => {
      this.getEquipmentForTest(testId).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            // Filter to only tubes and format for dropdown
            const tubes = response.data
              .filter(e => e.equipmentType === 'tube' && e.status === 'active')
              .map(tube => ({
                value: `${tube.equipmentId}|${tube.calibrationValue || 0}`,
                label: `${tube.name} (${tube.calibrationValue} ${tube.calibrationUnit || ''})`
              }));
            
            // Add placeholder option
            const options: TubeOption[] = [
              { value: '', label: 'Select Tube' },
              ...tubes
            ];
            
            observer.next(options);
            observer.complete();
          } else {
            observer.error(new Error(response.error || 'Failed to fetch tubes'));
          }
        },
        error: (error) => {
          observer.error(error);
        }
      });
    });
  }

  /**
   * Get active equipment (not expired calibration)
   */
  getActiveEquipment(): Observable<ApiResponse<Equipment[]>> {
    return this.getEquipment({ active: true });
  }

  /**
   * Get equipment needing calibration (due within 30 days)
   */
  getEquipmentNeedingCalibration(): Observable<ApiResponse<Equipment[]>> {
    return new Observable(observer => {
      this.getEquipment().subscribe({
        next: (response) => {
          if (response.success && response.data) {
            const now = Date.now();
            const thirtyDaysFromNow = now + (30 * 24 * 60 * 60 * 1000);
            
            const needsCalibration = response.data.filter(e => {
              return e.calibrationDueDate && 
                     e.calibrationDueDate <= thirtyDaysFromNow &&
                     e.status === 'active';
            });
            
            observer.next({
              success: true,
              data: needsCalibration,
              count: needsCalibration.length
            });
            observer.complete();
          } else {
            observer.error(new Error(response.error || 'Failed to fetch equipment'));
          }
        },
        error: (error) => observer.error(error)
      });
    });
  }

  /**
   * Create new equipment
   */
  createEquipment(equipment: Partial<Equipment>): Observable<ApiResponse<Equipment>> {
    return this.apiService.post<Equipment>('equipment', equipment);
  }

  /**
   * Update existing equipment
   */
  updateEquipment(id: number, equipment: Partial<Equipment>): Observable<ApiResponse<Equipment>> {
    return this.apiService.put<Equipment>(`equipment/${id}`, equipment);
  }

  /**
   * Delete equipment (soft delete - sets status to inactive)
   */
  deleteEquipment(id: number): Observable<ApiResponse<void>> {
    return this.apiService.delete<void>(`equipment/${id}`);
  }

  /**
   * Get calibration history for equipment
   */
  getCalibrationHistory(equipmentId: number): Observable<ApiResponse<EquipmentCalibrationHistory[]>> {
    return this.apiService.get<EquipmentCalibrationHistory[]>(`equipment/${equipmentId}/calibration`);
  }

  /**
   * Add new calibration record
   */
  addCalibrationRecord(
    equipmentId: number,
    calibration: Partial<EquipmentCalibrationHistory>
  ): Observable<ApiResponse<EquipmentCalibrationHistory>> {
    return this.apiService.post<EquipmentCalibrationHistory>(
      `equipment/${equipmentId}/calibration`,
      calibration
    );
  }

  /**
   * Check if equipment calibration is valid
   */
  isCalibrationValid(equipment: Equipment): boolean {
    if (!equipment.calibrationDueDate) {
      return false;
    }
    return equipment.calibrationDueDate > Date.now();
  }

  /**
   * Get days until calibration expires
   */
  getDaysUntilCalibrationExpires(equipment: Equipment): number | null {
    if (!equipment.calibrationDueDate) {
      return null;
    }
    const now = Date.now();
    const diff = equipment.calibrationDueDate - now;
    return Math.ceil(diff / (24 * 60 * 60 * 1000));
  }

  /**
   * Search equipment (for autocomplete/lookup)
   */
  searchEquipment(query: string): Observable<ApiResponse<Equipment[]>> {
    return this.getEquipment({ search: query });
  }
}

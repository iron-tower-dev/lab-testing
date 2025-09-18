import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, ApiResponse } from './api.service';

export interface TestMethodConfig {
  id: number;
  testId: number;
  configKey: string;
  configValue: any; // Can be string, number, object, array, etc.
  description?: string;
  active: boolean;
}

export interface CreateTestMethodConfigRequest {
  testId: number;
  configKey: string;
  configValue: any;
  description?: string;
  active?: boolean;
}

export interface UpdateTestMethodConfigRequest extends Partial<CreateTestMethodConfigRequest> {
  id?: never; // Prevent passing ID in update request body
}

export interface TestMethodConfigurations {
  [configKey: string]: TestMethodConfig;
}

@Injectable({
  providedIn: 'root'
})
export class TestMethodConfigService {
  private readonly apiService = inject(ApiService);

  /**
   * Get all test method configurations with optional filtering
   */
  getAllConfigs(testId?: number, configKey?: string): Observable<ApiResponse<TestMethodConfig[]>> {
    const params: any = {};
    if (testId) params.testId = testId.toString();
    if (configKey) params.configKey = configKey;
    
    return this.apiService.get<TestMethodConfig[]>('test-method-config', Object.keys(params).length > 0 ? params : undefined);
  }

  /**
   * Get all configurations for a specific test (organized by config key)
   */
  getConfigsForTest(testId: number): Observable<ApiResponse<TestMethodConfigurations>> {
    return this.apiService.get<TestMethodConfigurations>(`test-method-config/${testId}`);
  }

  /**
   * Get a specific configuration value
   */
  getSpecificConfig(testId: number, configKey: string): Observable<ApiResponse<TestMethodConfig>> {
    return this.apiService.get<TestMethodConfig>(`test-method-config/${testId}/${configKey}`);
  }

  /**
   * Get configuration value for dropdown options (like solvents, indicators, etc.)
   */
  getConfigOptions(testId: number, configKey: string): Observable<{value: string; label: string}[]> {
    return new Observable(observer => {
      this.getSpecificConfig(testId, configKey).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            const configValue = response.data.configValue;
            let options: {value: string; label: string}[] = [];
            
            if (Array.isArray(configValue)) {
              // If configValue is an array of strings or objects
              options = configValue.map(item => {
                if (typeof item === 'string') {
                  return { value: item, label: item };
                } else if (typeof item === 'object' && item.value && item.label) {
                  return { value: item.value, label: item.label };
                }
                return { value: String(item), label: String(item) };
              });
            } else if (typeof configValue === 'object' && configValue.options) {
              // If configValue has an 'options' property
              options = configValue.options;
            }
            
            observer.next(options);
            observer.complete();
          } else {
            observer.next([]);
            observer.complete();
          }
        },
        error: (error) => {
          console.warn(`Failed to load config ${configKey} for test ${testId}:`, error);
          observer.next([]);
          observer.complete();
        }
      });
    });
  }

  /**
   * Create a new test method configuration
   */
  createConfig(config: CreateTestMethodConfigRequest): Observable<ApiResponse<TestMethodConfig>> {
    return this.apiService.post<TestMethodConfig>('test-method-config', config);
  }

  /**
   * Update an existing test method configuration
   */
  updateConfig(id: number, config: UpdateTestMethodConfigRequest): Observable<ApiResponse<TestMethodConfig>> {
    return this.apiService.put<TestMethodConfig>(`test-method-config/${id}`, config);
  }

  /**
   * Delete (deactivate) a test method configuration
   */
  deleteConfig(id: number): Observable<ApiResponse<any>> {
    return this.apiService.delete(`test-method-config/${id}`);
  }

  /**
   * Initialize common configurations for a test type
   */
  initializeCommonConfigs(testId: number, testName: string): Observable<ApiResponse<TestMethodConfig>[]> {
    const commonConfigs = this.getCommonConfigsForTestType(testName);
    
    return new Observable(observer => {
      const results: ApiResponse<TestMethodConfig>[] = [];
      let completed = 0;
      
      if (commonConfigs.length === 0) {
        observer.next([]);
        observer.complete();
        return;
      }
      
      commonConfigs.forEach(config => {
        this.createConfig({
          testId,
          configKey: config.key,
          configValue: config.value,
          description: config.description,
          active: true
        }).subscribe({
          next: (response) => {
            results.push(response);
            completed++;
            if (completed === commonConfigs.length) {
              observer.next(results);
              observer.complete();
            }
          },
          error: (error) => {
            console.error(`Failed to create config ${config.key}:`, error);
            completed++;
            if (completed === commonConfigs.length) {
              observer.next(results);
              observer.complete();
            }
          }
        });
      });
    });
  }

  /**
   * Get common configurations based on test type name
   */
  private getCommonConfigsForTestType(testName: string): Array<{key: string; value: any; description?: string}> {
    const testType = testName.toLowerCase();
    
    if (testType.includes('tan')) {
      return [
        {
          key: 'solvents',
          value: [
            { value: 'Isopropanol/Toluene', label: 'Isopropanol/Toluene (1:1)' },
            { value: 'Isopropanol/Water', label: 'Isopropanol/Water' },
            { value: 'Toluene/Methanol', label: 'Toluene/Methanol' },
            { value: 'Other', label: 'Other' }
          ],
          description: 'Available solvent systems for TAN titration'
        },
        {
          key: 'indicators',
          value: [
            { value: 'P-Naphtholbenzein', label: 'P-Naphtholbenzein' },
            { value: 'Alkali Blue', label: 'Alkali Blue' },
            { value: 'Potentiometric', label: 'Potentiometric (no indicator)' },
            { value: 'Other', label: 'Other' }
          ],
          description: 'Available color indicators for TAN titration'
        },
        {
          key: 'temperature_range',
          value: { min: 15, max: 35, typical: 22, unit: '°C' },
          description: 'Acceptable temperature range for TAN testing'
        },
        {
          key: 'koh_normality_range',
          value: { min: 0.0001, max: 1.0000, typical: 0.1000, unit: 'N' },
          description: 'Acceptable KOH normality range'
        }
      ];
    }
    
    if (testType.includes('viscosity')) {
      return [
        {
          key: 'temperature_control',
          value: { tolerance: 0.02, unit: '°C' },
          description: 'Temperature control requirements for viscosity testing'
        },
        {
          key: 'time_variation_limit',
          value: { percentage: 0.2 },
          description: 'Maximum acceptable variation between timing runs'
        },
        {
          key: 'iso3448_grades',
          value: [
            { min: 1.98, max: 2.42, grade: 'VG 2' },
            { min: 4.14, max: 5.06, grade: 'VG 5' },
            { min: 6.12, max: 7.48, grade: 'VG 7' },
            { min: 9.0, max: 11.0, grade: 'VG 10' },
            { min: 13.5, max: 16.5, grade: 'VG 15' },
            { min: 19.8, max: 24.2, grade: 'VG 22' },
            { min: 28.8, max: 35.2, grade: 'VG 32' },
            { min: 41.4, max: 50.6, grade: 'VG 46' },
            { min: 61.2, max: 74.8, grade: 'VG 68' },
            { min: 90, max: 110, grade: 'VG 100' }
          ],
          description: 'ISO 3448 viscosity grade classifications'
        }
      ];
    }
    
    if (testType.includes('rust')) {
      return [
        {
          key: 'test_methods',
          value: [
            { value: 'A', label: 'Method A (Distilled Water)', description: 'Using distilled water' },
            { value: 'B', label: 'Method B (Synthetic Seawater)', description: 'Using synthetic seawater' }
          ],
          description: 'Available rust test methods'
        },
        {
          key: 'rating_scale',
          value: {
            scale: [
              { rating: 0, description: 'No rust' },
              { rating: 1, description: 'Slight rust (less than 5 spots)' },
              { rating: 2, description: 'Moderate rust (5-25 spots)' },
              { rating: 3, description: 'Heavy rust (more than 25 spots)' },
              { rating: 4, description: 'Complete rust coverage' }
            ]
          },
          description: 'Rust rating scale definitions'
        }
      ];
    }
    
    // Default configurations for unknown test types
    return [];
  }

  /**
   * Helper method to get TAN-specific configurations
   */
  getTANConfigurations(testId: number) {
    return {
      getSolvents: () => this.getConfigOptions(testId, 'solvents'),
      getIndicators: () => this.getConfigOptions(testId, 'indicators'),
      getTemperatureRange: () => this.getSpecificConfig(testId, 'temperature_range'),
      getKOHNormalityRange: () => this.getSpecificConfig(testId, 'koh_normality_range')
    };
  }

  /**
   * Helper method to get Viscosity-specific configurations
   */
  getViscosityConfigurations(testId: number) {
    return {
      getTemperatureControl: () => this.getSpecificConfig(testId, 'temperature_control'),
      getTimeVariationLimit: () => this.getSpecificConfig(testId, 'time_variation_limit'),
      getISO3448Grades: () => this.getSpecificConfig(testId, 'iso3448_grades')
    };
  }

  /**
   * Helper method to get Rust-specific configurations
   */
  getRustConfigurations(testId: number) {
    return {
      getTestMethods: () => this.getConfigOptions(testId, 'test_methods'),
      getRatingScale: () => this.getSpecificConfig(testId, 'rating_scale')
    };
  }
}

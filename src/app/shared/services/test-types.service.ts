import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, ApiResponse } from './api.service';

export interface TestType {
  testId: number;
  testCode: string;
  testName: string;
  description?: string;
  category?: string;
  status?: string;
  displayOrder?: number;
  requiresSample?: boolean;
  hasCalculation?: boolean;
  calculationFormula?: string;
  standardProcedure?: string;
  equipment?: string;
  units?: string;
  decimalPlaces?: number;
  minValue?: number;
  maxValue?: number;
  defaultTrials?: number;
  isActive: boolean;
}

export interface TestTypeCreate {
  testCode: string;
  testName: string;
  description?: string;
  category?: string;
  status?: string;
  displayOrder?: number;
  requiresSample?: boolean;
  hasCalculation?: boolean;
  calculationFormula?: string;
  standardProcedure?: string;
  equipment?: string;
  units?: string;
  decimalPlaces?: number;
  minValue?: number;
  maxValue?: number;
  defaultTrials?: number;
  isActive?: boolean;
}

export interface TestTypeFilter {
  category?: string;
  status?: string;
  isActive?: boolean;
  hasCalculation?: boolean;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface TestField {
  fieldId: number;
  testId: number;
  fieldName: string;
  fieldLabel: string;
  fieldType: 'number' | 'text' | 'date' | 'boolean' | 'select';
  fieldOrder: number;
  isRequired: boolean;
  defaultValue?: string;
  validationRules?: string;
  placeholder?: string;
  helpText?: string;
  options?: string[]; // For select type fields
}

export interface TestTemplate {
  templateId: number;
  templateName: string;
  description?: string;
  testIds: number[];
  isDefault?: boolean;
  category?: string;
  createdDate?: Date;
  updatedDate?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class TestTypesService {
  private readonly apiService = inject(ApiService);

  /**
   * Get all test types with optional filtering
   */
  getTestTypes(filter?: TestTypeFilter): Observable<ApiResponse<TestType[]>> {
    const params: Record<string, string> = {};
    
    if (filter?.category) params['category'] = filter.category;
    if (filter?.status) params['status'] = filter.status;
    if (filter?.isActive !== undefined) params['isActive'] = filter.isActive.toString();
    if (filter?.hasCalculation !== undefined) params['hasCalculation'] = filter.hasCalculation.toString();
    if (filter?.search) params['search'] = filter.search;
    if (filter?.sortBy) params['sortBy'] = filter.sortBy;
    if (filter?.sortOrder) params['sortOrder'] = filter.sortOrder;

    return this.apiService.get<TestType[]>('test-types', params);
  }

  /**
   * Get active test types only (commonly used for dropdowns)
   */
  getActiveTestTypes(): Observable<ApiResponse<TestType[]>> {
    return this.getTestTypes({ isActive: true });
  }

  /**
   * Get a specific test type by ID
   */
  getTestType(testId: number): Observable<ApiResponse<TestType>> {
    return this.apiService.get<TestType>(`test-types/${testId}`);
  }

  /**
   * Get test type by code
   */
  getTestTypeByCode(testCode: string): Observable<ApiResponse<TestType>> {
    return this.apiService.get<TestType>(`test-types/by-code/${encodeURIComponent(testCode)}`);
  }

  /**
   * Create a new test type
   */
  createTestType(testType: TestTypeCreate): Observable<ApiResponse<TestType>> {
    return this.apiService.post<TestType>('test-types', testType);
  }

  /**
   * Update an existing test type
   */
  updateTestType(testId: number, testType: Partial<TestTypeCreate>): Observable<ApiResponse<TestType>> {
    return this.apiService.put<TestType>(`test-types/${testId}`, testType);
  }

  /**
   * Delete a test type (soft delete - sets isActive to false)
   */
  deleteTestType(testId: number): Observable<ApiResponse<void>> {
    return this.apiService.delete<void>(`test-types/${testId}`);
  }

  /**
   * Get test fields/form definition for a specific test type
   */
  getTestFields(testId: number): Observable<ApiResponse<TestField[]>> {
    return this.apiService.get<TestField[]>(`test-types/${testId}/fields`);
  }

  /**
   * Update test fields for a test type
   */
  updateTestFields(testId: number, fields: TestField[]): Observable<ApiResponse<TestField[]>> {
    return this.apiService.put<TestField[]>(`test-types/${testId}/fields`, { fields });
  }

  /**
   * Get test categories for grouping/filtering
   */
  getTestCategories(): Observable<ApiResponse<string[]>> {
    return this.apiService.get<string[]>('test-types/categories');
  }

  /**
   * Search test types (for autocomplete/lookup)
   */
  searchTestTypes(query: string, limit = 10): Observable<ApiResponse<TestType[]>> {
    const params = {
      q: query,
      limit: limit.toString(),
      isActive: 'true'
    };
    return this.apiService.get<TestType[]>('test-types/search', params);
  }

  /**
   * Get test templates
   */
  getTestTemplates(): Observable<ApiResponse<TestTemplate[]>> {
    return this.apiService.get<TestTemplate[]>('test-templates');
  }

  /**
   * Get a specific test template
   */
  getTestTemplate(templateId: number): Observable<ApiResponse<TestTemplate>> {
    return this.apiService.get<TestTemplate>(`test-templates/${templateId}`);
  }

  /**
   * Create a new test template
   */
  createTestTemplate(template: Omit<TestTemplate, 'templateId' | 'createdDate' | 'updatedDate'>): Observable<ApiResponse<TestTemplate>> {
    return this.apiService.post<TestTemplate>('test-templates', template);
  }

  /**
   * Update a test template
   */
  updateTestTemplate(templateId: number, template: Partial<TestTemplate>): Observable<ApiResponse<TestTemplate>> {
    return this.apiService.put<TestTemplate>(`test-templates/${templateId}`, template);
  }

  /**
   * Delete a test template
   */
  deleteTestTemplate(templateId: number): Observable<ApiResponse<void>> {
    return this.apiService.delete<void>(`test-templates/${templateId}`);
  }

  /**
   * Get tests by template
   */
  getTestsByTemplate(templateId: number): Observable<ApiResponse<TestType[]>> {
    return this.apiService.get<TestType[]>(`test-templates/${templateId}/tests`);
  }

  /**
   * Get most frequently used test types for quick access
   */
  getPopularTestTypes(limit = 10): Observable<ApiResponse<TestType[]>> {
    const params = { limit: limit.toString() };
    return this.apiService.get<TestType[]>('test-types/popular', params);
  }

  /**
   * Validate test code uniqueness
   */
  validateTestCode(testCode: string, excludeTestId?: number): Observable<ApiResponse<{ isValid: boolean; message?: string }>> {
    const params: Record<string, string> = {};
    if (excludeTestId) params['excludeTestId'] = excludeTestId.toString();
    
    return this.apiService.get<{ isValid: boolean; message?: string }>(
      `test-types/validate-code/${encodeURIComponent(testCode)}`, 
      params
    );
  }

  /**
   * Get test type statistics (usage, completion rates, etc.)
   */
  getTestTypeStats(testId: number): Observable<ApiResponse<{
    totalSamples: number;
    completedTests: number;
    averageCompletionTime: number;
    lastUsed?: Date;
  }>> {
    return this.apiService.get<{
      totalSamples: number;
      completedTests: number;
      averageCompletionTime: number;
      lastUsed?: Date;
    }>(`test-types/${testId}/stats`);
  }
}

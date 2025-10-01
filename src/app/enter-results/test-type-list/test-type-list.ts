import { Component, output, signal, inject, computed, effect } from '@angular/core';
import { TestReference, TestIdentifierUtils } from '../enter-results.types';
import { SharedModule } from '../../shared-module';
import { TestsService } from '../../shared/services/tests.service';
import { QualificationService } from '../../shared/services/qualification.service';

@Component({
  selector: 'app-test-type-list',
  imports: [SharedModule],
  templateUrl: './test-type-list.html',
  styleUrl: './test-type-list.css'
})
export class TestTypeList {
  private readonly testsService = inject(TestsService);
  private readonly qualService = inject(QualificationService);
  
  // Signals using new type system
  readonly selectedTestReference = signal<TestReference | null>(null);
  readonly testReferenceOptions = signal<Array<{ reference: TestReference; label: string }>>([]);
  readonly selectedTestReferenceChange = output<TestReference | null>({});
  
  // Qualification state
  readonly qualificationsLoaded = computed(() => this.qualService.activeQualifications().length > 0);
  readonly currentEmployeeId = computed(() => this.qualService.currentEmployeeId());
  
  constructor() {
    this.loadTestOptions();
    this.loadUserQualifications();
  }
  
  private loadTestOptions() {
    this.testsService.getAllTestOptions().subscribe({
      next: (options) => {
        this.testReferenceOptions.set(options);
      },
      error: (error) => {
        console.error('Failed to load test options from API:', error);
        this.testReferenceOptions.set([]);
      }
    });
  }

  setSelectedTestReference(testReference: TestReference | null) {
    this.selectedTestReference.set(testReference);
    this.selectedTestReferenceChange.emit(testReference);
  }

  private loadUserQualifications() {
    // Get current user (TODO: Replace with actual auth service)
    const currentUser = this.getCurrentUser();
    if (currentUser?.employeeId) {
      this.qualService.loadUserQualifications(currentUser.employeeId).subscribe({
        next: () => {
          console.log('User qualifications loaded successfully');
        },
        error: (error) => {
          console.error('Failed to load user qualifications:', error);
        }
      });
    }
  }
  
  /**
   * Check if user is qualified for a specific test
   */
  canSelectTest(testReference: TestReference): boolean {
    if (!testReference.testStandId) {
      // No test stand specified, allow selection (will be validated elsewhere)
      return true;
    }
    
    // Check if qualifications are loaded
    if (!this.qualificationsLoaded()) {
      // Still loading, optimistically allow selection
      return true;
    }
    
    return this.qualService.isQualifiedForTestStand(testReference.testStandId);
  }
  
  /**
   * Get qualification badge info for display
   */
  getQualificationBadge(testReference: TestReference): {
    level: string | null;
    label: string;
    color: string;
    isExpired: boolean;
  } | null {
    if (!testReference.testStandId) return null;
    return this.qualService.getQualificationBadge(testReference.testStandId);
  }
  
  /**
   * Get the qualification level for display
   */
  getQualificationLevel(testReference: TestReference): string | null {
    if (!testReference.testStandId) return null;
    return this.qualService.getQualificationLevel(testReference.testStandId);
  }
  
  /**
   * Check if user can submit final results (Q, QAG, or MicrE)
   */
  canSubmitFinal(testReference: TestReference): boolean {
    const level = this.getQualificationLevel(testReference);
    return level === 'Q' || level === 'QAG' || level === 'MicrE';
  }
  
  /**
   * Check if user needs review (TRAIN level)
   */
  needsReview(testReference: TestReference): boolean {
    const level = this.getQualificationLevel(testReference);
    return level === 'TRAIN';
  }
  
  // Helper method to get display name
  getDisplayName(testReference: TestReference): string {
    return TestIdentifierUtils.getDisplayName(testReference);
  }
  
  /**
   * Get current user from storage or mock
   * TODO: Replace with actual auth service
   */
  private getCurrentUser(): { employeeId: string; name: string } | null {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch (e) {
        console.error('Failed to parse stored user:', e);
      }
    }
    
    // Mock user for development
    return {
      employeeId: 'EMP001',
      name: 'Test User'
    };
  }
}

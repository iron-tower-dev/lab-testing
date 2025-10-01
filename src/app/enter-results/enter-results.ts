import { Component, signal, computed, inject } from '@angular/core';
import { SampleSelectionPanel } from './sample-selection-panel/sample-selection-panel';
import { EntryFormArea } from './entry-form-area/entry-form-area';
import { TestTypeList } from './test-type-list/test-type-list';
import { TestReference } from './enter-results.types';
import { QualificationService } from '../shared/services/qualification.service';

@Component({
  selector: 'app-enter-results',
  imports: [SampleSelectionPanel, EntryFormArea, TestTypeList],
  templateUrl: './enter-results.html',
  styleUrl: './enter-results.css'
})
export class EnterResults {
  private readonly qualService = inject(QualificationService);
  
  // Signals for reactive state management
  readonly selectedTestReference = signal<TestReference | null>(null);
  readonly selectedSample = signal<{ testReference: TestReference; sampleId: string; sampleDetails?: any } | null>(null);

  // Computed properties
  readonly initialTestSelected = computed(() => this.selectedTestReference() !== null);
  
  // Qualification-related computed properties
  readonly qualificationsLoaded = computed(() => this.qualService.activeQualifications().length > 0);
  readonly currentTestStandId = computed(() => this.selectedTestReference()?.testStandId || null);
  readonly isQualifiedForCurrentTest = computed(() => {
    const testStandId = this.currentTestStandId();
    return testStandId ? this.qualService.isQualifiedForTestStand(testStandId) : true;
  });
  readonly currentQualificationLevel = computed(() => {
    const testStandId = this.currentTestStandId();
    return testStandId ? this.qualService.getQualificationLevel(testStandId) : null;
  });

  constructor() {
    // Load user qualifications on component init
    this.loadUserQualifications();
  }
  
  onTestTypeSelected(testReference: TestReference | null) {
    if (testReference) {
      // Verify qualification before allowing selection
      if (testReference.testStandId) {
        const isQualified = this.qualService.isQualifiedForTestStand(testReference.testStandId);
        if (!isQualified) {
          console.warn('User not qualified for selected test', testReference);
          // TODO: Show user-friendly error message
          return;
        }
      }
      
      this.selectedTestReference.set(testReference);
      // Reset any previously selected sample when test type changes
      this.selectedSample.set(null);
    }
  }

  onSampleSelected(event: { testReference: TestReference; sampleId: string; sampleDetails?: any }) {
    this.selectedSample.set(event);
  }
  
  private loadUserQualifications() {
    const currentUser = this.getCurrentUser();
    if (currentUser?.employeeId) {
      this.qualService.loadUserQualifications(currentUser.employeeId).subscribe({
        next: () => {
          console.log('Qualifications loaded in EnterResults component');
        },
        error: (error) => {
          console.error('Failed to load qualifications:', error);
        }
      });
    }
  }
  
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

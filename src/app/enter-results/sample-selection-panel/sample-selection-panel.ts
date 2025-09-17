import { Component, computed, input, output, signal, inject, effect } from '@angular/core';
import { TestReference, TestIdentifierUtils, SampleTestResponse } from '../enter-results.types';
import { SharedModule } from '../../shared-module';
import { SampleService } from '../../shared/services/sample.service';
import { TestsService } from '../../shared/services/tests.service';

@Component({
  selector: 'app-sample-selection-panel',
  imports: [SharedModule],
  templateUrl: './sample-selection-panel.html',
  styleUrl: './sample-selection-panel.css'
})
export class SampleSelectionPanel {
  private readonly sampleService = inject(SampleService);
  private readonly testsService = inject(TestsService);
  
  // Inputs/Outputs using new type system
  selectedTestReference = input<TestReference | null>(null);
  selectedTestReferenceChange = output<TestReference | null>({});

  // Emits when a sample is chosen under the selected test
  sampleSelected = output<{ testReference: TestReference; sampleId: string; sampleDetails?: any }>({});

  // Load real test options from API
  readonly testReferenceOptions = signal<Array<{ reference: TestReference; label: string }>>([]);
  
  // Signals for API-fetched data
  private readonly apiSamples = signal<SampleTestResponse[]>([]);
  private readonly loading = signal(false);
  private readonly error = signal<string | null>(null);

  // Effect to fetch samples when test reference changes
  constructor() {
    // Load test options from API on component initialization
    this.loadTestOptions();
    
    effect(() => {
      const testRef = this.selectedTestReference();
      if (testRef?.id) {
        this.loadSamplesForTest(testRef.id);
      } else {
        this.apiSamples.set([]);
      }
    });
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
    this.selectedTestReferenceChange.emit(testReference);
  }

  // Computed property that combines API samples with fallback legacy samples
  sampleNumbers = computed(() => {
    const testRef = this.selectedTestReference();
    if (!testRef) return [];
    
    const apiSamples = this.apiSamples();
    if (apiSamples.length > 0) {
      return apiSamples.map(sample => sample.sampleNumber);
    }
    
    // Fallback: generate sample IDs based on test reference
    const abbrev = testRef.abbrev || testRef.shortAbbrev || `T${testRef.id}`;
    return [101, 102, 103, 104].map(n => `${abbrev}-${n}`);
  });

  // Get API samples for display with full information
  getApiSamples = computed(() => this.apiSamples());
  
  isLoading = computed(() => this.loading());
  getError = computed(() => this.error());

  private loadSamplesForTest(testId: number) {
    this.loading.set(true);
    this.error.set(null);
    
    // Try to load from API first, but fallback to mock data if endpoint doesn't exist
    this.sampleService.getSamplesByTest(testId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.apiSamples.set(response.data);
        } else {
          this.apiSamples.set([]);
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.warn('API endpoint not available, using mock data:', error.message);
        
        // Generate mock sample data for the test
        const testRef = this.selectedTestReference();
        if (testRef) {
          const mockSamples = this.generateMockSamples(testRef);
          this.apiSamples.set(mockSamples);
        } else {
          this.apiSamples.set([]);
        }
        this.error.set(null); // Don't show error for missing API endpoint
        this.loading.set(false);
      }
    });
  }
  
  private generateMockSamples(testReference: TestReference): SampleTestResponse[] {
    const abbrev = testReference.abbrev || testReference.shortAbbrev || `T${testReference.id}`;
    return [101, 102, 103, 104, 105].map(n => ({
      sampleId: n,
      sampleNumber: `${abbrev}-${n}`,
      testId: testReference.id,
      testName: testReference.name || 'Unknown Test',
      eqTagNum: `EQ-${Math.floor(Math.random() * 1000) + 1000}`,
      component: ['Motor', 'Gear Box', 'Hydraulic System', 'Compressor', 'Pump'][Math.floor(Math.random() * 5)],
      location: ['Plant A', 'Plant B', 'Warehouse', 'Production Line 1', 'Production Line 2'][Math.floor(Math.random() * 5)],
      lubeType: ['SAE 10W-30', 'SAE 20W-50', 'ISO VG 46', 'ISO VG 68', 'Synthetic 5W-40'][Math.floor(Math.random() * 5)],
      techData: `Tech data for ${abbrev}`,
      qualityClass: ['Premium', 'Standard', 'High Performance', 'Synthetic'][Math.floor(Math.random() * 4)],
      labComments: Math.random() > 0.5 ? [`Sample ${n} looks good`, 'Standard analysis requested'] : undefined,
      status: 'assigned',
      priority: 1,
      assignedDate: new Date()
    }));
  }

  onSampleClick(sampleId: string) {
    const testRef = this.selectedTestReference();
    if (!testRef) return;
    
    // Find the full sample details if available from API
    const apiSamples = this.apiSamples();
    const sampleDetails = apiSamples.find(s => s.sampleNumber === sampleId);
    
    const event = { 
      testReference: testRef, 
      sampleId,
      sampleDetails
    };
    this.sampleSelected.emit(event);
  }

  // Helper method to get display name
  getDisplayName(testReference: TestReference): string {
    return TestIdentifierUtils.getDisplayName(testReference);
  }

  // Compare function for mat-select to properly match TestReference objects
  compareTestReferences = (ref1: TestReference | null, ref2: TestReference | null): boolean => {
    if (!ref1 || !ref2) {
      return ref1 === ref2;
    }
    return ref1.id === ref2.id;
  };
}

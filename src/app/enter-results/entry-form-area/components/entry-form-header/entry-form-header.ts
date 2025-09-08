import { Component, input, computed, inject, effect, signal } from '@angular/core';
import { SampleWithTestInfo, TestReference } from '../../../enter-results.types';
import { SampleService } from '../../../../shared/services/sample.service';
import { SharedModule } from '../../../../shared-module';

@Component({
  selector: 'app-entry-form-header',
  imports: [SharedModule],
  templateUrl: './entry-form-header.html',
  styleUrl: './entry-form-header.scss'
})
export class EntryFormHeader {
  private readonly sampleService = inject(SampleService);
  
  // Input signals
  selectedSample = input<{ testReference: TestReference; sampleId: string; sampleDetails?: any } | null>(null);
  
  // Internal state signals
  private readonly sampleInfo = signal<SampleWithTestInfo | null>(null);
  private readonly loading = signal(false);
  private readonly error = signal<string | null>(null);
  
  // Computed properties for template
  readonly isLoading = computed(() => this.loading());
  readonly errorMessage = computed(() => this.error());
  readonly hasSampleInfo = computed(() => this.sampleInfo() !== null);
  readonly sampleData = computed(() => this.sampleInfo());
  
  constructor() {
    // Effect to load detailed sample information when selected sample changes
    effect(() => {
      const sample = this.selectedSample();
      if (sample) {
        this.loadSampleDetails(sample);
      } else {
        this.sampleInfo.set(null);
        this.error.set(null);
      }
    });
  }
  
  private loadSampleDetails(sample: { testReference: TestReference; sampleId: string; sampleDetails?: any }) {
    // If we already have detailed sample info from the panel, use it
    if (sample.sampleDetails) {
      const sampleInfo: SampleWithTestInfo = {
        sampleId: sample.sampleDetails.sampleId,
        sampleNumber: sample.sampleDetails.sampleNumber,
        testName: sample.sampleDetails.testName,
        eqTagNum: sample.sampleDetails.eqTagNum || null,
        component: sample.sampleDetails.component || null,
        location: sample.sampleDetails.location || null,
        lubeType: sample.sampleDetails.lubeType || null,
        techData: sample.sampleDetails.techData || null,
        qualityClass: sample.sampleDetails.qualityClass || null,
        labComments: sample.sampleDetails.labComments || null,
        testReference: sample.testReference
      };
      this.sampleInfo.set(sampleInfo);
      return;
    }
    
    // Otherwise, extract the sample ID from the sampleId string and fetch details
    const sampleIdMatch = sample.sampleId.match(/-(\d+)$/);
    if (sampleIdMatch) {
      const numericSampleId = parseInt(sampleIdMatch[1], 10);
      this.fetchSampleDetails(numericSampleId, sample.testReference);
    } else {
      // Create minimal sample info from available data
      const basicInfo: SampleWithTestInfo = {
        sampleId: 0, // Unknown ID
        sampleNumber: sample.sampleId,
        testName: sample.testReference.name || 'Unknown Test',
        eqTagNum: null,
        component: null,
        location: null,
        lubeType: null,
        techData: null,
        qualityClass: null,
        labComments: null,
        testReference: sample.testReference
      };
      this.sampleInfo.set(basicInfo);
    }
  }
  
  private fetchSampleDetails(sampleId: number, testReference: TestReference) {
    this.loading.set(true);
    this.error.set(null);
    
    this.sampleService.getSampleDetails(sampleId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const data = response.data;
          const sampleInfo: SampleWithTestInfo = {
            sampleId: data.sampleId || sampleId,
            sampleNumber: data.sampleNumber || `Sample-${sampleId}`,
            testName: testReference.name || 'Unknown Test',
            eqTagNum: data.tagNumber || null,
            component: data.compName || null,
            location: data.locName || null,
            lubeType: data.lubeType || null,
            techData: data.techData || null,
            qualityClass: data.qualityClass || null,
            labComments: data.labComments || null,
            testReference: testReference
          };
          this.sampleInfo.set(sampleInfo);
        } else {
          this.error.set('Failed to load sample details');
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading sample details:', error);
        this.error.set('Failed to load sample details');
        this.loading.set(false);
      }
    });
  }
}

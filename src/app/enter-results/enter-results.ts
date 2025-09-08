import { Component, signal, computed } from '@angular/core';
import { SampleSelectionPanel } from './sample-selection-panel/sample-selection-panel';
import { EntryFormArea } from './entry-form-area/entry-form-area';
import { TestTypeList } from './test-type-list/test-type-list';
import { TestReference } from './enter-results.types';

@Component({
  selector: 'app-enter-results',
  imports: [SampleSelectionPanel, EntryFormArea, TestTypeList],
  templateUrl: './enter-results.html',
  styleUrl: './enter-results.scss',
})
export class EnterResults {
  // Signals for reactive state management
  readonly selectedTestReference = signal<TestReference | null>(null);
  readonly selectedSample = signal<{ testReference: TestReference; sampleId: string; sampleDetails?: any } | null>(null);

  // Computed properties
  readonly initialTestSelected = computed(() => this.selectedTestReference() !== null);

  onTestTypeSelected(testReference: TestReference | null) {
    if (testReference) {
      this.selectedTestReference.set(testReference);
      // Reset any previously selected sample when test type changes
      this.selectedSample.set(null);
    }
  }

  onSampleSelected(event: { testReference: TestReference; sampleId: string; sampleDetails?: any }) {
    this.selectedSample.set(event);
  }
}

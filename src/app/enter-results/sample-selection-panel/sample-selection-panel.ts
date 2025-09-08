import { Component, computed, input, output } from '@angular/core';
import { TestReference, TestIdentifierUtils, MigrationUtils } from '../enter-results.types';
import { SharedModule } from '../../shared-module';

@Component({
  selector: 'app-sample-selection-panel',
  imports: [SharedModule],
  templateUrl: './sample-selection-panel.html',
  styleUrl: './sample-selection-panel.scss'
})
export class SampleSelectionPanel {
  // Inputs/Outputs using new type system
  selectedTestReference = input<TestReference | null>(null);
  selectedTestReferenceChange = output<TestReference | null>({});

  // Emits when a sample is chosen under the selected test
  sampleSelected = output<{ testReference: TestReference; sampleId: string }>({});

  readonly testReferenceOptions = MigrationUtils.getAllTestOptions();

  setSelectedTestReference(testReference: TestReference | null) {
    this.selectedTestReferenceChange.emit(testReference);
  }

  sampleNumbers = computed(() => {
    const testRef = this.selectedTestReference();
    if (!testRef) return [];
    // Use migration utility to generate sample IDs for the selected test
    return MigrationUtils.generateSampleIds(testRef);
  });

  onSampleClick(sampleId: string) {
    const testRef = this.selectedTestReference();
    if (!testRef) return;
    const event = { testReference: testRef, sampleId };
    this.sampleSelected.emit(event);
  }

  // Helper method to get display name
  getDisplayName(testReference: TestReference): string {
    return TestIdentifierUtils.getDisplayName(testReference);
  }
}

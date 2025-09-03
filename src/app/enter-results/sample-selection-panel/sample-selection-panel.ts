import { Component, computed, input, output } from '@angular/core';
import { TestCode, testCodeToType } from '../enter-results.types';
import { SharedModule } from '../../shared-module';

@Component({
  selector: 'app-sample-selection-panel',
  imports: [SharedModule],
  templateUrl: './sample-selection-panel.html',
  styleUrl: './sample-selection-panel.scss'
})
export class SampleSelectionPanel {
  // Inputs/Outputs for selecting the test code
  selectedTestCode = input<TestCode | null>(null);
  selectedTestCodeChange = output<TestCode | null>({});

  // Emits when a sample is chosen under the selected test
  sampleSelected = output<{ testCode: TestCode; sampleId: string }>({});

  testTypeOptions = Object.entries(testCodeToType).map(([code, label]) => ({ code: code as TestCode, label }));

  setSelectedTestCode(code: TestCode | null) {
    this.selectedTestCodeChange.emit(code);
  }

  sampleNumbers = computed(() => {
    if (!this.selectedTestCode()) return [];
    // Replace with real logic to fetch sample numbers for the selected test code
    return [101, 102, 103, 104].map((n) => `${this.selectedTestCode()}-${n}`);
  });

  onSampleClick(sampleId: string) {
    if (!this.selectedTestCode()) return;
    this.sampleSelected.emit({ testCode: this.selectedTestCode()!, sampleId });
  }
}

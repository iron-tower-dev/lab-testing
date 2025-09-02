import { Component, computed, signal, input } from '@angular/core';
import { TestCode, testCodeToType } from '../enter-results.types';
import { SharedModule } from '../../shared-module';
import { TestTypeSelection } from '../test-type-selection/test-type-selection';

@Component({
  selector: 'app-sample-selection-panel',
  imports: [SharedModule, TestTypeSelection],
  templateUrl: './sample-selection-panel.html',
  styleUrl: './sample-selection-panel.scss'
})
export class SampleSelectionPanel {
  selectedTestCode = input<TestCode | null>(null);
  testTypeOptions = Object.entries(testCodeToType).map(([code, label]) => ({ code: code as TestCode, label }));

  // Simulated sample numbers for demonstration
  sampleNumbers = computed(() => {
    if (!this.selectedTestCode()) return [];
    // Replace with real logic to fetch sample numbers for the selected test code
    return [101, 102, 103, 104].map(n => `${this.selectedTestCode()}-${n}`);
  });
}

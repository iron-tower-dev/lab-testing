import { Component } from '@angular/core';
import { SampleSelectionPanel } from './sample-selection-panel/sample-selection-panel';
import { EntryFormArea } from './entry-form-area/entry-form-area';
import { TestTypeList } from './test-type-list/test-type-list';
import { TestCode } from './enter-results.types';

@Component({
  selector: 'app-enter-results',
  imports: [SampleSelectionPanel, EntryFormArea, TestTypeList],
  templateUrl: './enter-results.html',
  styleUrl: './enter-results.scss',
})
export class EnterResults {
  initialTestSelected = false;
  selectedTestCode: TestCode | null = null;
  selectedSample: { testCode: TestCode; sampleId: string } | null = null;

  onTestTypeSelected(testCode: TestCode | null) {
    if (testCode) {
      this.selectedTestCode = testCode;
      this.initialTestSelected = true;
      // Reset any previously selected sample when test type changes
      this.selectedSample = null;
    }
  }

  onSampleSelected(event: { testCode: TestCode; sampleId: string }) {
    this.selectedSample = event;
  }
}

import { Component } from '@angular/core';
import { SampleSelectionPanel } from './sample-selection-panel/sample-selection-panel';
import { EntryFormArea } from './entry-form-area/entry-form-area';
import { TestTypeList } from "./test-type-list/test-type-list";

@Component({
  selector: 'app-enter-results',
  imports: [SampleSelectionPanel, EntryFormArea, TestTypeList],
  templateUrl: './enter-results.html',
  styleUrl: './enter-results.scss',
})
export class EnterResults {
  initialTestSelected = false;
}

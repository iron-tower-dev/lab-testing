import { Component, input } from '@angular/core';
import { EntryForm } from './components/entry-form/entry-form';
import { EntryFormHeader } from './components/entry-form-header/entry-form-header';
import { TestReference } from '../enter-results.types';

@Component({
  selector: 'app-entry-form-area',
  imports: [EntryFormHeader, EntryForm],
  templateUrl: './entry-form-area.html',
  styleUrl: './entry-form-area.scss'
})
export class EntryFormArea {
  selectedSample = input<{ testReference: TestReference; sampleId: string } | null>(null);
}

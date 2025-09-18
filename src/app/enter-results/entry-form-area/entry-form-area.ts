import { Component, input, effect, signal } from '@angular/core';
import { EntryForm } from './components/entry-form/entry-form';
import { EntryFormHeader } from './components/entry-form-header/entry-form-header';
import { FormControl } from '@angular/forms';
import { TestReference } from '../enter-results.types';

@Component({
  selector: 'app-entry-form-area',
  imports: [EntryFormHeader, EntryForm],
  templateUrl: './entry-form-area.html',
  styleUrl: './entry-form-area.css'
})
export class EntryFormArea {
  // Shared lab comments control for forms that support it
  labCommentsControl = new FormControl('');
  
  constructor() {
    // Initialize lab comments from sample data when available
    effect(() => {
      const sample = this.selectedSample() as any; // Type assertion for expanded sample data
      if (sample?.sampleDetails?.labComments && Array.isArray(sample.sampleDetails.labComments)) {
        // Join existing lab comments with line breaks for editing
        const commentsText = sample.sampleDetails.labComments.join('\n');
        this.labCommentsControl.setValue(commentsText);
      } else {
        this.labCommentsControl.setValue('');
      }
    });
  }
  selectedSample = input<{ testReference: TestReference; sampleId: string } | null>(null);
}

import { Component, input } from '@angular/core';
import { SharedModule } from '../../../../../../shared-module';
import { SampleWithTestInfo } from '../../../../../enter-results.types';

@Component({
  selector: 'app-d-inch-entry-form',
  imports: [SharedModule],
  templateUrl: './d-inch-entry-form.html',
  styleUrl: './d-inch-entry-form.scss',
})
export class DInchEntryForm {
  sampleData = input<SampleWithTestInfo | null>(null);
}

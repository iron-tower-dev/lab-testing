import { Component, OnInit, input } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { SharedModule } from '../../../../../../shared-module';
import { SampleWithTestInfo } from '../../../../../enter-results.types';

@Component({
  standalone: true,
  selector: 'app-vis100-entry-form',
  template: `<div class="vis100-entry-form"><p>Vis100 Form (Coming Soon)</p></div>`,
  styles: [`.vis100-entry-form { padding: 20px; }`],
  imports: [SharedModule]
})
export class Vis100EntryForm implements OnInit {
  sampleData = input<SampleWithTestInfo | null>(null);
  
  fb = new FormBuilder();
  form!: FormGroup;
  isLoading = false;
  errorMessage = input<string | null>(null);

  ngOnInit(): void {
    this.form = this.fb.group({});
  }
}

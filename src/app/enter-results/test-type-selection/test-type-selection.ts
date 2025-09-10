import { Component, output, signal, inject } from '@angular/core';
import { TestReference, TestIdentifierUtils } from '../enter-results.types';
import { SharedModule } from '../../shared-module';
import { TestsService } from '../../shared/services/tests.service';

@Component({
  selector: 'app-test-type-selection',
  imports: [SharedModule],
  templateUrl: './test-type-selection.html',
  styleUrl: './test-type-selection.scss',
})
export class TestTypeSelection {
  private readonly testsService = inject(TestsService);
  
  // Signals using new type system
  readonly selectedTestReference = signal<TestReference | null>(null);
  readonly selectedTestReferenceChange = output<TestReference | null>({});
  readonly testReferenceOptions = signal<Array<{ reference: TestReference; label: string }>>([]);
  
  constructor() {
    this.loadTestOptions();
  }
  
  private loadTestOptions() {
    this.testsService.getAllTestOptions().subscribe({
      next: (options) => {
        this.testReferenceOptions.set(options);
      },
      error: (error) => {
        console.error('Failed to load test options from API:', error);
        this.testReferenceOptions.set([]);
      }
    });
  }

  setSelectedTestReference(testReference: TestReference | null) {
    this.selectedTestReference.set(testReference);
    this.selectedTestReferenceChange.emit(testReference);
  }

  // Helper method to get display name
  getDisplayName(testReference: TestReference): string {
    return TestIdentifierUtils.getDisplayName(testReference);
  }
}

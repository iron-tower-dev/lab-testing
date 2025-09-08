import { Component, output, signal, inject } from '@angular/core';
import { TestReference, TestIdentifierUtils, MigrationUtils } from '../enter-results.types';
import { SharedModule } from '../../shared-module';
import { TestsService } from '../../shared/services/tests.service';

@Component({
  selector: 'app-test-type-list',
  imports: [SharedModule],
  templateUrl: './test-type-list.html',
  styleUrl: './test-type-list.scss'
})
export class TestTypeList {
  private readonly testsService = inject(TestsService);
  
  // Signals using new type system
  readonly selectedTestReference = signal<TestReference | null>(null);
  readonly testReferenceOptions = signal<Array<{ reference: TestReference; label: string }>>([]);
  readonly selectedTestReferenceChange = output<TestReference | null>({});
  
  constructor() {
    this.loadTestOptions();
  }
  
  private loadTestOptions() {
    this.testsService.getAllTestOptions().subscribe({
      next: (options) => {
        this.testReferenceOptions.set(options);
      },
      error: (error) => {
        console.warn('Failed to load test options from API, using fallback:', error);
        this.testReferenceOptions.set(MigrationUtils.getAllTestOptions());
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

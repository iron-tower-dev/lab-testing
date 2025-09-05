import { Component, output, signal } from '@angular/core';
import { TestReference, TestIdentifierUtils, MigrationUtils } from '../enter-results.types';
import { SharedModule } from '../../shared-module';

@Component({
  selector: 'app-test-type-selection',
  imports: [SharedModule],
  templateUrl: './test-type-selection.html',
  styleUrl: './test-type-selection.scss',
})
export class TestTypeSelection {
  // Signals using new type system
  readonly selectedTestReference = signal<TestReference | null>(null);
  readonly selectedTestReferenceChange = output<TestReference | null>({});
  readonly testReferenceOptions = MigrationUtils.getAllTestOptions();

  setSelectedTestReference(testReference: TestReference | null) {
    this.selectedTestReference.set(testReference);
    this.selectedTestReferenceChange.emit(testReference);
  }

  // Helper method to get display name
  getDisplayName(testReference: TestReference): string {
    return TestIdentifierUtils.getDisplayName(testReference);
  }
}

import { Component, output, signal } from '@angular/core';
import { TestReference, TestIdentifierUtils, MigrationUtils } from '../enter-results.types';
import { SharedModule } from '../../shared-module';

@Component({
  selector: 'app-test-type-list',
  imports: [SharedModule],
  templateUrl: './test-type-list.html',
  styleUrl: './test-type-list.scss'
})
export class TestTypeList {
  // Signals using new type system
  readonly selectedTestReference = signal<TestReference | null>(null);
  readonly testReferenceOptions = MigrationUtils.getAllTestOptions();
  readonly selectedTestReferenceChange = output<TestReference | null>({});

  setSelectedTestReference(testReference: TestReference | null) {
    this.selectedTestReference.set(testReference);
    this.selectedTestReferenceChange.emit(testReference);
  }

  // Helper method to get display name
  getDisplayName(testReference: TestReference): string {
    return TestIdentifierUtils.getDisplayName(testReference);
  }
}

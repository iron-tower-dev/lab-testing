import { Component, output, signal } from '@angular/core';
import { TestCode, testCodeToType } from '../enter-results.types';
import { SharedModule } from '../../shared-module';

@Component({
  selector: 'app-test-type-selection',
  imports: [SharedModule],
  templateUrl: './test-type-selection.html',
  styleUrl: './test-type-selection.scss',
})
export class TestTypeSelection {
  readonly selectedTestType = signal<TestCode | null>(null);
  readonly selectedTestTypeChange = output<TestCode | null>({});
  readonly testTypeOptions = Object.entries(testCodeToType).map(([code, label]) => ({ code: code as TestCode, label }));

  setSelectedTestType(value: TestCode | null) {
    this.selectedTestType.set(value);
    this.selectedTestTypeChange.emit(value);
  }
}

import { Component, output, signal } from '@angular/core';
import { TestCode, testCodeToType } from '../enter-results.types';
import { SharedModule } from '../../shared-module';

@Component({
  selector: 'app-test-type-list',
  imports: [SharedModule],
  templateUrl: './test-type-list.html',
  styleUrl: './test-type-list.scss'
})
export class TestTypeList {
  readonly selectedTestType = signal<TestCode | null>(null);
  readonly testTypeOptions = Object.entries(testCodeToType).map(([code, label]) => ({
    code: code as TestCode, label
  }));
  readonly selectedTestTypeChange = output<TestCode | null>({});

  setSelectedTestType(value: TestCode | null) {
    this.selectedTestType.set(value);
    this.selectedTestTypeChange.emit(value);
  }
}

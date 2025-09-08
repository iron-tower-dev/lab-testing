import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { EnterResults } from './enter-results';
import { TestReference, LEGACY_TEST_CODE_TO_REFERENCE } from './enter-results.types';
import { SampleService } from '../shared/services/sample.service';
import { TestsService } from '../shared/services/tests.service';
import { ApiService } from '../shared/services/api.service';

describe('EnterResults', () => {
  let component: EnterResults;
  let fixture: ComponentFixture<EnterResults>;
  let sampleTestReference: TestReference;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnterResults, HttpClientTestingModule, NoopAnimationsModule],
      providers: [SampleService, TestsService, ApiService]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EnterResults);
    component = fixture.componentInstance;
    sampleTestReference = LEGACY_TEST_CODE_TO_REFERENCE.TAN;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have initialTestSelected as false and selectedTestReference as null initially', () => {
    expect(component.initialTestSelected()).toBeFalse();
    expect(component.selectedTestReference()).toBeNull();
  });

  it('should set selectedTestReference and initialTestSelected to true when onTestTypeSelected is called', () => {
    component.onTestTypeSelected(sampleTestReference);
    expect(component.selectedTestReference()).toBe(sampleTestReference);
    expect(component.initialTestSelected()).toBeTrue();
  });

  it('should render test-type-list when initialTestSelected is false', () => {
    expect(component.initialTestSelected()).toBeFalse();
    fixture.detectChanges();
    const testTypeList = fixture.nativeElement.querySelector('app-test-type-list');
    expect(testTypeList).toBeTruthy();
  });

  it('should render sample-selection-panel and entry-form-area when initialTestSelected is true', () => {
    component.onTestTypeSelected(sampleTestReference);
    fixture.detectChanges();
    const samplePanel = fixture.nativeElement.querySelector('app-sample-selection-panel');
    const entryFormArea = fixture.nativeElement.querySelector('app-entry-form-area');
    expect(samplePanel).toBeTruthy();
    expect(entryFormArea).toBeTruthy();
  });

  it('should reset selectedSample when test type changes', () => {
    // Set initial test and sample
    component.onTestTypeSelected(sampleTestReference);
    component.onSampleSelected({ testReference: sampleTestReference, sampleId: 'TAN-101' });
    expect(component.selectedSample()).not.toBeNull();
    
    // Change test type - should reset sample
    const differentTestRef = LEGACY_TEST_CODE_TO_REFERENCE.KF;
    component.onTestTypeSelected(differentTestRef);
    expect(component.selectedSample()).toBeNull();
    expect(component.selectedTestReference()).toBe(differentTestRef);
  });
});

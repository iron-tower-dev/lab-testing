import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TestTypeSelection } from './test-type-selection';
import { TestReference, TestHelpers } from '../enter-results.types';

describe('TestTypeSelection', () => {
  let component: TestTypeSelection;
  let fixture: ComponentFixture<TestTypeSelection>;
  let sampleTestReference: TestReference;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestTypeSelection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TestTypeSelection);
    component = fixture.componentInstance;
    sampleTestReference = TestHelpers.createTANReference();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have selectedTestReference as null initially', () => {
    expect(component.selectedTestReference()).toBeNull();
  });

  it('should set selectedTestReference when setSelectedTestReference is called', () => {
    component.setSelectedTestReference(sampleTestReference);
    expect(component.selectedTestReference()).toBe(sampleTestReference);
  });

  it('should emit selectedTestReferenceChange when setSelectedTestReference is called', () => {
    const kfTestReference = TestHelpers.createKFReference();
    spyOn(component.selectedTestReferenceChange, 'emit');
    component.setSelectedTestReference(kfTestReference);
    expect(component.selectedTestReferenceChange.emit).toHaveBeenCalledWith(kfTestReference);
  });

  it('should have all test reference options available', () => {
    expect(component.testReferenceOptions.length).toBe(24);
  });

  it('should provide display names for test references', () => {
    expect(component.getDisplayName(sampleTestReference)).toBe('TAN by Color Indication');
  });
});

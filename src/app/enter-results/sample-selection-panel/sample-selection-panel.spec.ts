import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { SampleSelectionPanel } from './sample-selection-panel';
import { TestReference, LEGACY_TEST_CODE_TO_REFERENCE } from '../enter-results.types';

@Component({
  selector: 'host-sample-selection-panel-test',
  template: `<app-sample-selection-panel [selectedTestReference]="testReference()" />`,
  standalone: true,
  imports: [SampleSelectionPanel]
})
class HostTestComponent {
  testReference = signal<TestReference | null>(null);
}

describe('SampleSelectionPanel', () => {
  let component: SampleSelectionPanel;
  let fixture: ComponentFixture<SampleSelectionPanel>;
  let sampleTestReference: TestReference;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SampleSelectionPanel]
    }).compileComponents();
    fixture = TestBed.createComponent(SampleSelectionPanel);
    component = fixture.componentInstance;
    sampleTestReference = LEGACY_TEST_CODE_TO_REFERENCE.TAN;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have selectedTestReference as null initially', () => {
    expect(component.selectedTestReference()).toBeNull();
  });

  it('should emit selectedTestReferenceChange when setSelectedTestReference is called', () => {
    const kfTestReference = LEGACY_TEST_CODE_TO_REFERENCE.KF;
    spyOn(component.selectedTestReferenceChange, 'emit');
    component.setSelectedTestReference(kfTestReference);
    expect(component.selectedTestReferenceChange.emit).toHaveBeenCalledWith(kfTestReference);
  });

  it('should compute sampleNumbers based on selectedTestReference input from host', () => {
    const hostFixture = TestBed.createComponent(HostTestComponent);
    hostFixture.componentInstance.testReference.set(sampleTestReference);
    hostFixture.detectChanges();
    const panel = hostFixture.debugElement.children[0].componentInstance as SampleSelectionPanel;
    expect(panel.sampleNumbers()).toEqual([
      'TAN-101', 'TAN-102', 'TAN-103', 'TAN-104'
    ]);
  });

  it('should have all test reference options available', () => {
    expect(component.testReferenceOptions.length).toBe(24);
  });

  it('should emit sampleSelected with correct testReference when sample is clicked', () => {
    const testRef = LEGACY_TEST_CODE_TO_REFERENCE.TAN;
    // Use a fixture with the test reference set
    const testFixture = TestBed.createComponent(SampleSelectionPanel);
    const testComponent = testFixture.componentInstance;
    
    // Set input using the fixture's componentRef
    testFixture.componentRef.setInput('selectedTestReference', testRef);
    testFixture.detectChanges();
    
    spyOn(testComponent.sampleSelected, 'emit');
    
    testComponent.onSampleClick('TAN-101');
    
    expect(testComponent.sampleSelected.emit).toHaveBeenCalledWith({
      testReference: testRef,
      sampleId: 'TAN-101'
    });
  });

  it('should return empty array for sampleNumbers when no test is selected', () => {
    // Component starts with null selectedTestReference
    expect(component.sampleNumbers()).toEqual([]);
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { SampleSelectionPanel } from './sample-selection-panel';
import { TestCode } from '../enter-results.types';

@Component({
  selector: 'host-sample-selection-panel-test',
  template: `<app-sample-selection-panel [selectedTestCode]="testCode" />`,
  standalone: true,
  imports: [SampleSelectionPanel]
})
class HostTestComponent {
  testCode: TestCode | null = null;
}

describe('SampleSelectionPanel', () => {
  let component: SampleSelectionPanel;
  let fixture: ComponentFixture<SampleSelectionPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SampleSelectionPanel]
    }).compileComponents();
    fixture = TestBed.createComponent(SampleSelectionPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have selectedTestCode as null initially', () => {
    expect(component.selectedTestCode()).toBeNull();
  });

  it('should emit selectedTestCodeChange when setSelectedTestCode is called', () => {
    spyOn(component.selectedTestCodeChange, 'emit');
    component.setSelectedTestCode('KF');
    expect(component.selectedTestCodeChange.emit).toHaveBeenCalledWith('KF');
  });

  it('should compute sampleNumbers based on selectedTestCode input from host', () => {
    const hostFixture = TestBed.createComponent(HostTestComponent);
    hostFixture.componentInstance.testCode = 'TAN';
    hostFixture.detectChanges();
    const panel = hostFixture.debugElement.children[0].componentInstance as SampleSelectionPanel;
    expect(panel.sampleNumbers()).toEqual([
      'TAN-101', 'TAN-102', 'TAN-103', 'TAN-104'
    ]);
  });

  it('should have all test type options available', () => {
    expect(component.testTypeOptions.length).toBe(24); // Update 24 to the expected count if needed
  });
});

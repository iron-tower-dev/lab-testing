import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SampleSelectionPanel } from './sample-selection-panel';

describe('SampleSelectionPanel', () => {
  let component: SampleSelectionPanel;
  let fixture: ComponentFixture<SampleSelectionPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SampleSelectionPanel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SampleSelectionPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

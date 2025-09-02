import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FerrographyEntryForm } from './ferrography-entry-form';

describe('FerrographyEntryForm', () => {
  let component: FerrographyEntryForm;
  let fixture: ComponentFixture<FerrographyEntryForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FerrographyEntryForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FerrographyEntryForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

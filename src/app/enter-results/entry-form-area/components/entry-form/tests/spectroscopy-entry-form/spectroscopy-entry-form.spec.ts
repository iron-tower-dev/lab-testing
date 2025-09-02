import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpectroscopyEntryForm } from './spectroscopy-entry-form';

describe('SpectroscopyEntryForm', () => {
  let component: SpectroscopyEntryForm;
  let fixture: ComponentFixture<SpectroscopyEntryForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpectroscopyEntryForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SpectroscopyEntryForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

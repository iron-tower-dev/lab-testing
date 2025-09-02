import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EntryFormHeader } from './entry-form-header';

describe('EntryFormHeader', () => {
  let component: EntryFormHeader;
  let fixture: ComponentFixture<EntryFormHeader>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntryFormHeader]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EntryFormHeader);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

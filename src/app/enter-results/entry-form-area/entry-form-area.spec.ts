import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EntryFormArea } from './entry-form-area';

describe('EntryFormArea', () => {
  let component: EntryFormArea;
  let fixture: ComponentFixture<EntryFormArea>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntryFormArea]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EntryFormArea);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnterResults } from './enter-results';

describe('EnterResults', () => {
  let component: EnterResults;
  let fixture: ComponentFixture<EnterResults>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnterResults]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EnterResults);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

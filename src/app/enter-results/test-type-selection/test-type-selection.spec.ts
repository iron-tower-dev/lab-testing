import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestTypeSelection } from './test-type-selection';

describe('TestTypeSelection', () => {
  let component: TestTypeSelection;
  let fixture: ComponentFixture<TestTypeSelection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestTypeSelection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TestTypeSelection);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

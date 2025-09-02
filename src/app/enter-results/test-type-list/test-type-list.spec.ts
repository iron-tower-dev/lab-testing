import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestTypeList } from './test-type-list';

describe('TestTypeList', () => {
  let component: TestTypeList;
  let fixture: ComponentFixture<TestTypeList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestTypeList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TestTypeList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

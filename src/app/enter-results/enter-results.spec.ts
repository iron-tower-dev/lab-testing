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

  it('should have initialTestSelected as false and selectedTestCode as null initially', () => {
    expect(component.initialTestSelected).toBeFalse();
    expect(component.selectedTestCode).toBeNull();
  });

  it('should set selectedTestCode and initialTestSelected to true when onTestTypeSelected is called', () => {
    component.onTestTypeSelected('TAN');
    expect(component.selectedTestCode).toBe('TAN');
    expect(component.initialTestSelected).toBeTrue();
  });

  it('should render test-type-list when initialTestSelected is false', () => {
    component.initialTestSelected = false;
    fixture.detectChanges();
    const testTypeList = fixture.nativeElement.querySelector('app-test-type-list');
    expect(testTypeList).toBeTruthy();
  });

  it('should render sample-selection-panel and entry-form-area when initialTestSelected is true', () => {
    component.initialTestSelected = true;
    component.selectedTestCode = 'TAN';
    fixture.detectChanges();
    const samplePanel = fixture.nativeElement.querySelector('app-sample-selection-panel');
    const entryFormArea = fixture.nativeElement.querySelector('app-entry-form-area');
    expect(samplePanel).toBeTruthy();
    expect(entryFormArea).toBeTruthy();
  });
});

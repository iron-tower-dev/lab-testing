import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TestTypeList } from './test-type-list';

describe('TestTypeList', () => {
  let component: TestTypeList;
  let fixture: ComponentFixture<TestTypeList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestTypeList]
    }).compileComponents();
    fixture = TestBed.createComponent(TestTypeList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have selectedTestType as null initially', () => {
    expect(component.selectedTestType()).toBeNull();
  });

  it('should set selectedTestType when setSelectedTestType is called', () => {
    component.setSelectedTestType('TAN');
    expect(component.selectedTestType()).toBe('TAN');
  });

  it('should emit selectedTestTypeChange when setSelectedTestType is called', () => {
    spyOn(component.selectedTestTypeChange, 'emit');
    component.setSelectedTestType('KF');
    expect(component.selectedTestTypeChange.emit).toHaveBeenCalledWith('KF');
  });

  it('should have all test type options available', () => {
    expect(component.testTypeOptions.length).toBe(24); // Update 24 to the expected count if needed
  });
});

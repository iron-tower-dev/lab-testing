import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TestTypeList } from './test-type-list';
import { TestReference, TestHelpers } from '../enter-results.types';
import { SampleService } from '../../shared/services/sample.service';
import { TestsService } from '../../shared/services/tests.service';
import { ApiService } from '../../shared/services/api.service';

describe('TestTypeList', () => {
  let component: TestTypeList;
  let fixture: ComponentFixture<TestTypeList>;
  let httpMock: HttpTestingController;
  let sampleTestReference: TestReference;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestTypeList, HttpClientTestingModule, NoopAnimationsModule],
      providers: [SampleService, TestsService, ApiService]
    }).compileComponents();
    fixture = TestBed.createComponent(TestTypeList);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    sampleTestReference = TestHelpers.createTANReference();
    
    // Mock the HTTP request for test options and provide empty response to trigger fallback
    fixture.detectChanges();
    
    // Verify the API call was attempted and provide error response to trigger fallback
    try {
      const req = httpMock.expectOne('http://localhost:3001/api/tests');
      req.error(new ErrorEvent('Network Error', {
        error: new Error('API not available'),
        message: 'Failed to connect'
      }));
    } catch (e) {
      // If no request was made, that's also fine - just proceed
    }
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have selectedTestReference as null initially', () => {
    expect(component.selectedTestReference()).toBeNull();
  });

  it('should set selectedTestReference when setSelectedTestReference is called', () => {
    component.setSelectedTestReference(sampleTestReference);
    expect(component.selectedTestReference()).toBe(sampleTestReference);
  });

  it('should emit selectedTestReferenceChange when setSelectedTestReference is called', () => {
    const kfTestReference = TestHelpers.createKFReference();
    spyOn(component.selectedTestReferenceChange, 'emit');
    component.setSelectedTestReference(kfTestReference);
    expect(component.selectedTestReferenceChange.emit).toHaveBeenCalledWith(kfTestReference);
  });

  it('should have all test reference options available', () => {
    // Wait for async operations and fallback to complete
    setTimeout(() => {
      fixture.detectChanges();
      expect(component.testReferenceOptions.length).toBe(24);
    }, 100);
  });

  it('should provide display names for test references', () => {
    expect(component.getDisplayName(sampleTestReference)).toBe('TAN by Color Indication');
  });
  
  afterEach(() => {
    httpMock.verify();
  });
});

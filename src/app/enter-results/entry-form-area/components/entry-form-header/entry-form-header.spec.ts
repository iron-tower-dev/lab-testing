import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { EntryFormHeader } from './entry-form-header';
import { SampleService } from '../../../../shared/services/sample.service';
import { TestsService } from '../../../../shared/services/tests.service';
import { ApiService } from '../../../../shared/services/api.service';

describe('EntryFormHeader', () => {
  let component: EntryFormHeader;
  let fixture: ComponentFixture<EntryFormHeader>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntryFormHeader, HttpClientTestingModule, NoopAnimationsModule],
      providers: [SampleService, TestsService, ApiService]
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

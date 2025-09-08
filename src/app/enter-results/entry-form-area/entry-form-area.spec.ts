import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { EntryFormArea } from './entry-form-area';
import { SampleService } from '../../shared/services/sample.service';
import { TestsService } from '../../shared/services/tests.service';
import { ApiService } from '../../shared/services/api.service';

describe('EntryFormArea', () => {
  let component: EntryFormArea;
  let fixture: ComponentFixture<EntryFormArea>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntryFormArea, HttpClientTestingModule, NoopAnimationsModule],
      providers: [SampleService, TestsService, ApiService]
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

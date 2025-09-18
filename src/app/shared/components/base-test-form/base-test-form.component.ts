import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject } from '@angular/core';
import { FormBuilder, FormGroup, AbstractControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { DatePipe } from '@angular/common';
import { TestReadingsService, TestReading, TestReadingCreate } from '../../services/test-readings.service';
import { SampleService, Sample } from '../../services/sample.service';
import { TestTypesService, TestType } from '../../services/test-types.service';
import { SharedModule } from '../../../shared-module';
import { SampleWithTestInfo } from '../../../enter-results/enter-results.types';

export interface ValidationResult {
  isValid: boolean;
  result?: number;
  error?: string;
}

export interface FormFieldConfig {
  name: string;
  label: string;
  type: 'number' | 'text' | 'select';
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  options?: { value: any; label: string }[];
  validators?: any[];
}

@Component({
  selector: 'app-base-test-form',
  template: `
    <div class="test-form-container">
      <!-- Sample Information Header -->
      @if (sample) {
        <mat-card class="sample-info-card">
          <mat-card-header>
            <mat-card-title>Sample: {{ sample.sampleNumber }}</mat-card-title>
            @if (sample.description) {
              <mat-card-subtitle>{{ sample.description }}</mat-card-subtitle>
            }
          </mat-card-header>
          <mat-card-content>
            <div class="sample-details">
              @if (sample.customerName) {
                <span><strong>Customer:</strong> {{ sample.customerName }}</span>
              }
              @if (sample.dateReceived) {
                <span><strong>Received:</strong> {{ sample.dateReceived | date }}</span>
              }
            </div>
          </mat-card-content>
        </mat-card>
      }

      <!-- Test Type Header -->
      @if (testType) {
        <mat-card class="test-info-card">
          <mat-card-header>
            <mat-card-title>{{ testType.testName }} ({{ testType.testCode }})</mat-card-title>
            @if (testType.description) {
              <mat-card-subtitle>{{ testType.description }}</mat-card-subtitle>
            }
          </mat-card-header>
        </mat-card>
      }

      <!-- Form Content (to be overridden by child components) -->
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="test-form">
        <mat-card class="form-card">
          <mat-card-header>
            <mat-card-title>Test Data Entry</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <ng-content></ng-content>
          </mat-card-content>
        </mat-card>

        <!-- Calculation Results -->
        @if (calculationResult) {
          <mat-card class="results-card">
            <mat-card-header>
              <mat-card-title>Results</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="result-display" [class.error]="!calculationResult.isValid">
                <mat-form-field appearance="outline" class="result-field">
                  <mat-label>Calculated Result</mat-label>
                  <input 
                    matInput 
                    [value]="calculationResult.result || ''" 
                    readonly 
                    [class.error-input]="!calculationResult.isValid">
                </mat-form-field>
                @if (calculationResult.error) {
                  <mat-error class="calculation-error">
                    {{ calculationResult.error }}
                  </mat-error>
                }
              </div>
            </mat-card-content>
          </mat-card>
        }

        <!-- Comments -->
        <mat-card class="comments-card">
          <mat-card-header>
            <mat-card-title>Comments</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Test Comments (Optional)</mat-label>
              <textarea 
                matInput 
                formControlName="mainComments" 
                rows="3"
                placeholder="Enter any additional comments about this test...">
              </textarea>
            </mat-form-field>
          </mat-card-content>
        </mat-card>

        <!-- Action Buttons -->
        <mat-card class="actions-card">
          <mat-card-actions align="end">
            <button 
              mat-button 
              type="button" 
              (click)="onCancel()"
              [disabled]="isLoading">
              Cancel
            </button>
            <button 
              mat-button 
              type="button" 
              (click)="onSave(false)"
              [disabled]="!form.valid || isLoading"
              color="accent">
              Save Draft
            </button>
            <button 
              mat-raised-button 
              type="submit"
              [disabled]="!form.valid || !calculationResult?.isValid || isLoading"
              color="primary">
              @if (isLoading) {
                <mat-icon>hourglass_empty</mat-icon>
              }
              Complete Test
            </button>
          </mat-card-actions>
        </mat-card>
      </form>

      <!-- Loading Overlay -->
      @if (isLoading) {
        <div class="loading-overlay">
          <mat-spinner diameter="50"></mat-spinner>
          <p>{{ loadingMessage }}</p>
        </div>
      }
    </div>
  `,
  standalone: true,
  imports: [
    SharedModule,
    DatePipe
  ]
})
export class BaseTestFormComponent implements OnInit, OnDestroy {
  @Input() sample?: Sample;
  @Input() testType?: TestType;
  @Input() sampleData?: SampleWithTestInfo | null;
  @Input() existingReading?: TestReading;
  @Input() trialNumber: number = 1;

  @Output() formSaved = new EventEmitter<TestReading>();
  @Output() formCancelled = new EventEmitter<void>();
  @Output() formCompleted = new EventEmitter<TestReading>();

  protected readonly fb = inject(FormBuilder);
  protected readonly testReadingsService = inject(TestReadingsService);
  protected readonly sampleService = inject(SampleService);
  protected readonly testTypesService = inject(TestTypesService);

  protected readonly destroy$ = new Subject<void>();

  form!: FormGroup;
  calculationResult?: ValidationResult;
  isLoading = false;
  loadingMessage = '';

  ngOnInit(): void {
    this.processSampleData();
    this.initializeForm();
    this.setupCalculationWatchers();
    this.loadExistingData();
  }

  private processSampleData(): void {
    // If sampleData is provided, use it to set sample and testType only if not already provided
    if (this.sampleData) {
      // Only set sample if not already provided
      if (!this.sample) {
        this.sample = {
          sampleId: this.sampleData.sampleId,
          sampleNumber: this.sampleData.sampleNumber,
          description: this.sampleData.description || this.sampleData.testName,
          customerName: this.sampleData.customerName || this.sampleData.component || this.sampleData.location || undefined,
          dateReceived: this.sampleData.dateReceived || undefined
        };
      }
      
      // Only set testType if not already provided
      if (!this.testType) {
        this.testType = {
          testId: this.sampleData.testReference?.id,
          testName: this.sampleData.testReference?.name || 'Unknown Test',
          testCode: this.sampleData.testReference?.abbrev || 'UNK',
          description: this.sampleData.description || this.sampleData.testName,
          isActive: true
        };
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected initializeForm(): void {
    this.form = this.fb.group({
      mainComments: ['']
    });
  }

  protected setupCalculationWatchers(): void {
    // Override in child components to watch specific fields
    this.form.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.performCalculation();
    });
  }

  protected performCalculation(): void {
    if (!this.testType || !this.form.valid) {
      this.calculationResult = undefined;
      return;
    }

    const values = this.extractCalculationValues();
    this.calculationResult = this.testReadingsService.validateCalculation(
      this.testType.testId,
      values
    );
  }

  protected extractCalculationValues(): Record<string, number> {
    // Override in child components to extract relevant form values
    return {};
  }

  protected loadExistingData(): void {
    if (this.existingReading) {
      this.form.patchValue({
        mainComments: this.existingReading.mainComments
      });
    }
  }

  protected createTestReading(isComplete: boolean = false): TestReadingCreate {
    if (!this.sample || !this.testType) {
      throw new Error('Sample and test type are required');
    }

    return {
      sampleId: this.sample.sampleId,
      testId: this.testType.testId,
      trialNumber: this.trialNumber,
      trialComplete: isComplete,
      status: isComplete ? 'S' : 'P', // S = Submitted, P = Pending
      mainComments: this.form.get('mainComments')?.value || null,
      trialCalc: this.calculationResult?.result || null
    };
  }

  onSave(complete: boolean = false): void {
    if (!this.form.valid || (complete && !this.calculationResult?.isValid)) {
      return;
    }

    this.isLoading = true;
    this.loadingMessage = complete ? 'Completing test...' : 'Saving draft...';

    const reading = this.createTestReading(complete);
    
    const saveOperation = this.existingReading
      ? this.testReadingsService.updateTestReading(
          reading.sampleId,
          reading.testId,
          reading.trialNumber,
          reading
        )
      : this.testReadingsService.createTestReading(reading);

    saveOperation.pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (complete) {
          this.formCompleted.emit(response.data);
        } else {
          this.formSaved.emit(response.data);
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error saving test reading:', error);
        // TODO: Show error snackbar
      }
    });
  }

  onSubmit(): void {
    this.onSave(true);
  }

  onCancel(): void {
    this.formCancelled.emit();
  }

  // Utility methods for child components
  protected addFormField(name: string, config: FormFieldConfig): void {
    const validators = [];
    
    if (config.required) {
      validators.push(Validators.required);
    }
    
    if (config.type === 'number') {
      if (config.min !== undefined) {
        validators.push(Validators.min(config.min));
      }
      if (config.max !== undefined) {
        validators.push(Validators.max(config.max));
      }
    }

    this.form.addControl(name, this.fb.control('', validators));
  }

  protected getFieldError(fieldName: string): string | null {
    const control = this.form.get(fieldName);
    if (!control || !control.errors || !control.touched) {
      return null;
    }

    if (control.errors['required']) {
      return 'This field is required';
    }
    if (control.errors['min']) {
      return `Value must be at least ${control.errors['min'].min}`;
    }
    if (control.errors['max']) {
      return `Value must be at most ${control.errors['max'].max}`;
    }

    return 'Invalid value';
  }
}

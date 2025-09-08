import { Component, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { BaseTestFormComponent } from '../../../../../shared/components/base-test-form/base-test-form.component';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-tan-entry-form',
  template: `
    <div class="tan-form-content">
      <div class="form-row">
        <mat-form-field appearance="outline" class="half-width">
          <mat-label>Sample Weight (g)</mat-label>
          <input 
            matInput 
            type="number" 
            formControlName="sampleWeight"
            step="0.01"
            min="0.01"
            max="10.00"
            placeholder="Enter sample weight">
          <mat-hint>Weight should be between 0.01g and 10.00g</mat-hint>
          <mat-error *ngIf="getFieldError('sampleWeight')">
            {{ getFieldError('sampleWeight') }}
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="half-width">
          <mat-label>Initial Buret Reading (mL)</mat-label>
          <input 
            matInput 
            type="number" 
            formControlName="initialBuret"
            step="0.01"
            min="0"
            max="50"
            placeholder="Initial buret reading">
          <mat-hint>Starting buret reading (typically 0)</mat-hint>
          <mat-error *ngIf="getFieldError('initialBuret')">
            {{ getFieldError('initialBuret') }}
          </mat-error>
        </mat-form-field>
      </div>

      <div class="form-row">
        <mat-form-field appearance="outline" class="half-width">
          <mat-label>Final Buret Reading (mL)</mat-label>
          <input 
            matInput 
            type="number" 
            formControlName="finalBuret"
            step="0.01"
            min="0"
            max="50"
            placeholder="Final buret reading">
          <mat-hint>Buret reading after titration</mat-hint>
          <mat-error *ngIf="getFieldError('finalBuret')">
            {{ getFieldError('finalBuret') }}
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="half-width">
          <mat-label>Net Buret Volume (mL)</mat-label>
          <input 
            matInput 
            type="number" 
            [value]="netBuretVolume" 
            readonly
            class="calculated-field">
          <mat-hint>Automatically calculated: Final - Initial</mat-hint>
        </mat-form-field>
      </div>

      <div class="form-row">
        <mat-form-field appearance="outline" class="third-width">
          <mat-label>KOH Normality</mat-label>
          <input 
            matInput 
            type="number" 
            formControlName="kohNormality"
            step="0.0001"
            min="0.0001"
            max="1.0000"
            placeholder="KOH normality">
          <mat-hint>Typically around 0.1000 N</mat-hint>
          <mat-error *ngIf="getFieldError('kohNormality')">
            {{ getFieldError('kohNormality') }}
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="third-width">
          <mat-label>Temperature (°C)</mat-label>
          <input 
            matInput 
            type="number" 
            formControlName="temperature"
            step="0.1"
            min="15"
            max="35"
            placeholder="Lab temperature">
          <mat-hint>Room temperature during test</mat-hint>
          <mat-error *ngIf="getFieldError('temperature')">
            {{ getFieldError('temperature') }}
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="third-width">
          <mat-label>Analyst Initials</mat-label>
          <input 
            matInput 
            formControlName="analystInitials"
            maxlength="5"
            placeholder="Analyst initials">
          <mat-error *ngIf="getFieldError('analystInitials')">
            {{ getFieldError('analystInitials') }}
          </mat-error>
        </mat-form-field>
      </div>

      <!-- Color Indication Section -->
      <div class="color-section">
        <h3>Color Indication</h3>
        <div class="form-row">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Color Observed</mat-label>
            <input 
              matInput 
              formControlName="colorObserved"
              placeholder="Describe the color change observed at endpoint">
            <mat-hint>e.g., "Light pink to dark green", "Colorless to light pink"</mat-hint>
          </mat-form-field>
        </div>
      </div>

      <!-- Calculation Display -->
      <div class="calculation-display" *ngIf="showCalculationDetails">
        <h3>Calculation Details</h3>
        <div class="calc-formula">
          <strong>Formula:</strong> TAN = (Net Buret Volume × KOH Normality × 56.1) / Sample Weight
        </div>
        <div class="calc-values" *ngIf="form.valid">
          <p><strong>Net Volume:</strong> {{ netBuretVolume }} mL</p>
          <p><strong>KOH Normality:</strong> {{ form.get('kohNormality')?.value }} N</p>
          <p><strong>Sample Weight:</strong> {{ form.get('sampleWeight')?.value }} g</p>
          <p class="calc-result"><strong>TAN Result:</strong> {{ calculationResult?.result }} mg KOH/g</p>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./tan-entry-form.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ]
})
export class TanEntryFormComponent extends BaseTestFormComponent implements OnInit {
  netBuretVolume = 0;
  showCalculationDetails = true;

  override ngOnInit(): void {
    super.ngOnInit();
  }

  protected override initializeForm(): void {
    this.form = this.fb.group({
      sampleWeight: ['', [Validators.required, Validators.min(0.01), Validators.max(10.00)]],
      initialBuret: ['', [Validators.required, Validators.min(0), Validators.max(50)]],
      finalBuret: ['', [Validators.required, Validators.min(0), Validators.max(50)]],
      kohNormality: ['', [Validators.required, Validators.min(0.0001), Validators.max(1.0000)]],
      temperature: ['', [Validators.min(15), Validators.max(35)]],
      analystInitials: ['', [Validators.required, Validators.maxLength(5)]],
      colorObserved: [''],
      mainComments: ['']
    });
  }

  protected override setupCalculationWatchers(): void {
    // Watch for changes in buret readings to calculate net volume
    this.form.valueChanges.subscribe(() => {
      this.calculateNetBuretVolume();
      this.performCalculation();
    });
  }

  private calculateNetBuretVolume(): void {
    const initialBuret = this.form.get('initialBuret')?.value || 0;
    const finalBuret = this.form.get('finalBuret')?.value || 0;
    
    this.netBuretVolume = Math.round((finalBuret - initialBuret) * 100) / 100;
  }

  protected override extractCalculationValues(): Record<string, number> {
    return {
      sampleWeight: this.form.get('sampleWeight')?.value || 0,
      finalBuret: this.netBuretVolume,
      kohNormality: this.form.get('kohNormality')?.value || 0
    };
  }

  protected override loadExistingData(): void {
    super.loadExistingData();
    
    if (this.existingReading) {
      this.form.patchValue({
        sampleWeight: this.existingReading.value1,
        initialBuret: this.existingReading.value2,
        finalBuret: this.existingReading.value3,
        kohNormality: this.existingReading.id1,
        temperature: this.existingReading.id2,
        analystInitials: this.existingReading.id3,
        colorObserved: this.existingReading.mainComments
      });
    } else {
      // Set default values
      this.form.patchValue({
        initialBuret: 0,
        kohNormality: 0.1000,
        temperature: 22,
        analystInitials: localStorage.getItem('analystInitials') || ''
      });
    }
  }

  protected override createTestReading(isComplete: boolean = false) {
    const baseReading = super.createTestReading(isComplete);
    
    return {
      ...baseReading,
      value1: this.form.get('sampleWeight')?.value,
      value2: this.form.get('initialBuret')?.value,
      value3: this.form.get('finalBuret')?.value,
      id1: this.form.get('kohNormality')?.value?.toString(),
      id2: this.form.get('temperature')?.value?.toString(),
      id3: this.form.get('analystInitials')?.value,
      mainComments: this.form.get('colorObserved')?.value || this.form.get('mainComments')?.value
    };
  }

  // Custom validation method for TAN-specific rules
  private validateTanData(): string | null {
    const sampleWeight = this.form.get('sampleWeight')?.value;
    const netVolume = this.netBuretVolume;
    const kohNormality = this.form.get('kohNormality')?.value;

    if (!sampleWeight || sampleWeight <= 0) {
      return 'Sample weight must be greater than 0';
    }

    if (netVolume < 0) {
      return 'Final buret reading must be greater than initial reading';
    }

    if (netVolume > 40) {
      return 'Net buret volume seems unusually high. Please verify readings.';
    }

    if (!kohNormality || kohNormality <= 0) {
      return 'KOH normality must be greater than 0';
    }

    const calculatedTan = (netVolume * kohNormality * 56.1) / sampleWeight;
    if (calculatedTan > 10) {
      return 'Calculated TAN value seems unusually high. Please verify data.';
    }

    return null;
  }

  override onSave(complete: boolean = false): void {
    const validationError = this.validateTanData();
    if (validationError) {
      console.error('TAN validation error:', validationError);
      return;
    }

    // Save analyst initials for future use
    const initials = this.form.get('analystInitials')?.value;
    if (initials) {
      localStorage.setItem('analystInitials', initials);
    }

    super.onSave(complete);
  }
}

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
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-flash-point-entry-form',
  template: `
    <form [formGroup]="form" class="flash-point-form-content">
      <!-- Test Conditions Section -->
      <div class="conditions-section">
        <h3>Test Conditions</h3>
        <div class="form-row">
          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Barometric Pressure (mmHg)</mat-label>
            <input 
              matInput 
              type="number" 
              formControlName="pressure"
              step="0.1"
              min="700"
              max="800"
              placeholder="Enter barometric pressure">
            <mat-hint>Standard atmosphere is 760 mmHg</mat-hint>
            <mat-error *ngIf="getFieldError('pressure')">
              {{ getFieldError('pressure') }}
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Test Method</mat-label>
            <mat-select formControlName="testMethod">
              <mat-option value="ASTM-D92">ASTM D92 - Cleveland Open Cup</mat-option>
              <mat-option value="ASTM-D93">ASTM D93 - Pensky-Martens</mat-option>
              <mat-option value="ASTM-D3828">ASTM D3828 - Tag Open Cup</mat-option>
            </mat-select>
            <mat-error *ngIf="getFieldError('testMethod')">
              {{ getFieldError('testMethod') }}
            </mat-error>
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline" class="third-width">
            <mat-label>Lab Temperature (°C)</mat-label>
            <input 
              matInput 
              type="number" 
              formControlName="labTemperature"
              step="0.1"
              min="15"
              max="35"
              placeholder="Room temperature">
            <mat-hint>Ambient lab temperature</mat-hint>
          </mat-form-field>

          <mat-form-field appearance="outline" class="third-width">
            <mat-label>Sample Volume (mL)</mat-label>
            <input 
              matInput 
              type="number" 
              formControlName="sampleVolume"
              step="1"
              min="50"
              max="100"
              placeholder="Sample volume">
            <mat-hint>Typically 75-80 mL</mat-hint>
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
      </div>

      <!-- Flash Point Readings Section -->
      <div class="readings-section">
        <h3>Flash Point Readings</h3>
        <div class="form-row">
          <mat-form-field appearance="outline" class="third-width">
            <mat-label>Trial 1 Temperature (°C)</mat-label>
            <input 
              matInput 
              type="number" 
              formControlName="trial1Temp"
              step="1"
              min="0"
              max="400"
              placeholder="First reading">
            <mat-error *ngIf="getFieldError('trial1Temp')">
              {{ getFieldError('trial1Temp') }}
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="third-width">
            <mat-label>Trial 2 Temperature (°C)</mat-label>
            <input 
              matInput 
              type="number" 
              formControlName="trial2Temp"
              step="1"
              min="0"
              max="400"
              placeholder="Second reading">
            <mat-error *ngIf="getFieldError('trial2Temp')">
              {{ getFieldError('trial2Temp') }}
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="third-width">
            <mat-label>Trial 3 Temperature (°C)</mat-label>
            <input 
              matInput 
              type="number" 
              formControlName="trial3Temp"
              step="1"
              min="0"
              max="400"
              placeholder="Third reading (optional)">
          </mat-form-field>
        </div>

        <div class="form-row" *ngIf="averageTemperature > 0">
          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Average Temperature (°C)</mat-label>
            <input 
              matInput 
              type="number" 
              [value]="averageTemperature" 
              readonly
              class="calculated-field">
            <mat-hint>Average of valid trial temperatures</mat-hint>
          </mat-form-field>

          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Pressure Correction (°C)</mat-label>
            <input 
              matInput 
              type="number" 
              [value]="pressureCorrection" 
              readonly
              class="calculated-field">
            <mat-hint>Correction = 0.06 × (760 - Pressure)</mat-hint>
          </mat-form-field>
        </div>
      </div>

      <!-- Observations Section -->
      <div class="observations-section">
        <h3>Test Observations</h3>
        <div class="form-row">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Flash Observation</mat-label>
            <textarea 
              matInput 
              formControlName="flashObservation"
              rows="2"
              placeholder="Describe the flash behavior observed...">
            </textarea>
            <mat-hint>e.g., "Clear, distinct flash observed", "Faint flash detected"</mat-hint>
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Test Notes</mat-label>
            <textarea 
              matInput 
              formControlName="testNotes"
              rows="2"
              placeholder="Any additional observations or notes...">
            </textarea>
          </mat-form-field>
        </div>
      </div>

      <!-- Calculation Display -->
      <div class="calculation-display" *ngIf="showCalculationDetails && averageTemperature > 0">
        <h3>Calculation Details</h3>
        <div class="calc-formula">
          <strong>Formula:</strong> Corrected Flash Point = Average Temperature + Pressure Correction<br>
          <strong>Where:</strong> Pressure Correction = 0.06 × (760 - Barometric Pressure)
        </div>
        <div class="calc-values">
          <p><strong>Average Temperature:</strong> {{ averageTemperature }}°C</p>
          <p><strong>Barometric Pressure:</strong> {{ form.get('pressure')?.value }} mmHg</p>
          <p><strong>Pressure Correction:</strong> {{ pressureCorrection }}°C</p>
          <p class="calc-result">
            <strong>Corrected Flash Point:</strong> {{ calculationResult?.result }}°C
            <span class="rounded-note" *ngIf="calculationResult?.result !== averageTemperature + pressureCorrection">
              (Rounded to nearest even integer)
            </span>
          </p>
        </div>
      </div>

      <!-- Quality Control Section -->
      <div class="qc-section" *ngIf="showQualityControlChecks()">
        <h3>Quality Control</h3>
        <div class="qc-warnings">
          <div class="qc-warning" *ngIf="hasLargePressureDeviation()">
            <mat-icon>warning</mat-icon>
            <span>Large pressure deviation from standard atmosphere. Verify pressure reading.</span>
          </div>
          <div class="qc-warning" *ngIf="hasHighTemperatureVariation()">
            <mat-icon>warning</mat-icon>
            <span>High variation between trial temperatures. Consider additional trials.</span>
          </div>
          <div class="qc-warning" *ngIf="hasUnusualFlashPoint()">
            <mat-icon>warning</mat-icon>
            <span>Flash point value is outside typical range. Verify test procedure.</span>
          </div>
        </div>
      </div>
    </form>
  `,
  styleUrls: ['./flash-point-entry-form.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule
  ]
})
export class FlashPointEntryFormComponent extends BaseTestFormComponent implements OnInit {
  averageTemperature = 0;
  pressureCorrection = 0;
  showCalculationDetails = true;

  override ngOnInit(): void {
    super.ngOnInit();
  }

  protected override initializeForm(): void {
    this.form = this.fb.group({
      pressure: ['', [Validators.required, Validators.min(700), Validators.max(800)]],
      testMethod: ['', Validators.required],
      labTemperature: ['', [Validators.min(15), Validators.max(35)]],
      sampleVolume: ['', [Validators.min(50), Validators.max(100)]],
      analystInitials: ['', [Validators.required, Validators.maxLength(5)]],
      trial1Temp: ['', [Validators.required, Validators.min(0), Validators.max(400)]],
      trial2Temp: ['', [Validators.required, Validators.min(0), Validators.max(400)]],
      trial3Temp: ['', [Validators.min(0), Validators.max(400)]],
      flashObservation: [''],
      testNotes: [''],
      mainComments: ['']
    });
  }

  protected override setupCalculationWatchers(): void {
    this.form.valueChanges.subscribe(() => {
      this.calculateAverageTemperature();
      this.calculatePressureCorrection();
      this.performCalculation();
    });
  }

  private calculateAverageTemperature(): void {
    const trial1 = this.form.get('trial1Temp')?.value;
    const trial2 = this.form.get('trial2Temp')?.value;
    const trial3 = this.form.get('trial3Temp')?.value;

    const validTemps = [trial1, trial2, trial3].filter(temp => 
      temp !== null && temp !== undefined && temp !== ''
    );

    if (validTemps.length >= 2) {
      const sum = validTemps.reduce((acc, temp) => acc + parseFloat(temp), 0);
      this.averageTemperature = Math.round((sum / validTemps.length) * 10) / 10;
    } else {
      this.averageTemperature = 0;
    }
  }

  private calculatePressureCorrection(): void {
    const pressure = this.form.get('pressure')?.value;
    if (pressure) {
      this.pressureCorrection = Math.round((0.06 * (760 - pressure)) * 10) / 10;
    } else {
      this.pressureCorrection = 0;
    }
  }

  protected override extractCalculationValues(): Record<string, number> {
    return {
      pressure: this.form.get('pressure')?.value || 760,
      temperature: this.averageTemperature
    };
  }

  protected override loadExistingData(): void {
    super.loadExistingData();
    
    if (this.existingReading) {
      this.form.patchValue({
        pressure: this.existingReading.value1,
        trial1Temp: this.existingReading.value2,
        trial2Temp: this.existingReading.value3,
        trial3Temp: this.existingReading.trialCalc,
        testMethod: this.existingReading.id1,
        labTemperature: this.existingReading.id2,
        analystInitials: this.existingReading.id3,
        flashObservation: this.extractFromComments('flash'),
        testNotes: this.extractFromComments('notes')
      });
    } else {
      // Set default values
      this.form.patchValue({
        pressure: 760,
        testMethod: 'ASTM-D92',
        labTemperature: 22,
        sampleVolume: 75,
        analystInitials: localStorage.getItem('analystInitials') || ''
      });
    }
  }

  protected override createTestReading(isComplete: boolean = false) {
    const baseReading = super.createTestReading(isComplete);
    
    return {
      ...baseReading,
      value1: this.form.get('pressure')?.value,
      value2: this.form.get('trial1Temp')?.value,
      value3: this.form.get('trial2Temp')?.value,
      trialCalc: this.form.get('trial3Temp')?.value || null,
      id1: this.form.get('testMethod')?.value,
      id2: this.form.get('labTemperature')?.value?.toString(),
      id3: this.form.get('analystInitials')?.value,
      mainComments: this.combineComments()
    };
  }

  private extractFromComments(section: string): string {
    if (!this.existingReading?.mainComments) return '';
    
    const regex = new RegExp(`${section}:(.+?)(?:\\||$)`, 'i');
    const match = this.existingReading.mainComments.match(regex);
    return match ? match[1].trim() : '';
  }

  private combineComments(): string {
    const flash = this.form.get('flashObservation')?.value;
    const notes = this.form.get('testNotes')?.value;
    const main = this.form.get('mainComments')?.value;
    
    const parts = [];
    if (flash) parts.push(`Flash: ${flash}`);
    if (notes) parts.push(`Notes: ${notes}`);
    if (main) parts.push(`Comments: ${main}`);
    
    return parts.join(' | ');
  }

  // Quality control methods
  showQualityControlChecks(): boolean {
    return this.hasLargePressureDeviation() || 
           this.hasHighTemperatureVariation() || 
           this.hasUnusualFlashPoint();
  }

  hasLargePressureDeviation(): boolean {
    const pressure = this.form.get('pressure')?.value;
    return pressure && Math.abs(pressure - 760) > 50;
  }

  hasHighTemperatureVariation(): boolean {
    const trial1 = this.form.get('trial1Temp')?.value;
    const trial2 = this.form.get('trial2Temp')?.value;
    
    if (!trial1 || !trial2) return false;
    
    return Math.abs(trial1 - trial2) > 5;
  }

  hasUnusualFlashPoint(): boolean {
    const result = this.calculationResult?.result;
    return !!(result && (result < 30 || result > 350));
  }

  override onSave(complete: boolean = false): void {
    // Save analyst initials for future use
    const initials = this.form.get('analystInitials')?.value;
    if (initials) {
      localStorage.setItem('analystInitials', initials);
    }

    super.onSave(complete);
  }
}

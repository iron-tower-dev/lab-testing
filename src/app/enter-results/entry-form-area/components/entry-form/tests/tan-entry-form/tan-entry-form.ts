import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SharedModule } from '../../../../../../shared-module';

@Component({
  selector: 'app-tan-entry-form',
  template: `
    <form [formGroup]="form" class="tan-form-content">
      <!-- Sample Preparation Section -->
      <div class="sample-section">
        <h3>Sample Preparation</h3>
        <div class="form-row">
          <mat-form-field class="half-width">
            <mat-label>Sample Weight</mat-label>
            <input matInput type="number" formControlName="sampleWeight"
                   step="0.01" min="0.01" max="10.00" placeholder="Weight (g)">
            <mat-hint>Weight should be between 0.01g and 10.00g</mat-hint>
            @if (form.get('sampleWeight')?.hasError('required')) {
              <mat-error>Sample weight is required</mat-error>
            }
            @if (form.get('sampleWeight')?.hasError('min') || form.get('sampleWeight')?.hasError('max')) {
              <mat-error>Weight must be between 0.01-10.00g</mat-error>
            }
          </mat-form-field>

          <mat-form-field class="half-width">
            <mat-label>Test Method</mat-label>
            <mat-select formControlName="testMethod">
              <mat-option value="ASTM-D664">ASTM D664 - Potentiometric</mat-option>
              <mat-option value="ASTM-D974">ASTM D974 - Color Indicator</mat-option>
              <mat-option value="IP-139">IP 139 - Color Indicator</mat-option>
              <mat-option value="ISO-6618">ISO 6618 - Potentiometric</mat-option>
            </mat-select>
            <mat-hint>Standard test method</mat-hint>
          </mat-form-field>
        </div>
      </div>

      <!-- Titration Section -->
      <div class="titration-section">
        <h3>Titration Data</h3>
        <div class="form-row">
          <mat-form-field class="third-width">
            <mat-label>Initial Buret Reading</mat-label>
            <input matInput type="number" formControlName="initialBuret"
                   step="0.01" min="0" max="50" placeholder="Initial reading (mL)">
            <mat-hint>Starting buret reading (typically 0)</mat-hint>
            @if (form.get('initialBuret')?.hasError('required')) {
              <mat-error>Initial buret reading is required</mat-error>
            }
            @if (form.get('initialBuret')?.hasError('min') || form.get('initialBuret')?.hasError('max')) {
              <mat-error>Reading must be between 0-50 mL</mat-error>
            }
          </mat-form-field>

          <mat-form-field class="third-width">
            <mat-label>Final Buret Reading</mat-label>
            <input matInput type="number" formControlName="finalBuret"
                   step="0.01" min="0" max="50" placeholder="Final reading (mL)">
            <mat-hint>Buret reading after titration</mat-hint>
            @if (form.get('finalBuret')?.hasError('required')) {
              <mat-error>Final buret reading is required</mat-error>
            }
            @if (form.get('finalBuret')?.hasError('min') || form.get('finalBuret')?.hasError('max')) {
              <mat-error>Reading must be between 0-50 mL</mat-error>
            }
          </mat-form-field>

          <mat-form-field class="third-width">
            <mat-label>Net Buret Volume</mat-label>
            <input matInput type="number" [value]="netBuretVolume" 
                   readonly class="calculated-field" placeholder="mL">
            <mat-hint>Automatically calculated: Final - Initial</mat-hint>
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field class="third-width">
            <mat-label>KOH Normality</mat-label>
            <input matInput type="number" formControlName="kohNormality"
                   step="0.0001" min="0.0001" max="1.0000" placeholder="0.1000 N">
            <mat-hint>Typically around 0.1000 N</mat-hint>
            @if (form.get('kohNormality')?.hasError('required')) {
              <mat-error>KOH normality is required</mat-error>
            }
            @if (form.get('kohNormality')?.hasError('min') || form.get('kohNormality')?.hasError('max')) {
              <mat-error>Normality must be between 0.0001-1.0000 N</mat-error>
            }
          </mat-form-field>

          <mat-form-field class="third-width">
            <mat-label>Solvent System</mat-label>
            <mat-select formControlName="solvent">
              <mat-option value="Isopropanol/Toluene">Isopropanol/Toluene (1:1)</mat-option>
              <mat-option value="Isopropanol/Water">Isopropanol/Water</mat-option>
              <mat-option value="Toluene/Methanol">Toluene/Methanol</mat-option>
              <mat-option value="Other">Other</mat-option>
            </mat-select>
            <mat-hint>Solvent mixture used</mat-hint>
          </mat-form-field>

          <mat-form-field class="third-width">
            <mat-label>Indicator</mat-label>
            <mat-select formControlName="indicator">
              <mat-option value="P-Naphtholbenzein">P-Naphtholbenzein</mat-option>
              <mat-option value="Alkali Blue">Alkali Blue</mat-option>
              <mat-option value="Potentiometric">Potentiometric (no indicator)</mat-option>
              <mat-option value="Other">Other</mat-option>
            </mat-select>
            <mat-hint>Color indicator used</mat-hint>
          </mat-form-field>
        </div>
      </div>

      <!-- Test Conditions Section -->
      <div class="conditions-section">
        <h3>Test Conditions</h3>
        <div class="form-row">
          <mat-form-field class="half-width">
            <mat-label>Temperature</mat-label>
            <input matInput type="number" formControlName="temperature"
                   step="0.1" min="15" max="35" placeholder="22 °C">
            <mat-hint>Room temperature during test</mat-hint>
            @if (form.get('temperature')?.hasError('min') || form.get('temperature')?.hasError('max')) {
              <mat-error>Temperature must be between 15-35°C</mat-error>
            }
          </mat-form-field>

          <mat-form-field class="half-width">
            <mat-label>Analyst Initials</mat-label>
            <input matInput formControlName="analystInitials"
                   maxlength="5" placeholder="ABC">
            @if (form.get('analystInitials')?.hasError('required')) {
              <mat-error>Analyst initials are required</mat-error>
            }
            @if (form.get('analystInitials')?.hasError('maxlength')) {
              <mat-error>Maximum 5 characters</mat-error>
            }
          </mat-form-field>
        </div>
      </div>

      <!-- Color Indication Section -->
      <div class="color-section">
        <h3>Color Indication</h3>
        <div class="form-row">
          <mat-form-field class="full-width">
            <mat-label>Color Observed</mat-label>
            <input matInput formControlName="colorObserved"
                   placeholder="Describe the color change observed at endpoint">
            <mat-hint>e.g., "Light pink to dark green", "Colorless to light pink"</mat-hint>
          </mat-form-field>
        </div>
      </div>

      <!-- Calculation Display -->
      @if (showCalculationDetails && netBuretVolume !== null) {
        <div class="calculation-display">
          <h3>Calculation Details</h3>
          <div class="calc-formula">
            <strong>Formula:</strong> TAN = (Net Buret Volume × KOH Normality × 56.1) / Sample Weight
          </div>
          @if (form.valid && netBuretVolume > 0) {
            <div class="calc-values">
              <p><strong>Net Volume:</strong> {{ netBuretVolume }} mL</p>
              <p><strong>KOH Normality:</strong> {{ form.get('kohNormality')?.value }} N</p>
              <p><strong>Sample Weight:</strong> {{ form.get('sampleWeight')?.value }} g</p>
              <p class="calc-result">
                <strong>TAN Result:</strong> {{ calculationResult?.result | number:'1.2-2' }} mg KOH/g
              </p>
            </div>
          }
        </div>
      }

      <!-- Quality Control Section -->
      @if (showQualityControlChecks()) {
        <div class="qc-section">
          <h3>Quality Control Checks</h3>
          <div class="qc-warnings">
            @if (hasNegativeVolume()) {
              <div class="qc-warning">
                <mat-icon>error</mat-icon>
                <span>Negative titration volume - check buret readings</span>
              </div>
            }
            @if (hasUnusualTitrationVolume() && !hasNegativeVolume()) {
              <div class="qc-warning">
                <mat-icon>warning</mat-icon>
                <span>{{ getQualityControlMessage() }}</span>
              </div>
            }
            @if (hasHighTanValue()) {
              <div class="qc-warning">
                <mat-icon>warning</mat-icon>
                <span>High TAN value - verify sample type and calculations</span>
              </div>
            }
          </div>
        </div>
      }

      <!-- Test Notes Section -->
      <div class="observations-section">
        <h3>Test Observations</h3>
        <div class="form-row">
          <mat-form-field class="full-width">
            <mat-label>Test Notes</mat-label>
            <textarea matInput formControlName="testNotes" rows="2"
                      placeholder="Equipment used, deviations, environmental conditions"></textarea>
            <mat-hint>Note any difficulties, equipment issues, or unusual behavior</mat-hint>
          </mat-form-field>
        </div>
      </div>
    </form>
  `,
  styleUrl: './tan-entry-form.css',
  standalone: true,
  imports: [
    SharedModule
  ]
})
export class TanEntryForm implements OnInit {
  form!: FormGroup;
  netBuretVolume = 0;
  showCalculationDetails = true;
  calculationResult?: { result: number; isValid: boolean };

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initializeForm();
    this.setupCalculationWatchers();
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      sampleWeight: ['', [Validators.required, Validators.min(0.01), Validators.max(10.00)]],
      initialBuret: ['', [Validators.required, Validators.min(0), Validators.max(50)]],
      finalBuret: ['', [Validators.required, Validators.min(0), Validators.max(50)]],
      kohNormality: ['', [Validators.required, Validators.min(0.0001), Validators.max(1.0000)]],
      temperature: ['', [Validators.min(15), Validators.max(35)]],
      analystInitials: ['', [Validators.required, Validators.maxLength(5)]],
      colorObserved: [''],
      testMethod: ['ASTM-D664'],
      solvent: ['Isopropanol/Toluene'],
      indicator: ['P-Naphtholbenzein'],
      testNotes: [''],
      mainComments: ['']
    });
  }

  private setupCalculationWatchers(): void {
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

  private performCalculation(): void {
    const values = this.extractCalculationValues();
    if (values['sampleWeight'] > 0 && values['finalBuret'] >= 0 && values['kohNormality'] > 0) {
      const tan = (values['finalBuret'] * values['kohNormality'] * 56.1) / values['sampleWeight'];
      this.calculationResult = {
        result: Math.round(tan * 100) / 100,
        isValid: true
      };
    } else {
      this.calculationResult = undefined;
    }
  }

  private extractCalculationValues(): Record<string, number> {
    return {
      sampleWeight: this.form.get('sampleWeight')?.value || 0,
      finalBuret: this.netBuretVolume,
      kohNormality: this.form.get('kohNormality')?.value || 0
    };
  }


  // Custom validation method for TAN-specific rules
  validateTanData(): string | null {
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

  // Quality control methods
  showQualityControlChecks(): boolean {
    return this.hasUnusualTitrationVolume() || 
           this.hasHighTanValue() || 
           this.hasNegativeVolume();
  }

  hasNegativeVolume(): boolean {
    return this.netBuretVolume < 0;
  }

  hasUnusualTitrationVolume(): boolean {
    return this.netBuretVolume > 30 || (this.netBuretVolume > 0 && this.netBuretVolume < 0.1);
  }

  hasHighTanValue(): boolean {
    const result = this.calculationResult?.result;
    return !!(result && result > 5);
  }

  getQualityControlMessage(): string {
    if (this.hasNegativeVolume()) {
      return 'Negative titration volume - check buret readings';
    }
    if (this.hasUnusualTitrationVolume()) {
      return this.netBuretVolume > 30 ? 
        'Very high titration volume - verify sample weight and procedure' :
        'Very low titration volume - may indicate measurement error';
    }
    if (this.hasHighTanValue()) {
      return 'High TAN value - verify sample type and calculations';
    }
    return '';
  }

}


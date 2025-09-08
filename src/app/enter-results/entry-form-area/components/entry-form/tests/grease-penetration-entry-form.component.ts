import { Component, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { BaseTestFormComponent } from '../../../../../shared/components/base-test-form/base-test-form.component';
import { SharedModule } from '../../../../../shared-module';

@Component({
  selector: 'app-grease-penetration-entry-form',
  template: `
    <form [formGroup]="form" class="grease-penetration-form-content">
      <!-- Test Setup Section -->
      <div class="setup-section">
        <h3>Test Setup</h3>
        <div class="form-row">
          <mat-form-field appearance="outline" class="third-width">
            <mat-label>Test Temperature (°C)</mat-label>
            <mat-select formControlName="testTemperature">
              <mat-option value="25">25°C (Standard)</mat-option>
              <mat-option value="0">0°C (Low temperature)</mat-option>
              <mat-option value="40">40°C (High temperature)</mat-option>
            </mat-select>
            <mat-hint>ASTM D217 standard temperature</mat-hint>
            <mat-error *ngIf="getFieldError('testTemperature')">
              {{ getFieldError('testTemperature') }}
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="third-width">
            <mat-label>Penetration Time (sec)</mat-label>
            <input 
              matInput 
              type="number" 
              formControlName="penetrationTime"
              step="1"
              min="5"
              max="10"
              placeholder="5">
            <mat-hint>Standard is 5 seconds</mat-hint>
            <mat-error *ngIf="getFieldError('penetrationTime')">
              {{ getFieldError('penetrationTime') }}
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

        <div class="form-row">
          <mat-checkbox formControlName="workedSample" class="worked-sample-checkbox">
            Sample was worked (60 strokes before test)
          </mat-checkbox>
        </div>
      </div>

      <!-- Cone Readings Section -->
      <div class="readings-section">
        <h3>Cone Penetration Readings</h3>
        <div class="cone-readings">
          <div class="form-row">
            <mat-form-field appearance="outline" class="quarter-width">
              <mat-label>Cone 1 Reading (mm/10)</mat-label>
              <input 
                matInput 
                type="number" 
                formControlName="cone1"
                step="1"
                min="50"
                max="500"
                placeholder="Reading 1">
              <mat-error *ngIf="getFieldError('cone1')">
                {{ getFieldError('cone1') }}
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="quarter-width">
              <mat-label>Cone 2 Reading (mm/10)</mat-label>
              <input 
                matInput 
                type="number" 
                formControlName="cone2"
                step="1"
                min="50"
                max="500"
                placeholder="Reading 2">
              <mat-error *ngIf="getFieldError('cone2')">
                {{ getFieldError('cone2') }}
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="quarter-width">
              <mat-label>Cone 3 Reading (mm/10)</mat-label>
              <input 
                matInput 
                type="number" 
                formControlName="cone3"
                step="1"
                min="50"
                max="500"
                placeholder="Reading 3">
              <mat-error *ngIf="getFieldError('cone3')">
                {{ getFieldError('cone3') }}
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="quarter-width">
              <mat-label>Average Reading (mm/10)</mat-label>
              <input 
                matInput 
                type="number" 
                [value]="averageReading" 
                readonly
                class="calculated-field">
              <mat-hint>Automatic average</mat-hint>
            </mat-form-field>
          </div>

          <!-- Reading validation indicators -->
          <div class="reading-validation" *ngIf="showReadingValidation()">
            <div class="validation-item" [class.valid]="isVariationAcceptable()" [class.invalid]="!isVariationAcceptable()">
              <mat-icon>{{ isVariationAcceptable() ? 'check_circle' : 'error' }}</mat-icon>
              <span>
                Reading variation: {{ getReadingVariation() }} mm/10 
                ({{ isVariationAcceptable() ? 'Acceptable' : 'High - Check readings' }})
              </span>
            </div>
            
            <div class="validation-item" [class.valid]="isRangeReasonable()" [class.invalid]="!isRangeReasonable()">
              <mat-icon>{{ isRangeReasonable() ? 'check_circle' : 'warning' }}</mat-icon>
              <span>
                Penetration range: {{ isRangeReasonable() ? 'Normal' : 'Outside typical range' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Equipment Information Section -->
      <div class="equipment-section">
        <h3>Equipment Information</h3>
        <div class="form-row">
          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Penetrometer ID</mat-label>
            <input 
              matInput 
              formControlName="penetrometerId"
              placeholder="Equipment ID">
            <mat-hint>Calibrated penetrometer identification</mat-hint>
          </mat-form-field>

          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Last Calibration Date</mat-label>
            <input 
              matInput 
              type="date"
              formControlName="lastCalibrationDate">
            <mat-hint>Equipment calibration date</mat-hint>
          </mat-form-field>
        </div>
      </div>

      <!-- Sample Observations Section -->
      <div class="observations-section">
        <h3>Sample Observations</h3>
        <div class="form-row">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Sample Appearance</mat-label>
            <textarea 
              matInput 
              formControlName="sampleAppearance"
              rows="2"
              placeholder="Describe grease color, consistency, any foreign matter...">
            </textarea>
            <mat-hint>e.g., "Light brown, smooth consistency", "Dark grease with metal particles"</mat-hint>
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Test Notes</mat-label>
            <textarea 
              matInput 
              formControlName="testNotes"
              rows="2"
              placeholder="Any unusual observations during testing...">
            </textarea>
            <mat-hint>Note any difficulties, equipment issues, or unusual behavior</mat-hint>
          </mat-form-field>
        </div>
      </div>

      <!-- Calculation Display -->
      <div class="calculation-display" *ngIf="showCalculationDetails && averageReading > 0">
        <h3>Calculation Details</h3>
        <div class="calc-formula">
          <strong>Formula:</strong> Penetration = (Average × 3.75) + 24<br>
          <strong>Where:</strong> Average is the arithmetic mean of three cone readings
        </div>
        <div class="calc-steps">
          <div class="calc-step">
            <strong>Step 1:</strong> Calculate average of cone readings<br>
            <span class="calc-detail">
              Average = ({{ form.get('cone1')?.value }} + {{ form.get('cone2')?.value }} + {{ form.get('cone3')?.value }}) ÷ 3 = {{ averageReading }}
            </span>
          </div>
          <div class="calc-step">
            <strong>Step 2:</strong> Apply penetration formula<br>
            <span class="calc-detail">
              Penetration = ({{ averageReading }} × 3.75) + 24 = {{ calculationResult?.result }}
            </span>
          </div>
        </div>
        <div class="calc-result">
          <strong>Final Penetration Value:</strong> {{ calculationResult?.result }} mm/10
        </div>
      </div>

      <!-- Classification Section -->
      <div class="classification-section" *ngIf="calculationResult?.result">
        <h3>Grease Classification</h3>
        <div class="classification-info">
          <div class="nlgi-grade">
            <strong>NLGI Grade:</strong> {{ getNLGIGrade() }}
          </div>
          <div class="penetration-range">
            <strong>Typical Range:</strong> {{ getPenetrationRange() }}
          </div>
          <div class="consistency-description">
            <strong>Consistency:</strong> {{ getConsistencyDescription() }}
          </div>
        </div>
      </div>
    </form>
  `,
  styleUrls: ['./grease-penetration-entry-form.component.scss'],
  standalone: true,
  imports: [
    SharedModule
  ]
})
export class GreasePenetrationEntryFormComponent extends BaseTestFormComponent implements OnInit {
  averageReading = 0;
  showCalculationDetails = true;

  override ngOnInit(): void {
    super.ngOnInit();
  }

  protected override initializeForm(): void {
    this.form = this.fb.group({
      testTemperature: ['25', Validators.required],
      penetrationTime: ['5', [Validators.required, Validators.min(5), Validators.max(10)]],
      analystInitials: ['', [Validators.required, Validators.maxLength(5)]],
      workedSample: [true],
      cone1: ['', [Validators.required, Validators.min(50), Validators.max(500)]],
      cone2: ['', [Validators.required, Validators.min(50), Validators.max(500)]],
      cone3: ['', [Validators.required, Validators.min(50), Validators.max(500)]],
      penetrometerId: [''],
      lastCalibrationDate: [''],
      sampleAppearance: [''],
      testNotes: [''],
      mainComments: ['']
    });
  }

  protected override setupCalculationWatchers(): void {
    this.form.valueChanges.subscribe(() => {
      this.calculateAverage();
      this.performCalculation();
    });
  }

  private calculateAverage(): void {
    const cone1 = this.form.get('cone1')?.value;
    const cone2 = this.form.get('cone2')?.value;
    const cone3 = this.form.get('cone3')?.value;

    if (cone1 && cone2 && cone3) {
      this.averageReading = Math.round((cone1 + cone2 + cone3) / 3);
    } else {
      this.averageReading = 0;
    }
  }

  protected override extractCalculationValues(): Record<string, number> {
    return {
      cone1: this.form.get('cone1')?.value || 0,
      cone2: this.form.get('cone2')?.value || 0,
      cone3: this.form.get('cone3')?.value || 0
    };
  }

  protected override loadExistingData(): void {
    super.loadExistingData();
    
    if (this.existingReading) {
      this.form.patchValue({
        cone1: this.existingReading.value1,
        cone2: this.existingReading.value2,
        cone3: this.existingReading.value3,
        testTemperature: this.existingReading.id1 || '25',
        penetrationTime: this.existingReading.id2 || '5',
        analystInitials: this.existingReading.id3,
        workedSample: this.extractFromComments('worked') === 'true',
        penetrometerId: this.extractFromComments('equip'),
        sampleAppearance: this.extractFromComments('appearance'),
        testNotes: this.extractFromComments('notes')
      });
    } else {
      // Set default values
      this.form.patchValue({
        testTemperature: '25',
        penetrationTime: '5',
        workedSample: true,
        analystInitials: localStorage.getItem('analystInitials') || ''
      });
    }
  }

  protected override createTestReading(isComplete: boolean = false) {
    const baseReading = super.createTestReading(isComplete);
    
    return {
      ...baseReading,
      value1: this.form.get('cone1')?.value,
      value2: this.form.get('cone2')?.value,
      value3: this.form.get('cone3')?.value,
      id1: this.form.get('testTemperature')?.value,
      id2: this.form.get('penetrationTime')?.value,
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
    const parts = [];
    
    if (this.form.get('workedSample')?.value) {
      parts.push('worked:true');
    }
    
    const equipId = this.form.get('penetrometerId')?.value;
    if (equipId) parts.push(`equip:${equipId}`);
    
    const appearance = this.form.get('sampleAppearance')?.value;
    if (appearance) parts.push(`appearance:${appearance}`);
    
    const notes = this.form.get('testNotes')?.value;
    if (notes) parts.push(`notes:${notes}`);
    
    const main = this.form.get('mainComments')?.value;
    if (main) parts.push(`comments:${main}`);
    
    return parts.join(' | ');
  }

  // Validation methods
  showReadingValidation(): boolean {
    return this.averageReading > 0 && this.hasAllReadings();
  }

  hasAllReadings(): boolean {
    const cone1 = this.form.get('cone1')?.value;
    const cone2 = this.form.get('cone2')?.value;
    const cone3 = this.form.get('cone3')?.value;
    return cone1 && cone2 && cone3;
  }

  isVariationAcceptable(): boolean {
    if (!this.hasAllReadings()) return true;
    
    const variation = this.getReadingVariation();
    return variation <= 10; // Typical acceptable variation
  }

  getReadingVariation(): number {
    if (!this.hasAllReadings()) return 0;
    
    const cone1 = this.form.get('cone1')?.value;
    const cone2 = this.form.get('cone2')?.value;
    const cone3 = this.form.get('cone3')?.value;
    
    const readings = [cone1, cone2, cone3];
    const max = Math.max(...readings);
    const min = Math.min(...readings);
    
    return max - min;
  }

  isRangeReasonable(): boolean {
    return this.averageReading >= 85 && this.averageReading <= 475;
  }

  // NLGI Classification methods
  getNLGIGrade(): string {
    const result = this.calculationResult?.result;
    if (!result) return 'N/A';
    
    if (result >= 445 && result <= 475) return '000';
    if (result >= 400 && result < 445) return '00';
    if (result >= 355 && result < 400) return '0';
    if (result >= 310 && result < 355) return '1';
    if (result >= 265 && result < 310) return '2';
    if (result >= 220 && result < 265) return '3';
    if (result >= 175 && result < 220) return '4';
    if (result >= 130 && result < 175) return '5';
    if (result >= 85 && result < 130) return '6';
    
    return 'Non-standard';
  }

  getPenetrationRange(): string {
    const grade = this.getNLGIGrade();
    const ranges: Record<string, string> = {
      '000': '445-475 mm/10',
      '00': '400-430 mm/10',
      '0': '355-385 mm/10',
      '1': '310-340 mm/10',
      '2': '265-295 mm/10',
      '3': '220-250 mm/10',
      '4': '175-205 mm/10',
      '5': '130-160 mm/10',
      '6': '85-115 mm/10'
    };
    
    return ranges[grade] || 'N/A';
  }

  getConsistencyDescription(): string {
    const grade = this.getNLGIGrade();
    const descriptions: Record<string, string> = {
      '000': 'Very fluid',
      '00': 'Fluid',
      '0': 'Semi-fluid',
      '1': 'Very soft',
      '2': 'Soft (most common)',
      '3': 'Medium',
      '4': 'Hard',
      '5': 'Very hard',
      '6': 'Block grease'
    };
    
    return descriptions[grade] || 'Unknown';
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

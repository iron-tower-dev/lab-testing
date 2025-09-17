import { Component, OnInit, input } from '@angular/core';
import { Validators } from '@angular/forms';
import { BaseTestFormComponent } from '../../../../../../shared/components/base-test-form/base-test-form.component';
import { SharedModule } from '../../../../../../shared-module';
import { SampleWithTestInfo } from '../../../../../enter-results.types';

@Component({
  standalone: true,
  selector: 'app-vis40-entry-form',
  templateUrl: './vis40-entry-form.html',
  styleUrl: './vis40-entry-form.css',
  imports: [
    SharedModule
  ]
})
export class Vis40EntryForm extends BaseTestFormComponent implements OnInit {
  sampleData = input<SampleWithTestInfo | null>(null);
  errorMessage = input<string | null>(null);
  
  hasUnsavedChanges(): boolean {
    return this.form?.dirty || false;
  }

  onClear(): void {
    this.form?.reset();
    this.averageViscosity = 0;
    this.temperatureCorrection = 0;
  }

  averageViscosity = 0;
  temperatureCorrection = 0;
  showCalculationDetails = true;
  
  override ngOnInit(): void {
    super.ngOnInit();
  }

  protected override initializeForm(): void {
    this.form = this.fb.group({
      // Temperature control
      testTemperature: ['40.0', [Validators.required, Validators.min(39.5), Validators.max(40.5)]],
      temperatureStability: ['', [Validators.min(-0.1), Validators.max(0.1)]],
      
      // Viscometer information
      viscometerType: ['Cannon-Fenske', Validators.required],
      viscometerConstant: ['', [Validators.required, Validators.min(0.001), Validators.max(100)]],
      calibrationDate: [''],
      
      // Time measurements (seconds)
      run1Time: ['', [Validators.required, Validators.min(200), Validators.max(1000)]],
      run2Time: ['', [Validators.required, Validators.min(200), Validators.max(1000)]],
      run3Time: ['', [Validators.min(200), Validators.max(1000)]],
      run4Time: ['', [Validators.min(200), Validators.max(1000)]],
      
      // Sample information
      sampleVolume: ['', [Validators.min(5), Validators.max(25)]],
      sampleAppearance: ['Clear'],
      
      // Environmental conditions
      roomTemperature: ['', [Validators.min(20), Validators.max(30)]],
      barometricPressure: ['', [Validators.min(700), Validators.max(800)]],
      
      // Analyst information
      analystInitials: ['', [Validators.required, Validators.maxLength(5)]],
      
      // Comments
      testNotes: [''],
      mainComments: ['']
    });
  }

  protected override setupCalculationWatchers(): void {
    this.form.valueChanges.subscribe(() => {
      this.calculateAverageViscosity();
      this.calculateTemperatureCorrection();
      this.performCalculation();
    });
  }

  private calculateAverageViscosity(): void {
    const validTimes = this.getValidTimes();
    const constant = this.form.get('viscometerConstant')?.value;
    
    if (validTimes.length >= 2 && constant) {
      const averageTime = validTimes.reduce((sum, time) => sum + time, 0) / validTimes.length;
      this.averageViscosity = Math.round((averageTime * constant) * 100) / 100;
    } else {
      this.averageViscosity = 0;
    }
  }

  private calculateTemperatureCorrection(): void {
    const testTemp = this.form.get('testTemperature')?.value;
    if (testTemp) {
      const deviation = testTemp - 40.0;
      // Approximate 0.7% per degree Celsius correction for typical lubricants
      this.temperatureCorrection = Math.round((deviation * 0.7) * 100) / 100;
    } else {
      this.temperatureCorrection = 0;
    }
  }

  private getValidTimes(): number[] {
    const times = [
      this.form.get('run1Time')?.value,
      this.form.get('run2Time')?.value,
      this.form.get('run3Time')?.value,
      this.form.get('run4Time')?.value
    ].filter(time => time !== null && time !== undefined && time !== '');
    
    return times.map(time => parseFloat(time)).filter(time => !isNaN(time));
  }

  protected override extractCalculationValues(): Record<string, number> {
    const validTimes = this.getValidTimes();
    const constant = this.form.get('viscometerConstant')?.value || 0;
    
    return {
      averageTime: validTimes.length > 0 ? validTimes.reduce((sum, time) => sum + time, 0) / validTimes.length : 0,
      constant: constant,
      temperature: this.form.get('testTemperature')?.value || 40
    };
  }

  // Quality control methods
  getTimeVariation(): number {
    const validTimes = this.getValidTimes();
    if (validTimes.length < 2) return 0;
    
    const max = Math.max(...validTimes);
    const min = Math.min(...validTimes);
    const average = validTimes.reduce((sum, time) => sum + time, 0) / validTimes.length;
    
    return Math.round(((max - min) / average * 100) * 100) / 100;
  }

  isTimeVariationAcceptable(): boolean {
    return this.getTimeVariation() <= 0.2; // 0.2% acceptable variation
  }

  isTemperatureControlAcceptable(): boolean {
    const testTemp = this.form.get('testTemperature')?.value;
    return testTemp && Math.abs(testTemp - 40.0) <= 0.02;
  }

  showQualityControlChecks(): boolean {
    return !this.isTimeVariationAcceptable() || 
           !this.isTemperatureControlAcceptable() ||
           this.averageViscosity < 1 ||
           this.averageViscosity > 1000;
  }

  getQualityControlMessage(): string {
    if (!this.isTimeVariationAcceptable()) {
      return 'High time variation between runs - check viscometer cleanliness';
    }
    if (!this.isTemperatureControlAcceptable()) {
      return 'Temperature control outside acceptable range';
    }
    if (this.averageViscosity < 1) {
      return 'Viscosity result unusually low - verify sample and calculations';
    }
    if (this.averageViscosity > 1000) {
      return 'Viscosity result unusually high - verify sample type';
    }
    return '';
  }

  // Viscosity classification
  getISO3448Grade(): string {
    const viscosity = this.calculationResult?.result || this.averageViscosity;
    if (!viscosity) return 'N/A';
    
    // ISO 3448 viscosity grades at 40°C
    if (viscosity >= 1.98 && viscosity < 2.42) return 'VG 2';
    if (viscosity >= 2.88 && viscosity < 3.52) return 'VG 3';
    if (viscosity >= 4.14 && viscosity < 5.06) return 'VG 5';
    if (viscosity >= 6.12 && viscosity < 7.48) return 'VG 7';
    if (viscosity >= 9.00 && viscosity < 11.0) return 'VG 10';
    if (viscosity >= 13.5 && viscosity < 16.5) return 'VG 15';
    if (viscosity >= 19.8 && viscosity < 24.2) return 'VG 22';
    if (viscosity >= 28.8 && viscosity < 35.2) return 'VG 32';
    if (viscosity >= 41.4 && viscosity < 50.6) return 'VG 46';
    if (viscosity >= 61.2 && viscosity < 74.8) return 'VG 68';
    if (viscosity >= 90.0 && viscosity < 110) return 'VG 100';
    if (viscosity >= 135 && viscosity < 165) return 'VG 150';
    if (viscosity >= 198 && viscosity < 242) return 'VG 220';
    if (viscosity >= 288 && viscosity < 352) return 'VG 320';
    if (viscosity >= 414 && viscosity < 506) return 'VG 460';
    if (viscosity >= 612 && viscosity < 748) return 'VG 680';
    if (viscosity >= 900 && viscosity < 1100) return 'VG 1000';
    if (viscosity >= 1350 && viscosity < 1650) return 'VG 1500';
    
    return 'Non-standard';
  }

  protected override loadExistingData(): void {
    super.loadExistingData();
    
    if (this.existingReading) {
      this.form.patchValue({
        run1Time: this.existingReading.value1,
        run2Time: this.existingReading.value2,
        run3Time: this.existingReading.value3,
        run4Time: this.existingReading.trialCalc,
        viscometerConstant: this.existingReading.id1,
        testTemperature: this.existingReading.id2 || '40.0',
        analystInitials: this.existingReading.id3,
        testNotes: this.extractFromComments('notes')
      });
    } else {
      this.form.patchValue({
        analystInitials: localStorage.getItem('analystInitials') || '',
        testTemperature: '40.0',
        viscometerType: 'Cannon-Fenske',
        sampleAppearance: 'Clear'
      });
    }
  }

  protected override createTestReading(isComplete: boolean = false) {
    const baseReading = super.createTestReading(isComplete);
    
    return {
      ...baseReading,
      value1: this.form.get('run1Time')?.value,
      value2: this.form.get('run2Time')?.value,
      value3: this.form.get('run3Time')?.value,
      trialCalc: this.form.get('run4Time')?.value,
      id1: this.form.get('viscometerConstant')?.value,
      id2: this.form.get('testTemperature')?.value,
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
    
    const viscType = this.form.get('viscometerType')?.value;
    if (viscType) parts.push(`type:${viscType}`);
    
    const appearance = this.form.get('sampleAppearance')?.value;
    if (appearance) parts.push(`appearance:${appearance}`);
    
    const roomTemp = this.form.get('roomTemperature')?.value;
    if (roomTemp) parts.push(`roomTemp:${roomTemp}`);
    
    const pressure = this.form.get('barometricPressure')?.value;
    if (pressure) parts.push(`pressure:${pressure}`);
    
    const notes = this.form.get('testNotes')?.value;
    if (notes) parts.push(`notes:${notes}`);
    
    const main = this.form.get('mainComments')?.value;
    if (main) parts.push(`comments:${main}`);
    
    return parts.join(' | ');
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


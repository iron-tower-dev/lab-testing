import { Component, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { BaseTestFormComponent } from '../../../../../../shared/components/base-test-form/base-test-form.component';
import { SharedModule } from '../../../../../../shared-module';

@Component({
  selector: 'app-vis100-entry-form',
  standalone: true,
  templateUrl: './vis100-entry-form.html',
  styleUrls: ['./vis100-entry-form.scss'],
  imports: [
    SharedModule
  ]
})
export class Vis100EntryForm extends BaseTestFormComponent implements OnInit {
  averageViscosity = 0;
  viscosityIndex = 0;
  showCalculationDetails = true;
  
  override ngOnInit(): void {
    super.ngOnInit();
  }

  protected override initializeForm(): void {
    this.form = this.fb.group({
      // Temperature control
      testTemperature: ['100.0', [Validators.required, Validators.min(99.5), Validators.max(100.5)]],
      temperatureStability: ['', [Validators.min(-0.1), Validators.max(0.1)]],
      
      // Viscometer information
      viscometerType: ['Cannon-Fenske', Validators.required],
      viscometerConstant: ['', [Validators.required, Validators.min(0.0001), Validators.max(10)]],
      calibrationDate: [''],
      
      // Time measurements (seconds)
      run1Time: ['', [Validators.required, Validators.min(200), Validators.max(1000)]],
      run2Time: ['', [Validators.required, Validators.min(200), Validators.max(1000)]],
      run3Time: ['', [Validators.min(200), Validators.max(1000)]],
      run4Time: ['', [Validators.min(200), Validators.max(1000)]],
      
      // Related viscosity data for VI calculation
      vis40Result: ['', [Validators.min(1), Validators.max(2000)]],
      
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
      this.calculateViscosityIndex();
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

  private calculateViscosityIndex(): void {
    const vis40 = this.form.get('vis40Result')?.value;
    const vis100 = this.averageViscosity;
    
    if (vis40 && vis100 && vis40 > 0 && vis100 > 0) {
      // Simplified VI calculation using ASTM D2270 approach
      const L = this.getLValue(vis100);
      const H = this.getHValue(vis100);
      
      if (L && H) {
        this.viscosityIndex = Math.round(((L - vis40) / (L - H)) * 100);
      } else {
        this.viscosityIndex = 0;
      }
    } else {
      this.viscosityIndex = 0;
    }
  }

  private getLValue(vis100: number): number {
    // Simplified L value calculation for VI determination
    // This is a rough approximation - actual ASTM D2270 uses lookup tables
    return vis100 * Math.pow(vis100, 0.8) * 0.8;
  }

  private getHValue(vis100: number): number {
    // Simplified H value calculation for VI determination
    // This is a rough approximation - actual ASTM D2270 uses lookup tables
    return vis100 * Math.pow(vis100, 0.8) * 0.7;
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
      temperature: this.form.get('testTemperature')?.value || 100,
      vis40: this.form.get('vis40Result')?.value || 0
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
    return testTemp && Math.abs(testTemp - 100.0) <= 0.02;
  }

  isViscosityIndexReasonable(): boolean {
    return this.viscosityIndex >= -50 && this.viscosityIndex <= 300;
  }

  showQualityControlChecks(): boolean {
    return !this.isTimeVariationAcceptable() || 
           !this.isTemperatureControlAcceptable() ||
           !this.isViscosityIndexReasonable() ||
           this.averageViscosity < 0.5 ||
           this.averageViscosity > 200;
  }

  getQualityControlMessage(): string {
    if (!this.isTimeVariationAcceptable()) {
      return 'High time variation between runs - check viscometer cleanliness';
    }
    if (!this.isTemperatureControlAcceptable()) {
      return 'Temperature control outside acceptable range';
    }
    if (!this.isViscosityIndexReasonable()) {
      return 'Viscosity Index outside reasonable range - verify 40°C viscosity';
    }
    if (this.averageViscosity < 0.5) {
      return 'Viscosity result unusually low - verify sample and calculations';
    }
    if (this.averageViscosity > 200) {
      return 'Viscosity result unusually high - verify sample type';
    }
    return '';
  }

  // Viscosity Index classification
  getVIClassification(): string {
    if (this.viscosityIndex < 35) return 'Poor VI';
    if (this.viscosityIndex < 80) return 'Fair VI';
    if (this.viscosityIndex < 120) return 'Good VI';
    return 'Excellent VI';
  }

  // Viscosity ratio calculation
  getViscosityRatio(): number {
    const vis40 = this.form.get('vis40Result')?.value;
    if (vis40 && this.averageViscosity && this.averageViscosity > 0) {
      return Math.round((vis40 / this.averageViscosity) * 100) / 100;
    }
    return 0;
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
        testTemperature: this.existingReading.id2 || '100.0',
        analystInitials: this.existingReading.id3,
        vis40Result: this.extractFromComments('vis40'),
        testNotes: this.extractFromComments('notes')
      });
    } else {
      this.form.patchValue({
        analystInitials: localStorage.getItem('analystInitials') || '',
        testTemperature: '100.0',
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
    
    const vis40 = this.form.get('vis40Result')?.value;
    if (vis40) parts.push(`vis40:${vis40}`);
    
    const appearance = this.form.get('sampleAppearance')?.value;
    if (appearance) parts.push(`appearance:${appearance}`);
    
    const roomTemp = this.form.get('roomTemperature')?.value;
    if (roomTemp) parts.push(`roomTemp:${roomTemp}`);
    
    const pressure = this.form.get('barometricPressure')?.value;
    if (pressure) parts.push(`pressure:${pressure}`);
    
    if (this.viscosityIndex > 0) parts.push(`VI:${this.viscosityIndex}`);
    
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


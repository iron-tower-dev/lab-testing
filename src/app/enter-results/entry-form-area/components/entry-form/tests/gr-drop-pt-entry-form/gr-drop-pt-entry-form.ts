import { Component, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { BaseTestFormComponent } from '../../../../../../shared/components/base-test-form/base-test-form.component';
import { SharedModule } from '../../../../../../shared-module';

@Component({
  selector: 'app-gr-drop-pt-entry-form',
  standalone: true,
  templateUrl: './gr-drop-pt-entry-form.html',
  styleUrl: './gr-drop-pt-entry-form.css',
  imports: [
    SharedModule
  ]
})
export class GrDropPtEntryForm extends BaseTestFormComponent implements OnInit {
  averageDropPoint = 0;
  temperatureRange = 0;
  showCalculationDetails = true;
  
  override ngOnInit(): void {
    super.ngOnInit();
  }

  protected override initializeForm(): void {
    this.form = this.fb.group({
      // Drop point measurements
      trial1Temperature: ['', [Validators.required, Validators.min(50), Validators.max(350)]],
      trial2Temperature: ['', [Validators.required, Validators.min(50), Validators.max(350)]],
      trial3Temperature: ['', [Validators.min(50), Validators.max(350)]],
      
      // Sample preparation
      sampleAmount: ['', [Validators.required, Validators.min(0.5), Validators.max(5)]],
      sampleAppearance: [''],
      workedSample: [false],
      
      // Test apparatus
      apparatusType: ['ASTM D566', Validators.required],
      cupType: ['Standard metal cup'],
      thermometerId: [''],
      
      // Heating conditions
      heatingRate: ['2', [Validators.required, Validators.min(1), Validators.max(5)]],
      initialTemperature: ['', [Validators.min(20), Validators.max(50)]],
      ambientTemperature: ['', [Validators.min(15), Validators.max(35)]],
      
      // Visual observations
      firstSoftening: [''],
      dropAppearance: [''],
      dropBehavior: [''],
      
      // Quality control
      barometricPressure: ['', [Validators.min(700), Validators.max(800)]],
      draftConditions: ['None'],
      
      // Analyst information
      analystInitials: ['', [Validators.required, Validators.maxLength(5)]],
      
      // Comments
      observationNotes: [''],
      testNotes: [''],
      mainComments: ['']
    });
  }

  protected override setupCalculationWatchers(): void {
    this.form.valueChanges.subscribe(() => {
      this.calculateAverageDropPoint();
      this.calculateTemperatureRange();
      this.performCalculation();
    });
  }

  private calculateAverageDropPoint(): void {
    const validTemperatures = this.getValidTemperatures();
    
    if (validTemperatures.length >= 2) {
      const sum = validTemperatures.reduce((acc, temp) => acc + temp, 0);
      this.averageDropPoint = Math.round((sum / validTemperatures.length) * 10) / 10;
    } else {
      this.averageDropPoint = 0;
    }
  }

  private calculateTemperatureRange(): void {
    const validTemperatures = this.getValidTemperatures();
    
    if (validTemperatures.length >= 2) {
      const max = Math.max(...validTemperatures);
      const min = Math.min(...validTemperatures);
      this.temperatureRange = Math.round((max - min) * 10) / 10;
    } else {
      this.temperatureRange = 0;
    }
  }

  private getValidTemperatures(): number[] {
    const temperatures = [
      this.form.get('trial1Temperature')?.value,
      this.form.get('trial2Temperature')?.value,
      this.form.get('trial3Temperature')?.value
    ].filter(temp => temp !== null && temp !== undefined && temp !== '');
    
    return temperatures.map(temp => parseFloat(temp)).filter(temp => !isNaN(temp));
  }

  protected override extractCalculationValues(): Record<string, number> {
    const validTemperatures = this.getValidTemperatures();
    
    return {
      averageTemperature: validTemperatures.length > 0 ? 
        validTemperatures.reduce((sum, temp) => sum + temp, 0) / validTemperatures.length : 0,
      temperatureRange: this.temperatureRange,
      heatingRate: this.form.get('heatingRate')?.value || 2
    };
  }

  // Quality control methods
  isTemperatureRangeAcceptable(): boolean {
    return this.temperatureRange <= 4.0; // ASTM D566 repeatability requirement
  }

  isHeatingRateAcceptable(): boolean {
    const rate = this.form.get('heatingRate')?.value;
    return rate && rate >= 1.5 && rate <= 2.5; // ASTM D566 requirement
  }

  isDropPointReasonable(): boolean {
    return this.averageDropPoint >= 60 && this.averageDropPoint <= 320; // Typical range for greases
  }

  showQualityControlChecks(): boolean {
    return !this.isTemperatureRangeAcceptable() || 
           !this.isHeatingRateAcceptable() || 
           !this.isDropPointReasonable();
  }

  getQualityControlMessage(): string {
    if (!this.isTemperatureRangeAcceptable()) {
      return `Temperature range too high (${this.temperatureRange}°C) - repeat test`;
    }
    if (!this.isHeatingRateAcceptable()) {
      return 'Heating rate outside acceptable range (2 ± 0.5°C/min)';
    }
    if (!this.isDropPointReasonable()) {
      return 'Drop point outside typical grease range - verify sample type';
    }
    return '';
  }

  // Grease classification methods
  getDropPointClassification(): string {
    if (this.averageDropPoint >= 260) return 'Very High Drop Point';
    if (this.averageDropPoint >= 220) return 'High Drop Point';
    if (this.averageDropPoint >= 180) return 'Medium High Drop Point';
    if (this.averageDropPoint >= 150) return 'Medium Drop Point';
    if (this.averageDropPoint >= 120) return 'Medium Low Drop Point';
    return 'Low Drop Point';
  }

  getTemperatureService(): string {
    // Conservative service temperature estimate (typically 50-100°C below drop point)
    const serviceTemp = Math.round(this.averageDropPoint - 75);
    return `Approximately ${serviceTemp}°C maximum service temperature`;
  }

  getConsistencyIndication(): string {
    // Drop point can indicate grease consistency at elevated temperatures
    if (this.averageDropPoint >= 250) return 'Excellent high-temperature stability';
    if (this.averageDropPoint >= 200) return 'Good high-temperature stability';
    if (this.averageDropPoint >= 150) return 'Moderate high-temperature stability';
    return 'Limited high-temperature stability';
  }

  // Test validity checks
  hasValidDropObservation(): boolean {
    const dropAppearance = this.form.get('dropAppearance')?.value;
    const dropBehavior = this.form.get('dropBehavior')?.value;
    return dropAppearance || dropBehavior;
  }

  isPrecisionAcceptable(): boolean {
    const validTemps = this.getValidTemperatures();
    if (validTemps.length < 2) return false;
    
    const standardDev = this.calculateStandardDeviation(validTemps);
    return standardDev <= 2.0; // Acceptable precision
  }

  private calculateStandardDeviation(values: number[]): number {
    if (values.length < 2) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (values.length - 1);
    return Math.sqrt(variance);
  }

  protected override loadExistingData(): void {
    super.loadExistingData();
    
    if (this.existingReading) {
      this.form.patchValue({
        trial1Temperature: this.existingReading.value1,
        trial2Temperature: this.existingReading.value2,
        trial3Temperature: this.existingReading.value3,
        sampleAmount: this.existingReading.trialCalc,
        apparatusType: this.existingReading.id1 || 'ASTM D566',
        heatingRate: this.existingReading.id2 || '2',
        analystInitials: this.existingReading.id3,
        observationNotes: this.extractFromComments('observation'),
        testNotes: this.extractFromComments('notes')
      });
    } else {
      this.form.patchValue({
        analystInitials: localStorage.getItem('analystInitials') || '',
        apparatusType: 'ASTM D566',
        cupType: 'Standard metal cup',
        heatingRate: '2',
        draftConditions: 'None'
      });
    }
  }

  protected override createTestReading(isComplete: boolean = false) {
    const baseReading = super.createTestReading(isComplete);
    
    return {
      ...baseReading,
      value1: this.form.get('trial1Temperature')?.value,
      value2: this.form.get('trial2Temperature')?.value,
      value3: this.form.get('trial3Temperature')?.value,
      trialCalc: this.form.get('sampleAmount')?.value,
      id1: this.form.get('apparatusType')?.value,
      id2: this.form.get('heatingRate')?.value,
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
    
    if (this.averageDropPoint > 0) parts.push(`avgDropPoint:${this.averageDropPoint}C`);
    if (this.temperatureRange > 0) parts.push(`range:${this.temperatureRange}C`);
    
    const cupType = this.form.get('cupType')?.value;
    if (cupType) parts.push(`cup:${cupType}`);
    
    const workedSample = this.form.get('workedSample')?.value;
    if (workedSample) parts.push('worked:true');
    
    const appearance = this.form.get('sampleAppearance')?.value;
    if (appearance) parts.push(`appearance:${appearance}`);
    
    const softening = this.form.get('firstSoftening')?.value;
    if (softening) parts.push(`softening:${softening}`);
    
    const dropAppearance = this.form.get('dropAppearance')?.value;
    if (dropAppearance) parts.push(`dropAppearance:${dropAppearance}`);
    
    const dropBehavior = this.form.get('dropBehavior')?.value;
    if (dropBehavior) parts.push(`dropBehavior:${dropBehavior}`);
    
    const pressure = this.form.get('barometricPressure')?.value;
    if (pressure) parts.push(`pressure:${pressure}`);
    
    const observation = this.form.get('observationNotes')?.value;
    if (observation) parts.push(`observation:${observation}`);
    
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

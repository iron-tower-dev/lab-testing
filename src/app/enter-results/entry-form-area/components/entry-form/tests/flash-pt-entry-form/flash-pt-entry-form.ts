import { Component, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { BaseTestFormComponent } from '../../../../../../shared/components/base-test-form/base-test-form.component';
import { SharedModule } from '../../../../../../shared-module';

@Component({
  selector: 'app-flash-pt-entry-form',
  templateUrl: './flash-pt-entry-form.html',
  styleUrl: './flash-pt-entry-form.css',
  standalone: true,
  imports: [
    SharedModule
  ]
})
export class FlashPtEntryForm extends BaseTestFormComponent implements OnInit {
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


import { Component, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { BaseTestFormComponent } from '../../../../../../shared/components/base-test-form/base-test-form.component';
import { SharedModule } from '../../../../../../shared-module';

@Component({
  selector: 'app-rbot-entry-form',
  standalone: true,
  templateUrl: './rbot-entry-form.html',
  styleUrls: ['./rbot-entry-form.scss'],
  imports: [
    SharedModule
  ]
})
export class RbotEntryForm extends BaseTestFormComponent implements OnInit {
  oxidationLife = 0;
  remainingLife = 0;
  showCalculationDetails = true;
  
  override ngOnInit(): void {
    super.ngOnInit();
  }

  protected override initializeForm(): void {
    this.form = this.fb.group({
      // Test parameters
      testTemperature: ['150', [Validators.required, Validators.min(149), Validators.max(151)]],
      oxygenPressure: ['620', [Validators.required, Validators.min(610), Validators.max(630)]],
      sampleVolume: ['50', [Validators.required, Validators.min(45), Validators.max(55)]],
      
      // Catalyst information
      catalystType: ['Soluble copper', Validators.required],
      catalystAmount: ['', [Validators.required, Validators.min(0.1), Validators.max(2.0)]],
      
      // Time measurements
      initialTime: ['', Validators.required],
      endTime: ['', Validators.required],
      totalMinutes: ['', [Validators.required, Validators.min(1), Validators.max(2000)]],
      
      // Pressure readings
      initialPressure: ['', [Validators.required, Validators.min(600), Validators.max(650)]],
      finalPressure: ['', [Validators.required, Validators.min(400), Validators.max(650)]],
      pressureDrop: ['', [Validators.required, Validators.min(10), Validators.max(250)]],
      
      // Environmental conditions
      roomTemperature: ['', [Validators.min(20), Validators.max(30)]],
      barometricPressure: ['', [Validators.min(700), Validators.max(800)]],
      
      // Equipment information
      bombId: ['', Validators.required],
      lastCalibrationDate: [''],
      
      // Quality control
      temperatureStability: ['', [Validators.min(-1), Validators.max(1)]],
      leakCheck: [false],
      
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
      this.calculateOxidationLife();
      this.calculateRemainingLife();
      this.performCalculation();
    });
  }

  private calculateOxidationLife(): void {
    const totalMinutes = this.form.get('totalMinutes')?.value;
    if (totalMinutes && totalMinutes > 0) {
      this.oxidationLife = totalMinutes;
    } else {
      this.oxidationLife = 0;
    }
  }

  private calculateRemainingLife(): void {
    // Estimate remaining useful life based on RBOT results
    // This is a simplified calculation - actual formulas vary by application
    const rbotResult = this.oxidationLife;
    const newOilRbot = 1000; // Typical new oil RBOT time in minutes
    
    if (rbotResult > 0 && newOilRbot > 0) {
      this.remainingLife = Math.round((rbotResult / newOilRbot) * 100);
    } else {
      this.remainingLife = 0;
    }
  }

  protected override extractCalculationValues(): Record<string, number> {
    return {
      totalMinutes: this.form.get('totalMinutes')?.value || 0,
      pressureDrop: this.form.get('pressureDrop')?.value || 0,
      temperature: this.form.get('testTemperature')?.value || 150
    };
  }

  // Quality control methods
  isTestValid(): boolean {
    return this.isTemperatureControlAcceptable() && 
           this.isPressureControlAcceptable() && 
           this.isLeakCheckPassed();
  }

  isTemperatureControlAcceptable(): boolean {
    const testTemp = this.form.get('testTemperature')?.value;
    const stability = this.form.get('temperatureStability')?.value;
    return testTemp && Math.abs(testTemp - 150) <= 0.5 && (!stability || Math.abs(stability) <= 0.5);
  }

  isPressureControlAcceptable(): boolean {
    const oxygenPressure = this.form.get('oxygenPressure')?.value;
    return oxygenPressure && Math.abs(oxygenPressure - 620) <= 10;
  }

  isLeakCheckPassed(): boolean {
    return this.form.get('leakCheck')?.value === true;
  }

  showQualityControlChecks(): boolean {
    return !this.isTestValid() || this.oxidationLife < 100 || this.oxidationLife > 2000;
  }

  getQualityControlMessage(): string {
    if (!this.isTemperatureControlAcceptable()) {
      return 'Temperature control outside acceptable range (150 ± 0.5°C)';
    }
    if (!this.isPressureControlAcceptable()) {
      return 'Oxygen pressure outside acceptable range (620 ± 10 kPa)';
    }
    if (!this.isLeakCheckPassed()) {
      return 'Leak check failed - verify bomb seal integrity';
    }
    if (this.oxidationLife < 100) {
      return 'Very low RBOT result - oil severely degraded';
    }
    if (this.oxidationLife > 2000) {
      return 'Unusually high RBOT result - verify test conditions';
    }
    return '';
  }

  // Oil condition assessment
  getOilCondition(): string {
    if (this.oxidationLife >= 1000) return 'Excellent';
    if (this.oxidationLife >= 700) return 'Good';
    if (this.oxidationLife >= 400) return 'Fair';
    if (this.oxidationLife >= 200) return 'Poor';
    return 'Critical';
  }

  getRecommendation(): string {
    if (this.remainingLife >= 80) return 'Continue in service';
    if (this.remainingLife >= 50) return 'Monitor closely';
    if (this.remainingLife >= 25) return 'Plan oil change';
    return 'Change oil immediately';
  }

  // Time calculation helpers
  calculateTotalMinutes(): void {
    const initial = this.form.get('initialTime')?.value;
    const end = this.form.get('endTime')?.value;
    
    if (initial && end) {
      const startTime = new Date(`1970-01-01T${initial}:00`);
      const endTime = new Date(`1970-01-01T${end}:00`);
      
      let diffMs = endTime.getTime() - startTime.getTime();
      if (diffMs < 0) {
        // Handle case where end time is next day
        diffMs += 24 * 60 * 60 * 1000;
      }
      
      const totalMinutes = Math.round(diffMs / (1000 * 60));
      this.form.patchValue({ totalMinutes: totalMinutes });
    }
  }

  calculatePressureDrop(): void {
    const initial = this.form.get('initialPressure')?.value;
    const final = this.form.get('finalPressure')?.value;
    
    if (initial && final) {
      const drop = Math.round((initial - final) * 10) / 10;
      this.form.patchValue({ pressureDrop: drop });
    }
  }

  protected override loadExistingData(): void {
    super.loadExistingData();
    
    if (this.existingReading) {
      this.form.patchValue({
        totalMinutes: this.existingReading.value1,
        pressureDrop: this.existingReading.value2,
        testTemperature: this.existingReading.value3 || '150',
        oxygenPressure: this.existingReading.trialCalc || '620',
        bombId: this.existingReading.id1,
        catalystAmount: this.existingReading.id2,
        analystInitials: this.existingReading.id3,
        observationNotes: this.extractFromComments('observation'),
        testNotes: this.extractFromComments('notes')
      });
    } else {
      this.form.patchValue({
        analystInitials: localStorage.getItem('analystInitials') || '',
        testTemperature: '150',
        oxygenPressure: '620',
        sampleVolume: '50',
        catalystType: 'Soluble copper'
      });
    }
  }

  protected override createTestReading(isComplete: boolean = false) {
    const baseReading = super.createTestReading(isComplete);
    
    return {
      ...baseReading,
      value1: this.form.get('totalMinutes')?.value,
      value2: this.form.get('pressureDrop')?.value,
      value3: this.form.get('testTemperature')?.value,
      trialCalc: this.form.get('oxygenPressure')?.value,
      id1: this.form.get('bombId')?.value,
      id2: this.form.get('catalystAmount')?.value,
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
    
    const catalyst = this.form.get('catalystType')?.value;
    if (catalyst) parts.push(`catalyst:${catalyst}`);
    
    const volume = this.form.get('sampleVolume')?.value;
    if (volume) parts.push(`volume:${volume}mL`);
    
    const roomTemp = this.form.get('roomTemperature')?.value;
    if (roomTemp) parts.push(`roomTemp:${roomTemp}`);
    
    const baroPressure = this.form.get('barometricPressure')?.value;
    if (baroPressure) parts.push(`baroPressure:${baroPressure}`);
    
    if (this.remainingLife > 0) parts.push(`remainingLife:${this.remainingLife}%`);
    
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

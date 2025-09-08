import { Component, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { BaseTestFormComponent } from '../../../../../../shared/components/base-test-form/base-test-form.component';
import { SharedModule } from '../../../../../../shared-module';

@Component({
  selector: 'app-fltr-res-entry-form',
  standalone: true,
  templateUrl: './fltr-res-entry-form.html',
  styleUrls: ['./fltr-res-entry-form.scss'],
  imports: [
    SharedModule
  ]
})
export class FltrResEntryForm extends BaseTestFormComponent implements OnInit {
  totalResidue = 0;
  residuePercentage = 0;
  showCalculationDetails = true;
  
  override ngOnInit(): void {
    super.ngOnInit();
  }

  protected override initializeForm(): void {
    this.form = this.fb.group({
      // Sample measurements
      initialSampleVolume: ['', [Validators.required, Validators.min(10), Validators.max(500)]],
      finalSampleVolume: ['', [Validators.min(5), Validators.max(500)]],
      sampleDensity: ['', [Validators.min(0.7), Validators.max(1.2)]],
      
      // Filter information
      filterType: ['0.8 µm membrane', Validators.required],
      filterDiameter: ['47', [Validators.required, Validators.min(25), Validators.max(90)]],
      filterLotNumber: [''],
      
      // Weight measurements (mg)
      initialFilterWeight: ['', [Validators.required, Validators.min(10), Validators.max(200)]],
      finalFilterWeight: ['', [Validators.required, Validators.min(10), Validators.max(500)]],
      tareWeight: ['', [Validators.min(0), Validators.max(50)]],
      
      // Washing process
      solventType: ['n-Heptane', Validators.required],
      washVolume: ['', [Validators.min(10), Validators.max(200)]],
      washCycles: ['3', [Validators.required, Validators.min(1), Validators.max(5)]],
      
      // Drying conditions
      dryingTemperature: ['105', [Validators.required, Validators.min(100), Validators.max(110)]],
      dryingTime: ['60', [Validators.required, Validators.min(30), Validators.max(180)]],
      
      // Environmental conditions
      roomTemperature: ['', [Validators.min(20), Validators.max(30)]],
      relativeHumidity: ['', [Validators.min(30), Validators.max(70)]],
      
      // Equipment information
      balanceId: ['', Validators.required],
      vacuumLevel: ['', [Validators.min(10), Validators.max(100)]],
      
      // Quality control
      blankCorrection: ['', [Validators.min(-1), Validators.max(5)]],
      duplicateTest: [false],
      
      // Analyst information
      analystInitials: ['', [Validators.required, Validators.maxLength(5)]],
      
      // Visual observations
      residueColor: [''],
      residueTexture: [''],
      filterCondition: [''],
      
      // Comments
      testNotes: [''],
      mainComments: ['']
    });
  }

  protected override setupCalculationWatchers(): void {
    this.form.valueChanges.subscribe(() => {
      this.calculateTotalResidue();
      this.calculateResiduePercentage();
      this.performCalculation();
    });
  }

  private calculateTotalResidue(): void {
    const initialWeight = this.form.get('initialFilterWeight')?.value;
    const finalWeight = this.form.get('finalFilterWeight')?.value;
    const tareWeight = this.form.get('tareWeight')?.value || 0;
    const blankCorrection = this.form.get('blankCorrection')?.value || 0;
    
    if (initialWeight && finalWeight && finalWeight > initialWeight) {
      this.totalResidue = Math.round(((finalWeight - initialWeight - tareWeight - blankCorrection) * 1000)) / 1000;
    } else {
      this.totalResidue = 0;
    }
  }

  private calculateResiduePercentage(): void {
    const sampleVolume = this.form.get('initialSampleVolume')?.value;
    const density = this.form.get('sampleDensity')?.value || 0.85;
    
    if (this.totalResidue > 0 && sampleVolume > 0) {
      const sampleMass = sampleVolume * density; // Convert mL to g using density
      this.residuePercentage = Math.round((this.totalResidue / (sampleMass * 1000)) * 100 * 1000) / 1000; // Convert to percentage
    } else {
      this.residuePercentage = 0;
    }
  }

  protected override extractCalculationValues(): Record<string, number> {
    return {
      residueMass: this.totalResidue,
      sampleVolume: this.form.get('initialSampleVolume')?.value || 0,
      density: this.form.get('sampleDensity')?.value || 0.85
    };
  }

  // Quality control methods
  isWeightChangeSignificant(): boolean {
    return this.totalResidue >= 0.1; // Minimum significant weight change in mg
  }

  isResiduePercentageReasonable(): boolean {
    return this.residuePercentage <= 10; // Max reasonable percentage for most oils
  }

  isDryingConditionAcceptable(): boolean {
    const temp = this.form.get('dryingTemperature')?.value;
    const time = this.form.get('dryingTime')?.value;
    return temp && time && temp >= 103 && temp <= 107 && time >= 60;
  }

  showQualityControlChecks(): boolean {
    return !this.isWeightChangeSignificant() || 
           !this.isResiduePercentageReasonable() || 
           !this.isDryingConditionAcceptable();
  }

  getQualityControlMessage(): string {
    if (!this.isWeightChangeSignificant()) {
      return 'Weight change too small - may be within measurement uncertainty';
    }
    if (!this.isResiduePercentageReasonable()) {
      return 'Unusually high residue percentage - verify sample and calculations';
    }
    if (!this.isDryingConditionAcceptable()) {
      return 'Drying conditions outside recommended range (105 ± 2°C for ≥60 min)';
    }
    return '';
  }

  // Residue classification
  getResidueLevel(): string {
    if (this.residuePercentage <= 0.05) return 'Very Low';
    if (this.residuePercentage <= 0.1) return 'Low';
    if (this.residuePercentage <= 0.2) return 'Moderate';
    if (this.residuePercentage <= 0.5) return 'High';
    return 'Very High';
  }

  getInterpretation(): string {
    if (this.residuePercentage <= 0.05) return 'Excellent filtration, minimal contamination';
    if (this.residuePercentage <= 0.1) return 'Good condition, acceptable residue levels';
    if (this.residuePercentage <= 0.2) return 'Moderate contamination, monitor closely';
    if (this.residuePercentage <= 0.5) return 'High contamination, consider filtration';
    return 'Very high contamination, immediate action required';
  }

  // Calculation helpers
  calculateWeightGain(): number {
    const initial = this.form.get('initialFilterWeight')?.value;
    const final = this.form.get('finalFilterWeight')?.value;
    
    if (initial && final) {
      return Math.round((final - initial) * 1000) / 1000;
    }
    return 0;
  }

  calculateFilterArea(): number {
    const diameter = this.form.get('filterDiameter')?.value;
    
    if (diameter) {
      const radius = diameter / 2;
      return Math.round((Math.PI * radius * radius) * 100) / 100;
    }
    return 0;
  }

  calculateResiduePerArea(): number {
    const area = this.calculateFilterArea();
    
    if (area > 0 && this.totalResidue > 0) {
      return Math.round((this.totalResidue / area) * 1000) / 1000;
    }
    return 0;
  }

  protected override loadExistingData(): void {
    super.loadExistingData();
    
    if (this.existingReading) {
      this.form.patchValue({
        totalResidue: this.existingReading.value1,
        initialSampleVolume: this.existingReading.value2,
        finalFilterWeight: this.existingReading.value3,
        initialFilterWeight: this.existingReading.trialCalc,
        balanceId: this.existingReading.id1,
        filterType: this.existingReading.id2 || '0.8 µm membrane',
        analystInitials: this.existingReading.id3,
        residueColor: this.extractFromComments('color'),
        testNotes: this.extractFromComments('notes')
      });
    } else {
      this.form.patchValue({
        analystInitials: localStorage.getItem('analystInitials') || '',
        filterType: '0.8 µm membrane',
        filterDiameter: '47',
        solventType: 'n-Heptane',
        washCycles: '3',
        dryingTemperature: '105',
        dryingTime: '60'
      });
    }
  }

  protected override createTestReading(isComplete: boolean = false) {
    const baseReading = super.createTestReading(isComplete);
    
    return {
      ...baseReading,
      value1: this.totalResidue,
      value2: this.form.get('initialSampleVolume')?.value,
      value3: this.form.get('finalFilterWeight')?.value,
      trialCalc: this.form.get('initialFilterWeight')?.value,
      id1: this.form.get('balanceId')?.value,
      id2: this.form.get('filterType')?.value,
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
    
    if (this.residuePercentage > 0) parts.push(`percentage:${this.residuePercentage}%`);
    
    const diameter = this.form.get('filterDiameter')?.value;
    if (diameter) parts.push(`diameter:${diameter}mm`);
    
    const solvent = this.form.get('solventType')?.value;
    if (solvent) parts.push(`solvent:${solvent}`);
    
    const washCycles = this.form.get('washCycles')?.value;
    if (washCycles) parts.push(`washes:${washCycles}`);
    
    const dryingTemp = this.form.get('dryingTemperature')?.value;
    const dryingTime = this.form.get('dryingTime')?.value;
    if (dryingTemp && dryingTime) parts.push(`drying:${dryingTemp}C-${dryingTime}min`);
    
    const color = this.form.get('residueColor')?.value;
    if (color) parts.push(`color:${color}`);
    
    const texture = this.form.get('residueTexture')?.value;
    if (texture) parts.push(`texture:${texture}`);
    
    const filterCondition = this.form.get('filterCondition')?.value;
    if (filterCondition) parts.push(`filterCondition:${filterCondition}`);
    
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

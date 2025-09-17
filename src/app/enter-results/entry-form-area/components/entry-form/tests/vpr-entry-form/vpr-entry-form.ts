import { Component, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { BaseTestFormComponent } from '../../../../../../shared/components/base-test-form/base-test-form.component';
import { SharedModule } from '../../../../../../shared-module';

@Component({
  selector: 'app-vpr-entry-form',
  standalone: true,
  templateUrl: './vpr-entry-form.html',
  styleUrl: './vpr-entry-form.css',
  imports: [
    SharedModule
  ]
})
export class VprEntryForm extends BaseTestFormComponent implements OnInit {
  vprRating = 0;
  colorimetricReading = 0;
  showCalculationDetails = true;
  
  override ngOnInit(): void {
    super.ngOnInit();
  }

  protected override initializeForm(): void {
    this.form = this.fb.group({
      // Sample preparation
      sampleVolume: ['100', [Validators.required, Validators.min(50), Validators.max(200)]],
      dilutionRatio: ['1:9', Validators.required],
      solventType: ['n-Heptane', Validators.required],
      
      // Filtration process
      filterType: ['0.45 µm membrane', Validators.required],
      filteringPressure: ['', [Validators.min(10), Validators.max(100)]],
      filtrationTime: ['', [Validators.min(1), Validators.max(60)]],
      
      // Spectrophotometer readings
      absorbance385nm: ['', [Validators.required, Validators.min(0), Validators.max(3)]],
      absorbance400nm: ['', [Validators.min(0), Validators.max(3)]],
      absorbance425nm: ['', [Validators.min(0), Validators.max(3)]],
      
      // Reference measurements
      blankReading: ['', [Validators.required, Validators.min(0), Validators.max(0.5)]],
      standardReading: ['', [Validators.min(0), Validators.max(3)]],
      
      // Instrument settings
      instrumentId: ['', Validators.required],
      cellPath: ['10', [Validators.required, Validators.min(5), Validators.max(50)]],
      wavelengthAccuracy: ['', [Validators.min(-1), Validators.max(1)]],
      
      // Environmental conditions
      testTemperature: ['', [Validators.min(20), Validators.max(30)]],
      relativeHumidity: ['', [Validators.min(30), Validators.max(70)]],
      
      // Quality control
      duplicateTest: [false],
      standardDeviation: ['', [Validators.min(0), Validators.max(10)]],
      
      // Analyst information
      analystInitials: ['', [Validators.required, Validators.maxLength(5)]],
      
      // Visual observations
      sampleClarity: ['Clear'],
      filterCondition: ['Good'],
      precipitateObserved: [false],
      
      // Comments
      testNotes: [''],
      mainComments: ['']
    });
  }

  protected override setupCalculationWatchers(): void {
    this.form.valueChanges.subscribe(() => {
      this.calculateColorimetricReading();
      this.calculateVPRRating();
      this.performCalculation();
    });
  }

  private calculateColorimetricReading(): void {
    const absorbance385 = this.form.get('absorbance385nm')?.value;
    const blankReading = this.form.get('blankReading')?.value;
    const cellPath = this.form.get('cellPath')?.value || 10;
    
    if (absorbance385 && blankReading) {
      // Corrected absorbance calculation
      const correctedAbs = absorbance385 - blankReading;
      this.colorimetricReading = Math.round((correctedAbs / (cellPath / 10)) * 1000) / 1000;
    } else {
      this.colorimetricReading = 0;
    }
  }

  private calculateVPRRating(): void {
    // VPR rating calculation based on corrected absorbance at 385nm
    // This is a simplified version - actual VPR may use proprietary algorithms
    if (this.colorimetricReading > 0) {
      this.vprRating = Math.round(this.colorimetricReading * 100);
    } else {
      this.vprRating = 0;
    }
  }

  protected override extractCalculationValues(): Record<string, number> {
    return {
      absorbance385: this.form.get('absorbance385nm')?.value || 0,
      blankReading: this.form.get('blankReading')?.value || 0,
      cellPath: this.form.get('cellPath')?.value || 10,
      dilutionFactor: this.parseDilutionRatio()
    };
  }

  private parseDilutionRatio(): number {
    const dilutionStr = this.form.get('dilutionRatio')?.value || '1:9';
    const parts = dilutionStr.split(':');
    if (parts.length === 2) {
      const sample = parseFloat(parts[0]);
      const solvent = parseFloat(parts[1]);
      return (sample + solvent) / sample; // Total dilution factor
    }
    return 10; // Default 1:9 dilution = 10x
  }

  // Quality control methods
  isAbsorbanceInRange(): boolean {
    const abs385 = this.form.get('absorbance385nm')?.value;
    return abs385 && abs385 >= 0.05 && abs385 <= 2.5; // Optimal measurement range
  }

  isBlankAcceptable(): boolean {
    const blank = this.form.get('blankReading')?.value;
    return blank !== null && blank !== undefined && blank <= 0.05; // Low blank requirement
  }

  isDilutionAppropriate(): boolean {
    // Check if sample needs different dilution based on absorbance
    const abs385 = this.form.get('absorbance385nm')?.value;
    if (!abs385) return true;
    
    if (abs385 > 2.5) return false; // Too concentrated, needs more dilution
    if (abs385 < 0.05) return false; // Too dilute, needs less dilution
    return true;
  }

  showQualityControlChecks(): boolean {
    return !this.isAbsorbanceInRange() || 
           !this.isBlankAcceptable() || 
           !this.isDilutionAppropriate();
  }

  getQualityControlMessage(): string {
    if (!this.isBlankAcceptable()) {
      return 'Blank reading too high - check solvent quality and cell cleanliness';
    }
    if (!this.isAbsorbanceInRange()) {
      const abs = this.form.get('absorbance385nm')?.value;
      if (abs > 2.5) return 'Absorbance too high - dilute sample further';
      if (abs < 0.05) return 'Absorbance too low - use less dilute sample';
    }
    if (!this.isDilutionAppropriate()) {
      return 'Current dilution not optimal for measurement range';
    }
    return '';
  }

  // VPR interpretation methods
  getVPRClassification(): string {
    if (this.vprRating <= 10) return 'Very Low Risk';
    if (this.vprRating <= 25) return 'Low Risk';
    if (this.vprRating <= 40) return 'Moderate Risk';
    if (this.vprRating <= 60) return 'High Risk';
    return 'Very High Risk';
  }

  getVarnishTendency(): string {
    if (this.vprRating <= 10) return 'Minimal varnish tendency';
    if (this.vprRating <= 25) return 'Low varnish tendency';
    if (this.vprRating <= 40) return 'Moderate varnish tendency';
    if (this.vprRating <= 60) return 'High varnish tendency';
    return 'Very high varnish tendency - immediate attention required';
  }

  getMaintenanceRecommendation(): string {
    if (this.vprRating <= 10) return 'Continue normal operation';
    if (this.vprRating <= 25) return 'Monitor trend closely';
    if (this.vprRating <= 40) return 'Consider additive treatment or oil change';
    if (this.vprRating <= 60) return 'Plan immediate oil change';
    return 'Immediate oil change required';
  }

  // Spectral analysis helpers
  getColorIndex(): number {
    const abs385 = this.form.get('absorbance385nm')?.value || 0;
    const abs425 = this.form.get('absorbance425nm')?.value || 0;
    
    if (abs425 > 0) {
      return Math.round((abs385 / abs425) * 100) / 100;
    }
    return 0;
  }

  hasSpectralInterference(): boolean {
    const precipitate = this.form.get('precipitateObserved')?.value;
    const clarity = this.form.get('sampleClarity')?.value;
    return precipitate || (clarity && clarity !== 'Clear');
  }

  protected override loadExistingData(): void {
    super.loadExistingData();
    
    if (this.existingReading) {
      this.form.patchValue({
        absorbance385nm: this.existingReading.value1,
        blankReading: this.existingReading.value2,
        sampleVolume: this.existingReading.value3,
        cellPath: this.existingReading.trialCalc || '10',
        instrumentId: this.existingReading.id1,
        dilutionRatio: this.existingReading.id2 || '1:9',
        analystInitials: this.existingReading.id3,
        testNotes: this.extractFromComments('notes')
      });
    } else {
      this.form.patchValue({
        analystInitials: localStorage.getItem('analystInitials') || '',
        sampleVolume: '100',
        dilutionRatio: '1:9',
        solventType: 'n-Heptane',
        filterType: '0.45 µm membrane',
        cellPath: '10',
        sampleClarity: 'Clear',
        filterCondition: 'Good'
      });
    }
  }

  protected override createTestReading(isComplete: boolean = false) {
    const baseReading = super.createTestReading(isComplete);
    
    return {
      ...baseReading,
      value1: this.form.get('absorbance385nm')?.value,
      value2: this.form.get('blankReading')?.value,
      value3: this.form.get('sampleVolume')?.value,
      trialCalc: this.form.get('cellPath')?.value,
      id1: this.form.get('instrumentId')?.value,
      id2: this.form.get('dilutionRatio')?.value,
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
    
    if (this.vprRating > 0) parts.push(`VPR:${this.vprRating}`);
    if (this.colorimetricReading > 0) parts.push(`colorimetric:${this.colorimetricReading}`);
    
    const solvent = this.form.get('solventType')?.value;
    if (solvent) parts.push(`solvent:${solvent}`);
    
    const filterType = this.form.get('filterType')?.value;
    if (filterType) parts.push(`filter:${filterType}`);
    
    const clarity = this.form.get('sampleClarity')?.value;
    if (clarity) parts.push(`clarity:${clarity}`);
    
    const precipitate = this.form.get('precipitateObserved')?.value;
    if (precipitate) parts.push('precipitate:observed');
    
    const testTemp = this.form.get('testTemperature')?.value;
    if (testTemp) parts.push(`temp:${testTemp}C`);
    
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

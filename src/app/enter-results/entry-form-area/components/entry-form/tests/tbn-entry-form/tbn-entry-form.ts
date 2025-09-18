import { Component, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { BaseTestFormComponent } from '../../../../../../shared/components/base-test-form/base-test-form.component';
import { SharedModule } from '../../../../../../shared-module';

@Component({
  selector: 'app-tbn-entry-form',
  standalone: true,
  templateUrl: './tbn-entry-form.html',
  styleUrl: './tbn-entry-form.css',
  imports: [
    SharedModule
  ]
})
export class TbnEntryForm extends BaseTestFormComponent implements OnInit {
  averageResult = 0;
  showCalculationDetails = true;
  
  override ngOnInit(): void {
    super.ngOnInit();
  }

  protected override initializeForm(): void {
    this.form = this.fb.group({
      // Trial results
      trial1Result: ['', [Validators.required, Validators.min(0), Validators.max(50)]],
      trial2Result: ['', [Validators.required, Validators.min(0), Validators.max(50)]],
      trial3Result: ['', [Validators.min(0), Validators.max(50)]],
      trial4Result: ['', [Validators.min(0), Validators.max(50)]],
      
      // Test parameters
      sampleWeight: ['', [Validators.required, Validators.min(0.1), Validators.max(10)]],
      titrantNormality: ['0.1000', [Validators.required, Validators.min(0.0001), Validators.max(1.0000)]],
      
      // Equipment and conditions
      temperatureEquipmentId: [''],
      titrationEquipmentId: [''],
      testTemperature: ['25', [Validators.min(20), Validators.max(30)]],
      analystInitials: ['', [Validators.required, Validators.maxLength(5)]],
      
      // Titration details
      solventSystem: ['Perchloric acid in glacial acetic acid'],
      indicator: ['Crystal violet'],
      
      // Comments
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
    const validResults = this.getValidResults();
    if (validResults.length >= 2) {
      this.averageResult = Math.round((validResults.reduce((sum, val) => sum + val, 0) / validResults.length) * 100) / 100;
    } else {
      this.averageResult = 0;
    }
  }

  private getValidResults(): number[] {
    const results = [
      this.form.get('trial1Result')?.value,
      this.form.get('trial2Result')?.value,
      this.form.get('trial3Result')?.value,
      this.form.get('trial4Result')?.value
    ].filter(val => val !== null && val !== undefined && val !== '');
    
    return results.map(val => parseFloat(val)).filter(val => !isNaN(val));
  }

  protected override extractCalculationValues(): Record<string, number> {
    const sampleWeight = this.form.get('sampleWeight')?.value || 0;
    const titrantNormality = this.form.get('titrantNormality')?.value || 0;
    
    return {
      averageVolume: this.averageResult,
      sampleWeight: sampleWeight,
      normality: titrantNormality
    };
  }

  getTbnResult(): number {
    const sampleWeight = this.form.get('sampleWeight')?.value;
    const titrantNormality = this.form.get('titrantNormality')?.value;
    
    if (this.averageResult > 0 && sampleWeight > 0 && titrantNormality > 0) {
      // TBN calculation: (Volume × Normality × 56.1) / Sample Weight
      const tbn = (this.averageResult * titrantNormality * 56.1) / sampleWeight;
      return Math.round(tbn * 100) / 100;
    }
    return 0;
  }

  getResultVariation(): number {
    const validResults = this.getValidResults();
    if (validResults.length < 2) return 0;
    
    const max = Math.max(...validResults);
    const min = Math.min(...validResults);
    return Math.round((max - min) * 100) / 100;
  }

  isVariationAcceptable(): boolean {
    return this.getResultVariation() <= 0.2; // 0.2 mL acceptable variation
  }

  showQualityControlChecks(): boolean {
    return !this.isVariationAcceptable() || this.getTbnResult() > 15 || this.averageResult > 25;
  }

  getQualityControlMessage(): string {
    if (!this.isVariationAcceptable()) {
      return 'High variation between trials - review titration technique';
    }
    if (this.getTbnResult() > 15) {
      return 'High TBN value - verify sample type and calculations';
    }
    if (this.averageResult > 25) {
      return 'High titrant volume - check normality and sample weight';
    }
    return '';
  }

  protected override loadExistingData(): void {
    super.loadExistingData();
    
    if (this.existingReading) {
      this.form.patchValue({
        trial1Result: this.existingReading.value1,
        trial2Result: this.existingReading.value2,
        trial3Result: this.existingReading.value3,
        trial4Result: this.existingReading.trialCalc,
        sampleWeight: this.existingReading.id1,
        titrantNormality: this.existingReading.id2 || '0.1000',
        analystInitials: this.existingReading.id3,
        testNotes: this.extractFromComments('notes')
      });
    } else {
      this.form.patchValue({
        analystInitials: localStorage.getItem('analystInitials') || '',
        titrantNormality: '0.1000',
        testTemperature: '25'
      });
    }
  }

  protected override createTestReading(isComplete: boolean = false) {
    const baseReading = super.createTestReading(isComplete);
    const tbnResult = this.getTbnResult();
    
    return {
      ...baseReading,
      value1: this.form.get('trial1Result')?.value,
      value2: this.form.get('trial2Result')?.value,
      value3: this.form.get('trial3Result')?.value,
      trialCalc: this.form.get('trial4Result')?.value || (tbnResult > 0 ? tbnResult : null),
      id1: this.form.get('sampleWeight')?.value,
      id2: this.form.get('titrantNormality')?.value,
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
    
    const tempEquip = this.form.get('temperatureEquipmentId')?.value;
    if (tempEquip) parts.push(`tempEquip:${tempEquip}`);
    
    const titrationEquip = this.form.get('titrationEquipmentId')?.value;
    if (titrationEquip) parts.push(`titrationEquip:${titrationEquip}`);
    
    const solvent = this.form.get('solventSystem')?.value;
    if (solvent) parts.push(`solvent:${solvent}`);
    
    const indicator = this.form.get('indicator')?.value;
    if (indicator) parts.push(`indicator:${indicator}`);
    
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

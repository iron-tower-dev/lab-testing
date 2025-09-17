import { Component, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { BaseTestFormComponent } from '../../../../../../shared/components/base-test-form/base-test-form.component';
import { SharedModule } from '../../../../../../shared-module';

@Component({
  standalone: true,
  selector: 'app-pcnt-entry-form',
  templateUrl: './pcnt-entry-form.html',
  styleUrl: './pcnt-entry-form.css',
  imports: [
    SharedModule
  ]
})
export class PcntEntryForm extends BaseTestFormComponent implements OnInit {
  iso4406Code = '';
  nas1638Code = 0;
  showCalculationDetails = true;
  
  override ngOnInit(): void {
    super.ngOnInit();
  }

  protected override initializeForm(): void {
    this.form = this.fb.group({
      // Particle counts by size (particles per mL)
      particles4um: ['', [Validators.required, Validators.min(0), Validators.max(1000000)]],
      particles6um: ['', [Validators.required, Validators.min(0), Validators.max(500000)]],
      particles14um: ['', [Validators.required, Validators.min(0), Validators.max(50000)]],
      particles21um: ['', [Validators.min(0), Validators.max(10000)]],
      particles38um: ['', [Validators.min(0), Validators.max(5000)]],
      particles70um: ['', [Validators.min(0), Validators.max(1000)]],
      
      // Sample information
      sampleVolume: ['1.0', [Validators.required, Validators.min(0.1), Validators.max(10)]],
      dilutionFactor: ['1', [Validators.required, Validators.min(1), Validators.max(1000)]],
      sampleAppearance: ['Clear'],
      
      // Instrument settings
      instrumentId: ['', Validators.required],
      calibrationDate: [''],
      flowRate: ['', [Validators.min(0.1), Validators.max(10)]],
      measurementTime: ['', [Validators.min(10), Validators.max(300)]],
      
      // Environmental conditions
      roomTemperature: ['', [Validators.min(20), Validators.max(30)]],
      relativeHumidity: ['', [Validators.min(30), Validators.max(70)]],
      
      // Quality control
      backgroundCount: ['', [Validators.min(0), Validators.max(100)]],
      coincidenceError: ['', [Validators.min(0), Validators.max(10)]],
      
      // Analyst information
      analystInitials: ['', [Validators.required, Validators.maxLength(5)]],
      
      // Comments
      instrumentNotes: [''],
      testNotes: [''],
      mainComments: ['']
    });
  }

  protected override setupCalculationWatchers(): void {
    this.form.valueChanges.subscribe(() => {
      this.calculateISO4406Code();
      this.calculateNAS1638Code();
      this.performCalculation();
    });
  }

  private calculateISO4406Code(): void {
    const particles4um = this.form.get('particles4um')?.value || 0;
    const particles6um = this.form.get('particles6um')?.value || 0;
    const particles14um = this.form.get('particles14um')?.value || 0;
    
    if (particles4um > 0 && particles6um > 0 && particles14um > 0) {
      const code4 = this.getISO4406Scale(particles4um);
      const code6 = this.getISO4406Scale(particles6um);
      const code14 = this.getISO4406Scale(particles14um);
      
      this.iso4406Code = `${code4}/${code6}/${code14}`;
    } else {
      this.iso4406Code = '';
    }
  }

  private calculateNAS1638Code(): void {
    const particles5um = this.form.get('particles6um')?.value || 0; // Approximation
    const particles15um = this.form.get('particles14um')?.value || 0; // Approximation
    const particles25um = this.form.get('particles21um')?.value || 0;
    const particles50um = this.form.get('particles38um')?.value || 0;
    const particles100um = this.form.get('particles70um')?.value || 0;
    
    // NAS 1638 classification based on particle counts
    if (particles5um <= 1 && particles15um <= 1 && particles25um <= 1) this.nas1638Code = 0;
    else if (particles5um <= 16 && particles15um <= 4 && particles25um <= 1) this.nas1638Code = 1;
    else if (particles5um <= 32 && particles15um <= 8 && particles25um <= 2) this.nas1638Code = 2;
    else if (particles5um <= 64 && particles15um <= 16 && particles25um <= 4) this.nas1638Code = 3;
    else if (particles5um <= 128 && particles15um <= 32 && particles25um <= 8) this.nas1638Code = 4;
    else if (particles5um <= 256 && particles15um <= 64 && particles25um <= 16) this.nas1638Code = 5;
    else if (particles5um <= 512 && particles15um <= 128 && particles25um <= 32) this.nas1638Code = 6;
    else if (particles5um <= 1024 && particles15um <= 256 && particles25um <= 64) this.nas1638Code = 7;
    else if (particles5um <= 2048 && particles15um <= 512 && particles25um <= 128) this.nas1638Code = 8;
    else if (particles5um <= 4096 && particles15um <= 1024 && particles25um <= 256) this.nas1638Code = 9;
    else if (particles5um <= 8192 && particles15um <= 2048 && particles25um <= 512) this.nas1638Code = 10;
    else if (particles5um <= 16384 && particles15um <= 4096 && particles25um <= 1024) this.nas1638Code = 11;
    else this.nas1638Code = 12;
  }

  private getISO4406Scale(particleCount: number): number {
    // ISO 4406:2017 scale numbers
    if (particleCount <= 0.01) return 4;
    if (particleCount <= 0.02) return 5;
    if (particleCount <= 0.04) return 6;
    if (particleCount <= 0.08) return 7;
    if (particleCount <= 0.16) return 8;
    if (particleCount <= 0.32) return 9;
    if (particleCount <= 0.64) return 10;
    if (particleCount <= 1.3) return 11;
    if (particleCount <= 2.5) return 12;
    if (particleCount <= 5) return 13;
    if (particleCount <= 10) return 14;
    if (particleCount <= 20) return 15;
    if (particleCount <= 40) return 16;
    if (particleCount <= 80) return 17;
    if (particleCount <= 160) return 18;
    if (particleCount <= 320) return 19;
    if (particleCount <= 640) return 20;
    if (particleCount <= 1300) return 21;
    if (particleCount <= 2500) return 22;
    if (particleCount <= 5000) return 23;
    if (particleCount <= 10000) return 24;
    if (particleCount <= 20000) return 25;
    if (particleCount <= 40000) return 26;
    if (particleCount <= 80000) return 27;
    return 28;
  }

  protected override extractCalculationValues(): Record<string, number> {
    return {
      particles4um: this.form.get('particles4um')?.value || 0,
      particles6um: this.form.get('particles6um')?.value || 0,
      particles14um: this.form.get('particles14um')?.value || 0,
      dilution: this.form.get('dilutionFactor')?.value || 1
    };
  }

  // Quality control methods
  isContaminationLevelAcceptable(): boolean {
    return this.nas1638Code <= 8; // Typical acceptable level for industrial systems
  }

  getContaminationLevel(): string {
    if (this.nas1638Code <= 3) return 'Very Clean';
    if (this.nas1638Code <= 6) return 'Clean';
    if (this.nas1638Code <= 9) return 'Moderate';
    if (this.nas1638Code <= 12) return 'Dirty';
    return 'Very Dirty';
  }

  showQualityControlChecks(): boolean {
    return !this.isContaminationLevelAcceptable() || this.hasInstrumentIssues();
  }

  hasInstrumentIssues(): boolean {
    const background = this.form.get('backgroundCount')?.value || 0;
    const coincidence = this.form.get('coincidenceError')?.value || 0;
    
    return background > 10 || coincidence > 5;
  }

  getQualityControlMessage(): string {
    if (!this.isContaminationLevelAcceptable()) {
      return `High contamination level (NAS ${this.nas1638Code}) - consider filtration`;
    }
    if (this.hasInstrumentIssues()) {
      return 'Instrument issues detected - check calibration and cleanliness';
    }
    return '';
  }

  // Particle size distribution analysis
  getLargeParticleRatio(): number {
    const particles6um = this.form.get('particles6um')?.value || 0;
    const particles14um = this.form.get('particles14um')?.value || 0;
    
    if (particles6um > 0) {
      return Math.round((particles14um / particles6um) * 1000) / 1000;
    }
    return 0;
  }

  isDistributionNormal(): boolean {
    const ratio = this.getLargeParticleRatio();
    return ratio >= 0.1 && ratio <= 0.8; // Typical range for normal distributions
  }

  protected override loadExistingData(): void {
    super.loadExistingData();
    
    if (this.existingReading) {
      this.form.patchValue({
        particles4um: this.existingReading.value1,
        particles6um: this.existingReading.value2,
        particles14um: this.existingReading.value3,
        particles21um: this.existingReading.trialCalc,
        instrumentId: this.existingReading.id1,
        sampleVolume: this.existingReading.id2 || '1.0',
        analystInitials: this.existingReading.id3,
        instrumentNotes: this.extractFromComments('instrument'),
        testNotes: this.extractFromComments('notes')
      });
    } else {
      this.form.patchValue({
        analystInitials: localStorage.getItem('analystInitials') || '',
        sampleVolume: '1.0',
        dilutionFactor: '1',
        sampleAppearance: 'Clear'
      });
    }
  }

  protected override createTestReading(isComplete: boolean = false) {
    const baseReading = super.createTestReading(isComplete);
    
    return {
      ...baseReading,
      value1: this.form.get('particles4um')?.value,
      value2: this.form.get('particles6um')?.value,
      value3: this.form.get('particles14um')?.value,
      trialCalc: this.form.get('particles21um')?.value,
      id1: this.form.get('instrumentId')?.value,
      id2: this.form.get('sampleVolume')?.value,
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
    
    if (this.iso4406Code) parts.push(`ISO4406:${this.iso4406Code}`);
    if (this.nas1638Code > 0) parts.push(`NAS1638:${this.nas1638Code}`);
    
    const dilution = this.form.get('dilutionFactor')?.value;
    if (dilution && dilution > 1) parts.push(`dilution:${dilution}`);
    
    const appearance = this.form.get('sampleAppearance')?.value;
    if (appearance) parts.push(`appearance:${appearance}`);
    
    const flowRate = this.form.get('flowRate')?.value;
    if (flowRate) parts.push(`flowRate:${flowRate}`);
    
    const instrumentNotes = this.form.get('instrumentNotes')?.value;
    if (instrumentNotes) parts.push(`instrument:${instrumentNotes}`);
    
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

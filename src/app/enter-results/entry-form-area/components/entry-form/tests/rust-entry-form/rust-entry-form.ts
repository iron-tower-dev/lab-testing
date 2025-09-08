import { Component, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { BaseTestFormComponent } from '../../../../../../shared/components/base-test-form/base-test-form.component';
import { SharedModule } from '../../../../../../shared-module';

@Component({
  selector: 'app-rust-entry-form',
  standalone: true,
  templateUrl: './rust-entry-form.html',
  styleUrls: ['./rust-entry-form.scss'],
  imports: [
    SharedModule
  ]
})
export class RustEntryForm extends BaseTestFormComponent implements OnInit {
  rustRating = '';
  corrosionLevel = 0;
  showCalculationDetails = true;
  
  override ngOnInit(): void {
    super.ngOnInit();
  }

  protected override initializeForm(): void {
    this.form = this.fb.group({
      // Test parameters
      testTemperature: ['60', [Validators.required, Validators.min(59), Validators.max(61)]],
      testDuration: ['24', [Validators.required, Validators.min(4), Validators.max(72)]],
      waterVolume: ['300', [Validators.required, Validators.min(200), Validators.max(400)]],
      
      // Sample information
      oilVolume: ['300', [Validators.required, Validators.min(200), Validators.max(400)]],
      sampleAppearance: [''],
      emulsionStability: ['Stable'],
      
      // Test rod information
      rodMaterial: ['Polished steel', Validators.required],
      rodDiameter: ['', [Validators.min(5), Validators.max(20)]],
      rodLength: ['', [Validators.min(50), Validators.max(200)]],
      rodPreparation: ['Cleaned and polished'],
      
      // Water quality
      waterType: ['Distilled', Validators.required],
      waterConductivity: ['', [Validators.min(0), Validators.max(10)]],
      waterPH: ['', [Validators.min(6), Validators.max(8)]],
      
      // Visual assessment results
      rustAssessment: ['', Validators.required],
      rustDistribution: [''],
      rustColor: [''],
      rustDensity: [''],
      
      // Quantitative measurements
      weightLossMg: ['', [Validators.min(0), Validators.max(100)]],
      surfaceAreaCm2: ['', [Validators.min(10), Validators.max(500)]],
      
      // Environmental conditions
      roomTemperature: ['', [Validators.min(20), Validators.max(30)]],
      relativeHumidity: ['', [Validators.min(40), Validators.max(80)]],
      
      // Quality control
      blankTest: [false],
      duplicateTest: [false],
      
      // Analyst information
      analystInitials: ['', [Validators.required, Validators.maxLength(5)]],
      
      // Comments
      visualObservations: [''],
      testNotes: [''],
      mainComments: ['']
    });
  }

  protected override setupCalculationWatchers(): void {
    this.form.valueChanges.subscribe(() => {
      this.assessRustRating();
      this.calculateCorrosionLevel();
      this.performCalculation();
    });
  }

  private assessRustRating(): void {
    const assessment = this.form.get('rustAssessment')?.value;
    
    // ASTM D665 rating system
    if (assessment) {
      if (assessment.includes('Pass') || assessment.includes('No rust')) {
        this.rustRating = 'Pass';
      } else if (assessment.includes('Fail') || assessment.includes('rust')) {
        this.rustRating = 'Fail';
      } else {
        this.rustRating = assessment;
      }
    } else {
      this.rustRating = '';
    }
  }

  private calculateCorrosionLevel(): void {
    const weightLoss = this.form.get('weightLossMg')?.value;
    const surfaceArea = this.form.get('surfaceAreaCm2')?.value;
    const duration = this.form.get('testDuration')?.value;
    
    if (weightLoss && surfaceArea && duration) {
      // Corrosion rate in mg/cm²/hr
      this.corrosionLevel = Math.round((weightLoss / surfaceArea / duration) * 1000) / 1000;
    } else {
      this.corrosionLevel = 0;
    }
  }

  protected override extractCalculationValues(): Record<string, number> {
    return {
      temperature: this.form.get('testTemperature')?.value || 60,
      duration: this.form.get('testDuration')?.value || 24,
      weightLoss: this.form.get('weightLossMg')?.value || 0,
      surfaceArea: this.form.get('surfaceAreaCm2')?.value || 0
    };
  }

  // Quality control methods
  isTestConditionsAcceptable(): boolean {
    const temp = this.form.get('testTemperature')?.value;
    const duration = this.form.get('testDuration')?.value;
    return temp && duration && Math.abs(temp - 60) <= 1 && duration >= 4;
  }

  isWaterQualityAcceptable(): boolean {
    const conductivity = this.form.get('waterConductivity')?.value;
    const ph = this.form.get('waterPH')?.value;
    
    if (conductivity !== null && conductivity !== undefined && conductivity > 5) return false;
    if (ph !== null && ph !== undefined && (ph < 6.5 || ph > 7.5)) return false;
    return true;
  }

  showQualityControlChecks(): boolean {
    return !this.isTestConditionsAcceptable() || 
           !this.isWaterQualityAcceptable() ||
           this.rustRating === 'Fail';
  }

  getQualityControlMessage(): string {
    if (!this.isTestConditionsAcceptable()) {
      return 'Test conditions outside specifications (60±1°C, ≥4 hours)';
    }
    if (!this.isWaterQualityAcceptable()) {
      return 'Water quality not suitable - check conductivity and pH';
    }
    if (this.rustRating === 'Fail') {
      return 'Oil failed rust protection test - poor corrosion inhibition';
    }
    return '';
  }

  // Interpretation methods
  getRustProtectionLevel(): string {
    if (this.rustRating === 'Pass') return 'Excellent rust protection';
    if (this.rustRating === 'Fail') return 'Poor rust protection';
    if (this.corrosionLevel <= 0.001) return 'Very good rust protection';
    if (this.corrosionLevel <= 0.005) return 'Good rust protection';
    if (this.corrosionLevel <= 0.01) return 'Moderate rust protection';
    return 'Poor rust protection';
  }

  getMaintenanceRecommendation(): string {
    if (this.rustRating === 'Pass') return 'Oil provides adequate rust protection';
    if (this.rustRating === 'Fail') return 'Consider rust inhibitor additives or oil change';
    if (this.corrosionLevel > 0.01) return 'High corrosion rate - immediate action required';
    return 'Monitor rust protection trend';
  }

  // Visual assessment helpers
  getRustSeverityScale(): string[] {
    return [
      'No rust (Pass)',
      'Trace rust spots',
      'Light rust spots', 
      'Moderate rust spots',
      'Heavy rust (Fail)',
      'Severe rust (Fail)'
    ];
  }

  getRustDistributionOptions(): string[] {
    return [
      'No rust',
      'Isolated spots',
      'Scattered spots',
      'Uniform coverage',
      'Heavy coverage'
    ];
  }

  protected override loadExistingData(): void {
    super.loadExistingData();
    
    if (this.existingReading) {
      this.form.patchValue({
        testTemperature: this.existingReading.value1 || '60',
        testDuration: this.existingReading.value2 || '24',
        weightLossMg: this.existingReading.value3,
        surfaceAreaCm2: this.existingReading.trialCalc,
        rustAssessment: this.existingReading.id1,
        rodMaterial: this.existingReading.id2 || 'Polished steel',
        analystInitials: this.existingReading.id3,
        visualObservations: this.extractFromComments('visual'),
        testNotes: this.extractFromComments('notes')
      });
    } else {
      this.form.patchValue({
        analystInitials: localStorage.getItem('analystInitials') || '',
        testTemperature: '60',
        testDuration: '24',
        waterVolume: '300',
        oilVolume: '300',
        rodMaterial: 'Polished steel',
        waterType: 'Distilled',
        emulsionStability: 'Stable',
        rodPreparation: 'Cleaned and polished'
      });
    }
  }

  protected override createTestReading(isComplete: boolean = false) {
    const baseReading = super.createTestReading(isComplete);
    
    return {
      ...baseReading,
      value1: this.form.get('testTemperature')?.value,
      value2: this.form.get('testDuration')?.value,
      value3: this.form.get('weightLossMg')?.value,
      trialCalc: this.form.get('surfaceAreaCm2')?.value,
      id1: this.form.get('rustAssessment')?.value,
      id2: this.form.get('rodMaterial')?.value,
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
    
    if (this.rustRating) parts.push(`rating:${this.rustRating}`);
    if (this.corrosionLevel > 0) parts.push(`corrosionRate:${this.corrosionLevel}mg/cm2/hr`);
    
    const distribution = this.form.get('rustDistribution')?.value;
    if (distribution) parts.push(`distribution:${distribution}`);
    
    const color = this.form.get('rustColor')?.value;
    if (color) parts.push(`color:${color}`);
    
    const density = this.form.get('rustDensity')?.value;
    if (density) parts.push(`density:${density}`);
    
    const waterType = this.form.get('waterType')?.value;
    if (waterType) parts.push(`water:${waterType}`);
    
    const emulsion = this.form.get('emulsionStability')?.value;
    if (emulsion) parts.push(`emulsion:${emulsion}`);
    
    const visual = this.form.get('visualObservations')?.value;
    if (visual) parts.push(`visual:${visual}`);
    
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

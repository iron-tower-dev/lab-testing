import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { SharedModule } from '../../../../../../shared-module';
import { TestReadingsService } from '../../../../../../shared/services/test-readings.service';
import { TestReading } from '../../../../../../shared/models/test-reading.model';
import { TestSampleInfo } from '../../../../../../../types';

@Component({
  selector: 'app-rust-entry-form',
  standalone: true,
  templateUrl: './rust-entry-form.html',
  styleUrl: './rust-entry-form.css',
  imports: [SharedModule]
})
export class RustEntryForm implements OnInit {
  // Injected services
  private testReadingsService = inject(TestReadingsService);

  // Input signals for test sample info
  testSampleInfo = signal<TestSampleInfo | null>(null);

  // Form input signals - Test parameters
  testTemperature = signal<number>(60);
  testDuration = signal<number>(24);
  waterVolume = signal<number>(300);

  // Sample information
  oilVolume = signal<number>(300);
  sampleAppearance = signal<string>('');
  emulsionStability = signal<string>('Stable');

  // Test rod information
  rodMaterial = signal<string>('Polished steel');
  rodDiameter = signal<number | null>(null);
  rodLength = signal<number | null>(null);
  rodPreparation = signal<string>('Cleaned and polished');

  // Water quality
  waterType = signal<string>('Distilled');
  waterConductivity = signal<number | null>(null);
  waterPH = signal<number | null>(null);

  // Visual assessment results
  rustAssessment = signal<string>('');
  rustDistribution = signal<string>('');
  rustColor = signal<string>('');
  rustDensity = signal<string>('');

  // Quantitative measurements
  weightLossMg = signal<number | null>(null);
  surfaceAreaCm2 = signal<number | null>(null);

  // Environmental conditions
  roomTemperature = signal<number | null>(null);
  relativeHumidity = signal<number | null>(null);

  // Quality control
  blankTest = signal<boolean>(false);
  duplicateTest = signal<boolean>(false);

  // Analyst information
  analystInitials = signal<string>('');

  // Comments
  visualObservations = signal<string>('');
  testNotes = signal<string>('');
  mainComments = signal<string>('');

  // UI state
  loading = signal<boolean>(false);
  saving = signal<boolean>(false);
  saveMessage = signal<string>('');
  showCalculationDetails = signal<boolean>(true);
  
  // Computed signals
  rustRating = computed(() => {
    const assessment = this.rustAssessment();
    if (!assessment) return '';
    
    // ASTM D665 rating system
    if (assessment.includes('Pass') || assessment.includes('No rust')) {
      return 'Pass';
    } else if (assessment.includes('Fail') || assessment.includes('rust')) {
      return 'Fail';
    }
    return assessment;
  });

  corrosionLevel = computed(() => {
    const weightLoss = this.weightLossMg();
    const surfaceArea = this.surfaceAreaCm2();
    const duration = this.testDuration();
    
    if (weightLoss && surfaceArea && duration) {
      // Corrosion rate in mg/cm²/hr
      return Math.round((weightLoss / surfaceArea / duration) * 1000) / 1000;
    }
    return 0;
  });

  // Quality control computed signals
  isTestConditionsAcceptable = computed(() => {
    const temp = this.testTemperature();
    const duration = this.testDuration();
    return Math.abs(temp - 60) <= 1 && duration >= 4;
  });

  isWaterQualityAcceptable = computed(() => {
    const conductivity = this.waterConductivity();
    const ph = this.waterPH();
    
    if (conductivity !== null && conductivity > 5) return false;
    if (ph !== null && (ph < 6.5 || ph > 7.5)) return false;
    return true;
  });

  showQualityControlChecks = computed(() => {
    return !this.isTestConditionsAcceptable() || 
           !this.isWaterQualityAcceptable() ||
           this.rustRating() === 'Fail';
  });

  qualityControlMessage = computed(() => {
    if (!this.isTestConditionsAcceptable()) {
      return 'Test conditions outside specifications (60±1°C, ≥4 hours)';
    }
    if (!this.isWaterQualityAcceptable()) {
      return 'Water quality not suitable - check conductivity and pH';
    }
    if (this.rustRating() === 'Fail') {
      return 'Oil failed rust protection test - poor corrosion inhibition';
    }
    return '';
  });

  rustProtectionLevel = computed(() => {
    const rating = this.rustRating();
    const corrosion = this.corrosionLevel();
    
    if (rating === 'Pass') return 'Excellent rust protection';
    if (rating === 'Fail') return 'Poor rust protection';
    if (corrosion <= 0.001) return 'Very good rust protection';
    if (corrosion <= 0.005) return 'Good rust protection';
    if (corrosion <= 0.01) return 'Moderate rust protection';
    return 'Poor rust protection';
  });

  maintenanceRecommendation = computed(() => {
    const rating = this.rustRating();
    const corrosion = this.corrosionLevel();
    
    if (rating === 'Pass') return 'Oil provides adequate rust protection';
    if (rating === 'Fail') return 'Consider rust inhibitor additives or oil change';
    if (corrosion > 0.01) return 'High corrosion rate - immediate action required';
    return 'Monitor rust protection trend';
  });

  // Form validation
  isFormValid = computed(() => {
    return this.testTemperature() >= 59 && this.testTemperature() <= 61 &&
           this.testDuration() >= 4 && this.testDuration() <= 72 &&
           this.waterVolume() >= 200 && this.waterVolume() <= 400 &&
           this.oilVolume() >= 200 && this.oilVolume() <= 400 &&
           this.rodMaterial().trim() !== '' &&
           this.waterType().trim() !== '' &&
           this.rustAssessment().trim() !== '' &&
           this.analystInitials().trim() !== '' && this.analystInitials().length <= 5;
  });

  ngOnInit(): void {
    this.loadData();
  }

  private async loadData(): Promise<void> {
    this.loading.set(true);
    try {
      const info = this.testSampleInfo();
      if (!info) {
        this.setDefaultValues();
        return;
      }

      const existingReading = await this.testReadingsService
        .getTestReading(info.sampleId, info.testId)
        .toPromise();

      if (existingReading) {
        this.loadFromExistingReading(existingReading);
      } else {
        this.setDefaultValues();
      }
    } catch (error) {
      console.error('Error loading Rust data:', error);
      this.setDefaultValues();
    } finally {
      this.loading.set(false);
    }
  }

  private setDefaultValues(): void {
    const savedInitials = localStorage.getItem('analystInitials') || '';
    this.analystInitials.set(savedInitials);
    this.testTemperature.set(60);
    this.testDuration.set(24);
    this.waterVolume.set(300);
    this.oilVolume.set(300);
    this.rodMaterial.set('Polished steel');
    this.waterType.set('Distilled');
    this.emulsionStability.set('Stable');
    this.rodPreparation.set('Cleaned and polished');
  }

  // Helper methods for dropdowns
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

  private loadFromExistingReading(reading: TestReading): void {
    this.testTemperature.set(reading.value1 || 60);
    this.testDuration.set(reading.value2 || 24);
    this.weightLossMg.set(reading.value3 || null);
    this.surfaceAreaCm2.set(reading.trialCalc || null);
    this.rustAssessment.set(reading.id1 || '');
    this.rodMaterial.set(reading.id2 || 'Polished steel');
    this.analystInitials.set(reading.id3 || '');
    
    if (reading.mainComments) {
      this.visualObservations.set(this.extractFromComments(reading.mainComments, 'visual'));
      this.testNotes.set(this.extractFromComments(reading.mainComments, 'notes'));
    }
  }

  async save(complete: boolean = false): Promise<void> {
    if (!this.isFormValid()) {
      this.saveMessage.set('Please fill in all required fields correctly');
      setTimeout(() => this.saveMessage.set(''), 3000);
      return;
    }

    const info = this.testSampleInfo();
    if (!info) return;

    this.saving.set(true);
    this.saveMessage.set('');

    try {
      // Save analyst initials for future use
      const initials = this.analystInitials();
      if (initials) {
        localStorage.setItem('analystInitials', initials);
      }

      const testReading: Partial<TestReading> = {
        sampleId: info.sampleId,
        testId: info.testId,
        value1: this.testTemperature(),
        value2: this.testDuration(),
        value3: this.weightLossMg(),
        trialCalc: this.surfaceAreaCm2(),
        id1: this.rustAssessment(),
        id2: this.rodMaterial(),
        id3: this.analystInitials(),
        mainComments: this.combineComments(),
        complete: complete
      };

      await this.testReadingsService.saveTestReading(testReading).toPromise();
      
      this.saveMessage.set(complete ? 'Test completed and saved!' : 'Progress saved successfully!');
      setTimeout(() => this.saveMessage.set(''), 3000);
    } catch (error) {
      console.error('Error saving Rust data:', error);
      this.saveMessage.set('Error saving data. Please try again.');
      setTimeout(() => this.saveMessage.set(''), 5000);
    } finally {
      this.saving.set(false);
    }
  }

  clearForm(): void {
    // Reset all form fields
    this.testTemperature.set(60);
    this.testDuration.set(24);
    this.waterVolume.set(300);
    this.oilVolume.set(300);
    this.sampleAppearance.set('');
    this.emulsionStability.set('Stable');
    this.rodMaterial.set('Polished steel');
    this.rodDiameter.set(null);
    this.rodLength.set(null);
    this.rodPreparation.set('Cleaned and polished');
    this.waterType.set('Distilled');
    this.waterConductivity.set(null);
    this.waterPH.set(null);
    this.rustAssessment.set('');
    this.rustDistribution.set('');
    this.rustColor.set('');
    this.rustDensity.set('');
    this.weightLossMg.set(null);
    this.surfaceAreaCm2.set(null);
    this.roomTemperature.set(null);
    this.relativeHumidity.set(null);
    this.blankTest.set(false);
    this.duplicateTest.set(false);
    this.visualObservations.set('');
    this.testNotes.set('');
    this.mainComments.set('');
    // Keep analyst initials
    
    this.saveMessage.set('Form cleared');
    setTimeout(() => this.saveMessage.set(''), 2000);
  }

  private extractFromComments(comments: string, section: string): string {
    if (!comments) return '';
    
    const regex = new RegExp(`${section}:(.+?)(?:\\||$)`, 'i');
    const match = comments.match(regex);
    return match ? match[1].trim() : '';
  }

  private combineComments(): string {
    const parts = [];
    
    const rating = this.rustRating();
    if (rating) parts.push(`rating:${rating}`);
    
    const corrosion = this.corrosionLevel();
    if (corrosion > 0) parts.push(`corrosionRate:${corrosion}mg/cm2/hr`);
    
    const distribution = this.rustDistribution();
    if (distribution) parts.push(`distribution:${distribution}`);
    
    const color = this.rustColor();
    if (color) parts.push(`color:${color}`);
    
    const density = this.rustDensity();
    if (density) parts.push(`density:${density}`);
    
    const waterType = this.waterType();
    if (waterType) parts.push(`water:${waterType}`);
    
    const emulsion = this.emulsionStability();
    if (emulsion) parts.push(`emulsion:${emulsion}`);
    
    const visual = this.visualObservations();
    if (visual) parts.push(`visual:${visual}`);
    
    const notes = this.testNotes();
    if (notes) parts.push(`notes:${notes}`);
    
    const main = this.mainComments();
    if (main) parts.push(`comments:${main}`);
    
    return parts.join(' | ');
  }
}

import { Component, OnInit, signal, computed, effect, inject } from '@angular/core';
import { SharedModule } from '../../../../../../shared-module';
import { TestReadingsService } from '../../../../../../shared/services/test-readings.service';
import { TestReading } from '../../../../../../shared/models/test-reading.model';
import { TestSampleInfo } from '../../../../../../../types';

@Component({
  selector: 'app-rbot-entry-form',
  standalone: true,
  templateUrl: './rbot-entry-form.html',
  styleUrl: './rbot-entry-form.css',
  imports: [SharedModule]
})
export class RbotEntryForm implements OnInit {
  // Injected services
  private testReadingsService = inject(TestReadingsService);

  // Input signals for test sample info
  testSampleInfo = signal<TestSampleInfo | null>(null);

  // Form input signals - Test parameters
  testTemperature = signal<number>(150);
  oxygenPressure = signal<number>(620);
  sampleVolume = signal<number>(50);

  // Catalyst information
  catalystType = signal<string>('Soluble copper');
  catalystAmount = signal<number | null>(null);

  // Time measurements
  initialTime = signal<string>('');
  endTime = signal<string>('');
  totalMinutes = signal<number | null>(null);

  // Pressure readings
  initialPressure = signal<number | null>(null);
  finalPressure = signal<number | null>(null);
  pressureDrop = signal<number | null>(null);

  // Environmental conditions
  roomTemperature = signal<number | null>(null);
  barometricPressure = signal<number | null>(null);

  // Equipment information
  bombId = signal<string>('');
  lastCalibrationDate = signal<string>('');

  // Quality control
  temperatureStability = signal<number | null>(null);
  leakCheck = signal<boolean>(false);

  // Analyst information
  analystInitials = signal<string>('');

  // Comments
  observationNotes = signal<string>('');
  testNotes = signal<string>('');
  mainComments = signal<string>('');

  // UI state
  loading = signal<boolean>(false);
  saving = signal<boolean>(false);
  saveMessage = signal<string>('');
  showCalculationDetails = signal<boolean>(true);

  // Computed signals for calculations
  oxidationLife = computed(() => {
    const minutes = this.totalMinutes();
    return minutes && minutes > 0 ? minutes : 0;
  });

  remainingLife = computed(() => {
    const rbotResult = this.oxidationLife();
    const newOilRbot = 1000; // Typical new oil RBOT time in minutes
    
    if (rbotResult > 0 && newOilRbot > 0) {
      return Math.round((rbotResult / newOilRbot) * 100);
    }
    return 0;
  });

  // Quality control computed signals
  isTemperatureControlAcceptable = computed(() => {
    const testTemp = this.testTemperature();
    const stability = this.temperatureStability();
    return Math.abs(testTemp - 150) <= 0.5 && (!stability || Math.abs(stability) <= 0.5);
  });

  isPressureControlAcceptable = computed(() => {
    const oxygen = this.oxygenPressure();
    return Math.abs(oxygen - 620) <= 10;
  });

  isLeakCheckPassed = computed(() => this.leakCheck());

  isTestValid = computed(() => {
    return this.isTemperatureControlAcceptable() && 
           this.isPressureControlAcceptable() && 
           this.isLeakCheckPassed();
  });

  showQualityControlChecks = computed(() => {
    const life = this.oxidationLife();
    return !this.isTestValid() || life < 100 || life > 2000;
  });

  qualityControlMessage = computed(() => {
    if (!this.isTemperatureControlAcceptable()) {
      return 'Temperature control outside acceptable range (150 ± 0.5°C)';
    }
    if (!this.isPressureControlAcceptable()) {
      return 'Oxygen pressure outside acceptable range (620 ± 10 kPa)';
    }
    if (!this.isLeakCheckPassed()) {
      return 'Leak check failed - verify bomb seal integrity';
    }
    const life = this.oxidationLife();
    if (life < 100) {
      return 'Very low RBOT result - oil severely degraded';
    }
    if (life > 2000) {
      return 'Unusually high RBOT result - verify test conditions';
    }
    return '';
  });

  // Oil condition assessment
  oilCondition = computed(() => {
    const life = this.oxidationLife();
    if (life >= 1000) return 'Excellent';
    if (life >= 700) return 'Good';
    if (life >= 400) return 'Fair';
    if (life >= 200) return 'Poor';
    return 'Critical';
  });

  recommendation = computed(() => {
    const remaining = this.remainingLife();
    if (remaining >= 80) return 'Continue in service';
    if (remaining >= 50) return 'Monitor closely';
    if (remaining >= 25) return 'Plan oil change';
    return 'Change oil immediately';
  });

  // Form validation
  isFormValid = computed(() => {
    return this.testTemperature() >= 149 && this.testTemperature() <= 151 &&
           this.oxygenPressure() >= 610 && this.oxygenPressure() <= 630 &&
           this.sampleVolume() >= 45 && this.sampleVolume() <= 55 &&
           this.catalystType().trim() !== '' &&
           this.catalystAmount() !== null && this.catalystAmount()! >= 0.1 && this.catalystAmount()! <= 2.0 &&
           this.initialTime() !== '' &&
           this.endTime() !== '' &&
           this.totalMinutes() !== null && this.totalMinutes()! >= 1 && this.totalMinutes()! <= 2000 &&
           this.initialPressure() !== null && this.initialPressure()! >= 600 && this.initialPressure()! <= 650 &&
           this.finalPressure() !== null && this.finalPressure()! >= 400 && this.finalPressure()! <= 650 &&
           this.pressureDrop() !== null && this.pressureDrop()! >= 10 && this.pressureDrop()! <= 250 &&
           this.bombId().trim() !== '' &&
           this.analystInitials().trim() !== '' && this.analystInitials().length <= 5;
  });

  constructor() {
    // Effect to auto-calculate total minutes when times change
    effect(() => {
      const initial = this.initialTime();
      const end = this.endTime();
      if (initial && end) {
        this.calculateTotalMinutesFromTimes();
      }
    });

    // Effect to auto-calculate pressure drop when pressures change
    effect(() => {
      const initial = this.initialPressure();
      const final = this.finalPressure();
      if (initial !== null && final !== null) {
        this.calculatePressureDropFromReadings();
      }
    });
  }

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
      console.error('Error loading RBOT data:', error);
      this.setDefaultValues();
    } finally {
      this.loading.set(false);
    }
  }

  private setDefaultValues(): void {
    const savedInitials = localStorage.getItem('analystInitials') || '';
    this.analystInitials.set(savedInitials);
    this.testTemperature.set(150);
    this.oxygenPressure.set(620);
    this.sampleVolume.set(50);
    this.catalystType.set('Soluble copper');
  }

  private loadFromExistingReading(reading: TestReading): void {
    this.totalMinutes.set(reading.value1 || null);
    this.pressureDrop.set(reading.value2 || null);
    this.testTemperature.set(reading.value3 || 150);
    this.oxygenPressure.set(reading.trialCalc || 620);
    this.bombId.set(reading.id1 || '');
    this.catalystAmount.set(reading.id2 ? parseFloat(reading.id2) : null);
    this.analystInitials.set(reading.id3 || '');
    
    if (reading.mainComments) {
      this.observationNotes.set(this.extractFromComments(reading.mainComments, 'observation'));
      this.testNotes.set(this.extractFromComments(reading.mainComments, 'notes'));
    }
  }

  // Time calculation helper
  calculateTotalMinutesFromTimes(): void {
    const initial = this.initialTime();
    const end = this.endTime();
    
    if (initial && end) {
      const startTime = new Date(`1970-01-01T${initial}:00`);
      const endTime = new Date(`1970-01-01T${end}:00`);
      
      let diffMs = endTime.getTime() - startTime.getTime();
      if (diffMs < 0) {
        // Handle case where end time is next day
        diffMs += 24 * 60 * 60 * 1000;
      }
      
      const totalMins = Math.round(diffMs / (1000 * 60));
      this.totalMinutes.set(totalMins);
    }
  }

  calculatePressureDropFromReadings(): void {
    const initial = this.initialPressure();
    const final = this.finalPressure();
    
    if (initial !== null && final !== null) {
      const drop = Math.round((initial - final) * 10) / 10;
      this.pressureDrop.set(drop);
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
        value1: this.totalMinutes(),
        value2: this.pressureDrop(),
        value3: this.testTemperature(),
        trialCalc: this.oxygenPressure(),
        id1: this.bombId(),
        id2: this.catalystAmount()?.toString() || '',
        id3: this.analystInitials(),
        mainComments: this.combineComments(),
        complete: complete
      };

      await this.testReadingsService.saveTestReading(testReading).toPromise();
      
      this.saveMessage.set(complete ? 'Test completed and saved!' : 'Progress saved successfully!');
      setTimeout(() => this.saveMessage.set(''), 3000);
    } catch (error) {
      console.error('Error saving RBOT data:', error);
      this.saveMessage.set('Error saving data. Please try again.');
      setTimeout(() => this.saveMessage.set(''), 5000);
    } finally {
      this.saving.set(false);
    }
  }

  clearForm(): void {
    // Reset all form fields
    this.testTemperature.set(150);
    this.oxygenPressure.set(620);
    this.sampleVolume.set(50);
    this.catalystType.set('Soluble copper');
    this.catalystAmount.set(null);
    this.initialTime.set('');
    this.endTime.set('');
    this.totalMinutes.set(null);
    this.initialPressure.set(null);
    this.finalPressure.set(null);
    this.pressureDrop.set(null);
    this.roomTemperature.set(null);
    this.barometricPressure.set(null);
    this.bombId.set('');
    this.lastCalibrationDate.set('');
    this.temperatureStability.set(null);
    this.leakCheck.set(false);
    this.observationNotes.set('');
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
    
    const catalyst = this.catalystType();
    if (catalyst) parts.push(`catalyst:${catalyst}`);
    
    const volume = this.sampleVolume();
    if (volume) parts.push(`volume:${volume}mL`);
    
    const roomTemp = this.roomTemperature();
    if (roomTemp) parts.push(`roomTemp:${roomTemp}`);
    
    const baroPressure = this.barometricPressure();
    if (baroPressure) parts.push(`baroPressure:${baroPressure}`);
    
    const remaining = this.remainingLife();
    if (remaining > 0) parts.push(`remainingLife:${remaining}%`);
    
    const observation = this.observationNotes();
    if (observation) parts.push(`observation:${observation}`);
    
    const notes = this.testNotes();
    if (notes) parts.push(`notes:${notes}`);
    
    const main = this.mainComments();
    if (main) parts.push(`comments:${main}`);
    
    return parts.join(' | ');
  }
}

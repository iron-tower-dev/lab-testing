import { Component, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { BaseTestFormComponent } from '../../../../../../shared/components/base-test-form/base-test-form.component';
import { SharedModule } from '../../../../../../shared-module';

@Component({
  selector: 'app-ftir-entry-form',
  standalone: true,
  templateUrl: './ftir-entry-form.html',
  styleUrl: './ftir-entry-form.css',
  imports: [
    SharedModule
  ]
})
export class FtirEntryForm extends BaseTestFormComponent implements OnInit {
  showFileUpload = false;
  selectedFiles: File[] = [];
  scanCompleted = false;
  
  override ngOnInit(): void {
    super.ngOnInit();
  }

  protected override initializeForm(): void {
    this.form = this.fb.group({
      // Sample preparation
      samplePreparation: ['Direct scan', Validators.required],
      sampleVolume: ['', [Validators.min(0.1), Validators.max(5)]],
      dilutionRatio: [''],
      
      // Instrument settings
      instrumentId: ['', Validators.required],
      scanResolution: ['4', [Validators.min(1), Validators.max(16)]],
      scanNumber: ['32', [Validators.min(1), Validators.max(128)]],
      wavenumberRange: ['4000-400', Validators.required],
      
      // Analysis results
      waterPeakIntensity: ['', [Validators.min(0), Validators.max(10)]],
      oxidationPeakIntensity: ['', [Validators.min(0), Validators.max(10)]],
      nitrationPeakIntensity: ['', [Validators.min(0), Validators.max(10)]],
      sulfationPeakIntensity: ['', [Validators.min(0), Validators.max(10)]],
      
      // Quality indicators
      baselineDrift: [false],
      peakShift: [false],
      interferences: [false],
      
      // Files and documentation
      spectrumFiles: [''],
      backgroundFile: [''],
      
      // Analyst information
      analystInitials: ['', [Validators.required, Validators.maxLength(5)]],
      analysisDate: ['', Validators.required],
      
      // Comments
      spectralObservations: [''],
      testNotes: [''],
      mainComments: ['']
    });
  }

  protected override setupCalculationWatchers(): void {
    this.form.valueChanges.subscribe(() => {
      this.performCalculation();
    });
  }

  protected override extractCalculationValues(): Record<string, number> {
    return {
      waterIntensity: this.form.get('waterPeakIntensity')?.value || 0,
      oxidationIntensity: this.form.get('oxidationPeakIntensity')?.value || 0,
      nitrationIntensity: this.form.get('nitrationPeakIntensity')?.value || 0,
      sulfationIntensity: this.form.get('sulfationPeakIntensity')?.value || 0
    };
  }

  // File handling methods
  onSpectrumFilesSelected(event: any): void {
    const files = Array.from(event.target.files) as File[];
    this.selectedFiles = files;
    const fileNames = files.map(f => f.name).join(', ');
    this.form.patchValue({ spectrumFiles: fileNames });
  }

  onBackgroundFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.form.patchValue({ backgroundFile: file.name });
    }
  }

  toggleFileUpload(): void {
    this.showFileUpload = !this.showFileUpload;
  }

  // Analysis quality methods
  hasQualityIssues(): boolean {
    return this.form.get('baselineDrift')?.value ||
           this.form.get('peakShift')?.value ||
           this.form.get('interferences')?.value;
  }

  getQualityIssueMessage(): string {
    const issues = [];
    if (this.form.get('baselineDrift')?.value) issues.push('baseline drift detected');
    if (this.form.get('peakShift')?.value) issues.push('peak shift observed');
    if (this.form.get('interferences')?.value) issues.push('spectral interferences present');
    
    return issues.length > 0 ? `Quality issues: ${issues.join(', ')}` : '';
  }

  // Peak intensity validation
  isIntensityValid(peakType: string): boolean {
    const intensity = this.form.get(`${peakType}PeakIntensity`)?.value;
    return intensity !== null && intensity !== undefined && intensity !== '';
  }

  getIntensityLevel(peakType: string): string {
    const intensity = this.form.get(`${peakType}PeakIntensity`)?.value;
    if (!intensity) return 'Not detected';
    
    if (intensity < 1) return 'Low';
    if (intensity < 3) return 'Moderate';
    if (intensity < 6) return 'High';
    return 'Very High';
  }

  // Calculation methods
  getTotalDegradationIndex(): number {
    const oxidation = this.form.get('oxidationPeakIntensity')?.value || 0;
    const nitration = this.form.get('nitrationPeakIntensity')?.value || 0;
    const sulfation = this.form.get('sulfationPeakIntensity')?.value || 0;
    
    return Math.round((oxidation + nitration + sulfation) * 100) / 100;
  }

  protected override loadExistingData(): void {
    super.loadExistingData();
    
    if (this.existingReading) {
      this.form.patchValue({
        waterPeakIntensity: this.existingReading.value1,
        oxidationPeakIntensity: this.existingReading.value2,
        nitrationPeakIntensity: this.existingReading.value3,
        sulfationPeakIntensity: this.existingReading.trialCalc,
        instrumentId: this.existingReading.id1,
        samplePreparation: this.existingReading.id2 || 'Direct scan',
        analystInitials: this.existingReading.id3,
        spectralObservations: this.extractFromComments('spectral'),
        testNotes: this.extractFromComments('notes')
      });
    } else {
      this.form.patchValue({
        analystInitials: localStorage.getItem('analystInitials') || '',
        analysisDate: new Date().toISOString().split('T')[0],
        samplePreparation: 'Direct scan',
        scanResolution: '4',
        scanNumber: '32',
        wavenumberRange: '4000-400'
      });
    }
  }

  protected override createTestReading(isComplete: boolean = false) {
    const baseReading = super.createTestReading(isComplete);
    
    return {
      ...baseReading,
      value1: this.form.get('waterPeakIntensity')?.value,
      value2: this.form.get('oxidationPeakIntensity')?.value,
      value3: this.form.get('nitrationPeakIntensity')?.value,
      trialCalc: this.form.get('sulfationPeakIntensity')?.value,
      id1: this.form.get('instrumentId')?.value,
      id2: this.form.get('samplePreparation')?.value,
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
    
    const resolution = this.form.get('scanResolution')?.value;
    if (resolution) parts.push(`resolution:${resolution}`);
    
    const scans = this.form.get('scanNumber')?.value;
    if (scans) parts.push(`scans:${scans}`);
    
    const range = this.form.get('wavenumberRange')?.value;
    if (range) parts.push(`range:${range}`);
    
    const spectrumFiles = this.form.get('spectrumFiles')?.value;
    if (spectrumFiles) parts.push(`files:${spectrumFiles}`);
    
    const spectralObs = this.form.get('spectralObservations')?.value;
    if (spectralObs) parts.push(`spectral:${spectralObs}`);
    
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

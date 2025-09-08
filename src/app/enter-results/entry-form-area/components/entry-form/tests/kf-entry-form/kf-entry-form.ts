import { Component, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { BaseTestFormComponent } from '../../../../../../shared/components/base-test-form/base-test-form.component';
import { SharedModule } from '../../../../../../shared-module';

@Component({
  selector: 'app-kf-entry-form',
  standalone: true,
  templateUrl: './kf-entry-form.html',
  styleUrls: ['./kf-entry-form.scss'],
  imports: [
    SharedModule
  ]
})
export class KfEntryForm extends BaseTestFormComponent implements OnInit {
  showFileUpload = false;
  selectedFile: File | null = null;
  
  override ngOnInit(): void {
    super.ngOnInit();
  }

  protected override initializeForm(): void {
    this.form = this.fb.group({
      // Trial data
      trial1Result: ['', [Validators.required, Validators.min(0), Validators.max(100)]],
      trial2Result: ['', [Validators.required, Validators.min(0), Validators.max(100)]],
      trial3Result: ['', [Validators.min(0), Validators.max(100)]],
      trial4Result: ['', [Validators.min(0), Validators.max(100)]],
      
      // Test conditions
      analystInitials: ['', [Validators.required, Validators.maxLength(5)]],
      testTemperature: ['25', [Validators.min(20), Validators.max(30)]],
      sampleVolume: ['', [Validators.min(0.1), Validators.max(10)]],
      
      // File upload
      uploadedFileName: [''],
      
      // Comments
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
    const validResults = this.getValidResults();
    if (validResults.length === 0) return {};
    
    const average = validResults.reduce((sum, val) => sum + val, 0) / validResults.length;
    return {
      waterContent: average
    };
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

  getAverageResult(): number {
    const validResults = this.getValidResults();
    if (validResults.length < 2) return 0;
    
    return Math.round((validResults.reduce((sum, val) => sum + val, 0) / validResults.length) * 100) / 100;
  }

  getResultVariation(): number {
    const validResults = this.getValidResults();
    if (validResults.length < 2) return 0;
    
    const max = Math.max(...validResults);
    const min = Math.min(...validResults);
    return Math.round((max - min) * 100) / 100;
  }

  isVariationAcceptable(): boolean {
    return this.getResultVariation() <= 0.05; // 0.05% acceptable variation
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.form.patchValue({ uploadedFileName: file.name });
    }
  }

  toggleFileUpload(): void {
    this.showFileUpload = !this.showFileUpload;
  }

  protected override loadExistingData(): void {
    super.loadExistingData();
    
    if (this.existingReading) {
      this.form.patchValue({
        trial1Result: this.existingReading.value1,
        trial2Result: this.existingReading.value2,
        trial3Result: this.existingReading.value3,
        trial4Result: this.existingReading.trialCalc,
        analystInitials: this.existingReading.id3,
        testTemperature: this.existingReading.id1 || '25',
        testNotes: this.extractFromComments('notes')
      });
    } else {
      this.form.patchValue({
        analystInitials: localStorage.getItem('analystInitials') || '',
        testTemperature: '25'
      });
    }
  }

  protected override createTestReading(isComplete: boolean = false) {
    const baseReading = super.createTestReading(isComplete);
    const average = this.getAverageResult();
    
    return {
      ...baseReading,
      value1: this.form.get('trial1Result')?.value,
      value2: this.form.get('trial2Result')?.value,
      value3: this.form.get('trial3Result')?.value,
      trialCalc: this.form.get('trial4Result')?.value || (average > 0 ? average : null),
      id1: this.form.get('testTemperature')?.value,
      id2: this.form.get('sampleVolume')?.value?.toString(),
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
    
    const fileName = this.form.get('uploadedFileName')?.value;
    if (fileName) parts.push(`file:${fileName}`);
    
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


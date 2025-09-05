import { Component, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { BaseTestFormComponent } from '../../../../../../shared/components/base-test-form/base-test-form.component';
import { SharedModule } from '../../../../../../shared-module';

@Component({
  selector: 'app-gr-pen60-entry-form',
  templateUrl: './gr-pen60-entry-form.html',
  styleUrls: ['./gr-pen60-entry-form.scss'],
  standalone: true,
  imports: [
    SharedModule
  ]
})
export class GrPen60EntryForm extends BaseTestFormComponent implements OnInit {
  averageReading = 0;
  showCalculationDetails = true;

  override ngOnInit(): void {
    super.ngOnInit();
  }

  protected override initializeForm(): void {
    this.form = this.fb.group({
      testTemperature: ['25', Validators.required],
      penetrationTime: ['5', [Validators.required, Validators.min(5), Validators.max(10)]],
      analystInitials: ['', [Validators.required, Validators.maxLength(5)]],
      workedSample: [true],
      cone1: ['', [Validators.required, Validators.min(50), Validators.max(500)]],
      cone2: ['', [Validators.required, Validators.min(50), Validators.max(500)]],
      cone3: ['', [Validators.required, Validators.min(50), Validators.max(500)]],
      penetrometerId: [''],
      lastCalibrationDate: [''],
      sampleAppearance: [''],
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
    const cone1 = this.form.get('cone1')?.value;
    const cone2 = this.form.get('cone2')?.value;
    const cone3 = this.form.get('cone3')?.value;

    if (cone1 && cone2 && cone3) {
      this.averageReading = Math.round((cone1 + cone2 + cone3) / 3);
    } else {
      this.averageReading = 0;
    }
  }

  protected override extractCalculationValues(): Record<string, number> {
    return {
      cone1: this.form.get('cone1')?.value || 0,
      cone2: this.form.get('cone2')?.value || 0,
      cone3: this.form.get('cone3')?.value || 0
    };
  }

  protected override loadExistingData(): void {
    super.loadExistingData();
    
    if (this.existingReading) {
      this.form.patchValue({
        cone1: this.existingReading.value1,
        cone2: this.existingReading.value2,
        cone3: this.existingReading.value3,
        testTemperature: this.existingReading.id1 || '25',
        penetrationTime: this.existingReading.id2 || '5',
        analystInitials: this.existingReading.id3,
        workedSample: this.extractFromComments('worked') === 'true',
        penetrometerId: this.extractFromComments('equip'),
        sampleAppearance: this.extractFromComments('appearance'),
        testNotes: this.extractFromComments('notes')
      });
    } else {
      // Set default values
      this.form.patchValue({
        testTemperature: '25',
        penetrationTime: '5',
        workedSample: true,
        analystInitials: localStorage.getItem('analystInitials') || ''
      });
    }
  }

  protected override createTestReading(isComplete: boolean = false) {
    const baseReading = super.createTestReading(isComplete);
    
    return {
      ...baseReading,
      value1: this.form.get('cone1')?.value,
      value2: this.form.get('cone2')?.value,
      value3: this.form.get('cone3')?.value,
      id1: this.form.get('testTemperature')?.value,
      id2: this.form.get('penetrationTime')?.value,
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
    
    if (this.form.get('workedSample')?.value) {
      parts.push('worked:true');
    }
    
    const equipId = this.form.get('penetrometerId')?.value;
    if (equipId) parts.push(`equip:${equipId}`);
    
    const appearance = this.form.get('sampleAppearance')?.value;
    if (appearance) parts.push(`appearance:${appearance}`);
    
    const notes = this.form.get('testNotes')?.value;
    if (notes) parts.push(`notes:${notes}`);
    
    const main = this.form.get('mainComments')?.value;
    if (main) parts.push(`comments:${main}`);
    
    return parts.join(' | ');
  }

  // Validation methods
  showReadingValidation(): boolean {
    return this.averageReading > 0 && this.hasAllReadings();
  }

  hasAllReadings(): boolean {
    const cone1 = this.form.get('cone1')?.value;
    const cone2 = this.form.get('cone2')?.value;
    const cone3 = this.form.get('cone3')?.value;
    return cone1 && cone2 && cone3;
  }

  isVariationAcceptable(): boolean {
    if (!this.hasAllReadings()) return true;
    
    const variation = this.getReadingVariation();
    return variation <= 10; // Typical acceptable variation
  }

  getReadingVariation(): number {
    if (!this.hasAllReadings()) return 0;
    
    const cone1 = this.form.get('cone1')?.value;
    const cone2 = this.form.get('cone2')?.value;
    const cone3 = this.form.get('cone3')?.value;
    
    const readings = [cone1, cone2, cone3];
    const max = Math.max(...readings);
    const min = Math.min(...readings);
    
    return max - min;
  }

  isRangeReasonable(): boolean {
    return this.averageReading >= 85 && this.averageReading <= 475;
  }

  // NLGI Classification methods
  getNLGIGrade(): string {
    const result = this.calculationResult?.result;
    if (!result) return 'N/A';
    
    if (result >= 445 && result <= 475) return '000';
    if (result >= 400 && result < 445) return '00';
    if (result >= 355 && result < 400) return '0';
    if (result >= 310 && result < 355) return '1';
    if (result >= 265 && result < 310) return '2';
    if (result >= 220 && result < 265) return '3';
    if (result >= 175 && result < 220) return '4';
    if (result >= 130 && result < 175) return '5';
    if (result >= 85 && result < 130) return '6';
    
    return 'Non-standard';
  }

  getPenetrationRange(): string {
    const grade = this.getNLGIGrade();
    const ranges: Record<string, string> = {
      '000': '445-475 mm/10',
      '00': '400-430 mm/10',
      '0': '355-385 mm/10',
      '1': '310-340 mm/10',
      '2': '265-295 mm/10',
      '3': '220-250 mm/10',
      '4': '175-205 mm/10',
      '5': '130-160 mm/10',
      '6': '85-115 mm/10'
    };
    
    return ranges[grade] || 'N/A';
  }

  getConsistencyDescription(): string {
    const grade = this.getNLGIGrade();
    const descriptions: Record<string, string> = {
      '000': 'Very fluid',
      '00': 'Fluid',
      '0': 'Semi-fluid',
      '1': 'Very soft',
      '2': 'Soft (most common)',
      '3': 'Medium',
      '4': 'Hard',
      '5': 'Very hard',
      '6': 'Block grease'
    };
    
    return descriptions[grade] || 'Unknown';
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

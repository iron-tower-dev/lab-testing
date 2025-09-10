import { Component, input, computed } from '@angular/core';
import { TestReference, SampleWithTestInfo } from '../../../enter-results.types';
import { FerrographyEntryForm } from './tests/ferrography-entry-form/ferrography-entry-form';
import { SpectroscopyEntryForm } from './tests/spectroscopy-entry-form/spectroscopy-entry-form';
import { TanEntryForm } from './tests/tan-entry-form/tan-entry-form';
import { KfEntryForm } from './tests/kf-entry-form/kf-entry-form';
import { Vis40EntryForm } from './tests/vis40-entry-form/vis40-entry-form';
import { Vis100EntryForm } from './tests/vis100-entry-form/vis100-entry-form';
import { FtirEntryForm } from './tests/ftir-entry-form/ftir-entry-form';
import { FlashPtEntryForm } from './tests/flash-pt-entry-form/flash-pt-entry-form';
import { TbnEntryForm } from './tests/tbn-entry-form/tbn-entry-form';
import { InspectFilterEntryForm } from './tests/inspect-filter-entry-form/inspect-filter-entry-form';
import { GrPen60EntryForm } from './tests/gr-pen60-entry-form/gr-pen60-entry-form';
import { GrDropPtEntryForm } from './tests/gr-drop-pt-entry-form/gr-drop-pt-entry-form';
import { PcntEntryForm } from './tests/pcnt-entry-form/pcnt-entry-form';
import { RbotEntryForm } from './tests/rbot-entry-form/rbot-entry-form';
import { FltrResEntryForm } from './tests/fltr-res-entry-form/fltr-res-entry-form';
import { RustEntryForm } from './tests/rust-entry-form/rust-entry-form';
import { TfoutEntryForm } from './tests/tfout-entry-form/tfout-entry-form';
import { DebrisIdEntryForm } from './tests/debris-id-entry-form/debris-id-entry-form';
import { DeleteriousEntryForm } from './tests/deleterious-entry-form/deleterious-entry-form';
import { RheometryEntryForm } from './tests/rheometry-entry-form/rheometry-entry-form';
import { DInchEntryForm } from './tests/d-inch-entry-form/d-inch-entry-form';
import { OilContentEntryForm } from './tests/oil-content-entry-form/oil-content-entry-form';
import { VprEntryForm } from './tests/vpr-entry-form/vpr-entry-form';

@Component({
  selector: 'app-entry-form',
  imports: [
    FerrographyEntryForm,
    SpectroscopyEntryForm,
    TanEntryForm,
    KfEntryForm,
    Vis40EntryForm,
    Vis100EntryForm,
    FtirEntryForm,
    FlashPtEntryForm,
    TbnEntryForm,
    InspectFilterEntryForm,
    GrPen60EntryForm,
    GrDropPtEntryForm,
    PcntEntryForm,
    RbotEntryForm,
    FltrResEntryForm,
    RustEntryForm,
    TfoutEntryForm,
    DebrisIdEntryForm,
    DeleteriousEntryForm,
    RheometryEntryForm,
    DInchEntryForm,
    OilContentEntryForm,
    VprEntryForm
  ],
  templateUrl: './entry-form.html',
  styleUrl: './entry-form.scss'
})
export class EntryForm {
  testReference = input<TestReference | null>(null);
  sampleId = input<string | null>(null);
  labCommentsControl = input<any | null>(null);

  // Computed property to determine test code from test reference
  testCode = computed(() => {
    const testRef = this.testReference();
    if (!testRef) return null;
    
    // Map test reference to test code based on established patterns
    // This maintains backward compatibility for existing form components
    const codeMap: Record<number, string> = {
      10: 'TAN',
      20: 'KF', 
      30: 'SpecStd',
      40: 'SpecLrg',
      50: 'Vis40',
      60: 'Vis100',
      70: 'FTIR',
      80: 'FlashPt',
      110: 'TBN',
      120: 'InspectFilter',
      130: 'GrPen60',
      140: 'GrDropPt',
      160: 'Pcnt',
      170: 'RBOT',
      180: 'FltrRes',
      210: 'Ferrography',
      220: 'Rust',
      230: 'TFOUT',
      240: 'DebrisID',
      250: 'Deleterious',
      270: 'Rheometry',
      284: 'DInch',
      285: 'OilContent',
      286: 'VPR'
    };
    
    return codeMap[testRef.id] || null;
  });

  // Create sample data for component inputs
  createSampleWithTestInfo(): SampleWithTestInfo | null {
    const testRef = this.testReference();
    const sampleId = this.sampleId();
    if (!testRef || !sampleId) return null;
    
    return {
      sampleId: parseInt(sampleId) || 0,
      sampleNumber: sampleId,
      testName: testRef.name || 'Unknown Test',
      testReference: testRef,
      eqTagNum: 'EQ-1001',
      component: 'Main Motor',
      location: 'Plant A',
      lubeType: 'ISO VG 46',
      techData: 'Standard analysis procedure',
      qualityClass: 'Premium',
      labComments: ['Standard sample for debris analysis']
    };
  }
}

import { Component, input } from '@angular/core';
import { TestCode } from '../../../enter-results.types';
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
  testCode = input<TestCode | null>(null);
  sampleId = input<string | null>(null);
}

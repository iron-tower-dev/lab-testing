import { Component, OnInit, input, output, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { SharedModule } from '../../../../../../../shared-module';
import { ParticleTypeHeaderComponent } from './particle-type-header.component';
import {
  ParticleTypeDefinition,
  ParticleSubTypeCategory,
  ParticleSubTypeDefinition,
  ParticleSubTypeSelection,
} from '../../../../../../enter-results.types';

@Component({
  selector: 'app-particle-subtype-card',
  imports: [SharedModule, ParticleTypeHeaderComponent],
  template: `
    <mat-card class="particle-subtype-card">
      <!-- Particle Type Header -->
      <app-particle-type-header [particleType]="particleType()"></app-particle-type-header>

      <!-- Collapsible Card Body -->
      <mat-card-content class="card-body">
        <div class="card-actions">
          <button
            mat-button
            (click)="toggleExpanded()"
            class="expand-button"
            [attr.aria-expanded]="isExpanded()"
            aria-label="Toggle particle details"
          >
            <mat-icon>{{ isExpanded() ? 'expand_less' : 'expand_more' }}</mat-icon>
            <span>{{ isExpanded() ? 'Hide' : 'Show' }} Details</span>
          </button>
        </div>

        <div class="collapsible-content" [class.expanded]="isExpanded()">
          <form [formGroup]="subtypeForm" class="subtype-form">
            <div class="form-grid">
              <div
                *ngFor="let category of subtypeCategories(); trackBy: trackByCategory"
                class="form-field"
              >
                <mat-form-field appearance="outline">
                  <mat-label>{{ category.description }}</mat-label>
                  <mat-select [formControlName]="'category_' + category.id">
                    <mat-option [value]="null">-- Select --</mat-option>
                    <mat-option
                      *ngFor="
                        let option of getOptionsForCategory(category.id);
                        trackBy: trackByOption
                      "
                      [value]="option.value"
                    >
                      {{ option.description }}
                    </mat-option>
                  </mat-select>
                </mat-form-field>
              </div>
            </div>

            <!-- Form Actions -->
            <div class="form-actions" *ngIf="isExpanded()">
              <button
                mat-raised-button
                color="primary"
                type="button"
                (click)="onSave()"
                [disabled]="!hasChanges()"
              >
                Save
              </button>

              <button mat-button type="button" (click)="onClear()" [disabled]="!hasValues()">
                Clear
              </button>
            </div>
          </form>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [
    `
      .particle-subtype-card {
        margin-bottom: 16px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .card-body {
        padding: 16px !important;
      }

      .card-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }

      .expand-button {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .collapsible-content {
        max-height: 0;
        overflow: hidden;
        transition: max-height 0.3s ease-out;
      }

      .collapsible-content.expanded {
        max-height: 1000px;
        transition: max-height 0.3s ease-in;
      }

      .subtype-form {
        padding-top: 16px;
      }

      .form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 16px;
        margin-bottom: 24px;
      }

      .form-field {
        width: 100%;
      }

      .form-actions {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
        padding-top: 16px;
        border-top: 1px solid #e0e0e0;
      }

      @media (max-width: 768px) {
        .form-grid {
          grid-template-columns: 1fr;
          gap: 12px;
        }

        .form-actions {
          flex-direction: column;
          align-items: stretch;
        }
      }
    `,
  ],
})
export class ParticleSubtypeCardComponent implements OnInit {
  // Input signals
  particleType = input.required<ParticleTypeDefinition>();
  subtypeCategories = input.required<ParticleSubTypeCategory[]>();
  subtypeDefinitions = input.required<ParticleSubTypeDefinition[]>();
  initialSelections = input<ParticleSubTypeSelection[]>([]);
  readOnly = input<boolean>(false);

  // Output signals
  selectionsChange = output<ParticleSubTypeSelection[]>();

  // Internal state
  isExpanded = signal<boolean>(false);
  subtypeForm!: FormGroup;

  // Computed properties
  hasChanges = computed(() => {
    return this.subtypeForm?.dirty || false;
  });

  hasValues = computed(() => {
    if (!this.subtypeForm) return false;

    return Object.values(this.subtypeForm.value).some(
      (value) => value !== null && value !== undefined,
    );
  });

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadInitialData();

    if (this.readOnly()) {
      this.subtypeForm.disable();
    }
  }

  private initializeForm(): void {
    const formControls: { [key: string]: FormControl } = {};

    // Create form controls for each category
    this.subtypeCategories().forEach((category) => {
      formControls[`category_${category.id}`] = new FormControl(null);
    });

    this.subtypeForm = this.fb.group(formControls);

    // Subscribe to form changes
    this.subtypeForm.valueChanges.subscribe(() => {
      this.emitSelections();
    });
  }

  private loadInitialData(): void {
    const selections = this.initialSelections();

    selections.forEach((selection) => {
      const controlName = `category_${selection.categoryId}`;
      const control = this.subtypeForm.get(controlName);

      if (control) {
        control.setValue(selection.selectedValue);
      }
    });

    // Mark form as pristine after loading initial data
    this.subtypeForm.markAsPristine();
  }

  toggleExpanded(): void {
    this.isExpanded.update((expanded) => !expanded);
  }

  getOptionsForCategory(categoryId: number): ParticleSubTypeDefinition[] {
    return this.subtypeDefinitions()
      .filter((def) => def.particleSubTypeCategoryId === categoryId && def.active === '1')
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }

  onSave(): void {
    if (this.subtypeForm.valid) {
      this.subtypeForm.markAsPristine();
      this.emitSelections();
    }
  }

  onClear(): void {
    this.subtypeForm.reset();
    Object.keys(this.subtypeForm.controls).forEach((key) => {
      this.subtypeForm.get(key)?.setValue(null);
    });
    this.emitSelections();
  }

  private emitSelections(): void {
    const selections: ParticleSubTypeSelection[] = [];

    this.subtypeCategories().forEach((category) => {
      const controlName = `category_${category.id}`;
      const value = this.subtypeForm.get(controlName)?.value;

      selections.push({
        categoryId: category.id,
        selectedValue: value,
      });
    });

    this.selectionsChange.emit(selections);
  }

  // TrackBy functions for performance
  trackByCategory(index: number, category: ParticleSubTypeCategory): number {
    return category.id;
  }

  trackByOption(index: number, option: ParticleSubTypeDefinition): string {
    return `${option.particleSubTypeCategoryId}_${option.value}`;
  }
}

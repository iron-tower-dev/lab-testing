import { Component, input, output, inject } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { SharedModule } from '../../../../../../../shared-module';
import {
  FerrographyHeat,
  FerrographyConcentration,
  FerrographySize,
  FerrographyColor,
  FerrographyTexture,
  FerrographyComposition,
  FerrographySeverity,
  ParticleTypeDefinition,
} from '../../../../../../enter-results.types';
import { ParticleImageModalComponent, ParticleImageModalData } from './particle-image-modal.component';

@Component({
  selector: 'app-particle-type-card',
  imports: [SharedModule],
  template: `
    <div
      class="particle-type-card"
      [class.selected]="particleForm().get('isSelected')?.value"
      [class.visible]="isVisible()"
    >
      <!-- Integrated Particle Type Header -->
      <div class="particle-type-header">
        <!-- Database info when available -->
        <div *ngIf="particleTypeDefinition(); else fallbackHeader" class="database-header">
          <!-- Title and description - full width -->
          <div class="header-text">
            <h3 class="particle-type-title">{{ particleTypeDefinition()!.type }}</h3>
            <p class="particle-description">{{ particleTypeDefinition()!.description }}</p>
          </div>

          <!-- Images and controls row -->
          <div class="header-actions-row">
            <div
              class="particle-images"
              *ngIf="particleTypeDefinition()!.image1 || particleTypeDefinition()!.image2"
            >
              <div class="image-container" *ngIf="particleTypeDefinition()!.image1">
                <img
                  [src]="getImageUrl(particleTypeDefinition()!.image1)"
                  [alt]="particleTypeDefinition()!.type + ' - Image 1'"
                  class="particle-image clickable"
                  (click)="openImageModal(particleTypeDefinition()!.image1, particleTypeDefinition()!.type + ' - Image 1')"
                  matTooltip="Click to view larger image"
                />
                <span class="image-caption">Image 1</span>
              </div>

              <div class="image-container" *ngIf="particleTypeDefinition()!.image2">
                <img
                  [src]="getImageUrl(particleTypeDefinition()!.image2)"
                  [alt]="particleTypeDefinition()!.type + ' - Image 2'"
                  class="particle-image clickable"
                  (click)="openImageModal(particleTypeDefinition()!.image2, particleTypeDefinition()!.type + ' - Image 2')"
                  matTooltip="Click to view larger image"
                />
                <span class="image-caption">Image 2</span>
              </div>
            </div>

            <div class="particle-type-controls">
              <!-- Selection checkbox for Review mode -->
              <mat-checkbox
                [checked]="particleForm().get('isSelected')?.value"
                (change)="onSelectionToggle()"
                [disabled]="readOnly()"
                matTooltip="Include in Review mode"
              >
              </mat-checkbox>

              <!-- Show/Hide toggle -->
              <button
                mat-icon-button
                [color]="particleForm().get('isVisible')?.value ? 'primary' : 'basic'"
                (click)="onVisibilityToggle()"
                [disabled]="readOnly()"
                [matTooltip]="
                  particleForm().get('isVisible')?.value ? 'Hide entry form' : 'Show entry form'
                "
              >
                <mat-icon>{{
                  particleForm().get('isVisible')?.value ? 'visibility_off' : 'visibility'
                }}</mat-icon>
              </button>
            </div>
          </div>
        </div>

        <!-- Fallback header template -->
        <ng-template #fallbackHeader>
          <div class="fallback-header">
            <!-- Title and description - full width -->
            <div class="header-text">
              <h3 class="particle-type-title">{{ particleType() }}</h3>
              <p class="no-database-info">No database information available</p>
            </div>

            <!-- Controls row -->
            <div class="header-actions-row">
              <div class="particle-type-controls">
                <!-- Selection checkbox for Review mode -->
                <mat-checkbox
                  [checked]="particleForm().get('isSelected')?.value"
                  (change)="onSelectionToggle()"
                  [disabled]="readOnly()"
                  matTooltip="Include in Review mode"
                >
                </mat-checkbox>

                <!-- Show/Hide toggle -->
                <button
                  mat-icon-button
                  [color]="particleForm().get('isVisible')?.value ? 'primary' : 'basic'"
                  (click)="onVisibilityToggle()"
                  [disabled]="readOnly()"
                  [matTooltip]="
                    particleForm().get('isVisible')?.value ? 'Hide entry form' : 'Show entry form'
                  "
                >
                  <mat-icon>{{
                    particleForm().get('isVisible')?.value ? 'visibility_off' : 'visibility'
                  }}</mat-icon>
                </button>
              </div>
            </div>
          </div>
        </ng-template>
      </div>

      <!-- Evaluated Severity Display -->
      <div class="evaluated-severity" *ngIf="particleForm().get('severity')?.value">
        <mat-icon color="accent">assessment</mat-icon>
        <span>Severity: {{ particleForm().get('severity')?.value }}</span>
      </div>

      <!-- Particle Type Entry Form -->
      <div
        class="particle-type-entry-form"
        *ngIf="particleForm().get('isVisible')?.value && isVisible()"
        [formGroup]="particleForm()"
      >
        <!-- Heat -->
        <mat-form-field appearance="outline">
          <mat-label>Heat</mat-label>
          <mat-select formControlName="heat">
            <mat-option *ngFor="let option of heatOptions()" [value]="option">
              {{ option }}
            </mat-option>
          </mat-select>
        </mat-form-field>

        <!-- Concentration -->
        <mat-form-field appearance="outline">
          <mat-label>Concentration</mat-label>
          <mat-select formControlName="concentration">
            <mat-option *ngFor="let option of concentrationOptions()" [value]="option">
              {{ option }}
            </mat-option>
          </mat-select>
        </mat-form-field>

        <!-- Size Average -->
        <mat-form-field appearance="outline">
          <mat-label>Size, Avg</mat-label>
          <mat-select formControlName="sizeAvg">
            <mat-option *ngFor="let option of sizeOptions()" [value]="option">
              {{ option }}
            </mat-option>
          </mat-select>
        </mat-form-field>

        <!-- Size Maximum -->
        <mat-form-field appearance="outline">
          <mat-label>Size, Max</mat-label>
          <mat-select formControlName="sizeMax">
            <mat-option *ngFor="let option of sizeOptions()" [value]="option">
              {{ option }}
            </mat-option>
          </mat-select>
        </mat-form-field>

        <!-- Color -->
        <mat-form-field appearance="outline">
          <mat-label>Color</mat-label>
          <mat-select formControlName="color">
            <mat-option *ngFor="let option of colorOptions()" [value]="option">
              {{ option }}
            </mat-option>
          </mat-select>
        </mat-form-field>

        <!-- Texture -->
        <mat-form-field appearance="outline">
          <mat-label>Texture</mat-label>
          <mat-select formControlName="texture">
            <mat-option *ngFor="let option of textureOptions()" [value]="option">
              {{ option }}
            </mat-option>
          </mat-select>
        </mat-form-field>

        <!-- Composition -->
        <mat-form-field appearance="outline">
          <mat-label>Composition</mat-label>
          <mat-select formControlName="composition">
            <mat-option *ngFor="let option of compositionOptions()" [value]="option">
              {{ option }}
            </mat-option>
          </mat-select>
        </mat-form-field>

        <!-- Severity -->
        <mat-form-field appearance="outline">
          <mat-label>Severity</mat-label>
          <mat-select formControlName="severity">
            <mat-option *ngFor="let option of severityOptions()" [value]="option">
              {{ option }}
            </mat-option>
          </mat-select>
        </mat-form-field>

        <!-- Comments for this particle type -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Comments</mat-label>
          <textarea
            matInput
            formControlName="comments"
            rows="2"
            placeholder="Enter comments specific to this particle type..."
          >
          </textarea>
        </mat-form-field>

        <!-- Add comments to overall -->
        <div class="comment-actions">
          <mat-checkbox formControlName="includeCommentsInOverall">
            Include comments in overall
          </mat-checkbox>

          <button
            mat-raised-button
            color="accent"
            size="small"
            type="button"
            (click)="onAddCommentToOverall()"
            [disabled]="
              !particleForm().get('comments')?.value ||
              !particleForm().get('includeCommentsInOverall')?.value ||
              readOnly()
            "
          >
            <mat-icon>add_comment</mat-icon>
            Add to Overall
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .particle-type-card {
        border: 1px solid #e0e0e0;
        border-radius: 6px; /* Smaller radius */
        padding: 12px; /* Reduced from 16px */
        margin-bottom: 8px; /* Reduced from 16px */
        background: #fff;
        transition: all 0.3s ease;
        position: relative;
        height: fit-content; /* Prevent cards from stretching unnecessarily */
      }

      .particle-type-card.selected {
        border-color: #3f51b5;
        box-shadow: 0 2px 8px rgba(63, 81, 181, 0.2);
      }

      .particle-type-card:not(.visible) {
        opacity: 0.6;
        background: #f8f9fa;
      }

      .particle-type-header {
        background-color: #f8f9fa;
        border-bottom: 1px solid #dee2e6;
        margin: -12px -12px 12px -12px; /* Adjusted for smaller card padding */
        padding: 12px; /* Reduced from 16px */
        border-radius: 6px 6px 0 0; /* Match card radius */
      }

      .database-header,
      .fallback-header {
        display: flex;
        flex-direction: column;
        gap: 8px; /* Slightly reduced for more compact layout */
      }

      .header-text {
        width: 100%;
      }

      .header-actions-row {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 20px; /* Slightly increased for better spacing in full-width cards */
        min-height: 40px; /* Ensure consistent height */
      }

      .particle-type-title {
        margin: 0 0 8px 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: #2c3e50;
      }

      .particle-description {
        margin: 0;
        line-height: 1.5;
        color: #495057;
        font-size: 0.9rem;
      }

      .no-database-info {
        margin: 8px 0 0 0;
        color: #6c757d;
        font-style: italic;
        font-size: 0.85rem;
      }

      .particle-images {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }

      .image-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
      }

      .particle-image {
        max-width: 80px;
        max-height: 80px;
        border-radius: 4px;
        border: 1px solid #dee2e6;
        object-fit: contain;
        transition: all 0.2s ease;
      }

      .particle-image.clickable {
        cursor: pointer;
      }

      .particle-image.clickable:hover {
        transform: scale(1.05);
        border-color: #2196f3;
        box-shadow: 0 2px 8px rgba(33, 150, 243, 0.3);
      }

      .image-caption {
        font-size: 0.7rem;
        color: #6c757d;
        text-align: center;
      }

      .particle-type-controls {
        display: flex;
        gap: 8px;
        align-items: center;
        flex-shrink: 0;
      }

      .evaluated-severity {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 16px;
        padding: 8px 12px;
        background: #f3e5f5;
        border-radius: 4px;
        border-left: 4px solid #9c27b0;
      }

      .evaluated-severity span {
        font-weight: 500;
        color: #6a1b9a;
      }

      .particle-type-entry-form {
        display: grid;
        gap: 12px; /* Reduced from 16px */
        margin-top: 12px; /* Reduced from 16px */
        
        /* Responsive grid to make use of full card width */
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); /* Slightly larger minimum for readability */
        
        /* Use more columns for better space utilization since cards are full width */
        @media (min-width: 768px) {
          grid-template-columns: repeat(4, 1fr); /* 4 columns on tablet+ */
        }
        
        @media (min-width: 1024px) {
          grid-template-columns: repeat(6, 1fr); /* 6 columns on desktop */
        }
        
        @media (min-width: 1400px) {
          grid-template-columns: repeat(8, 1fr); /* 8 columns on large screens for maximum space usage */
        }
      }

      .full-width {
        grid-column: 1 / -1;
      }

      .comment-actions {
        grid-column: 1 / -1;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: 12px; /* Reduced from 16px */
        margin-top: 8px;
        border-top: 1px solid #e0e0e0;
      }

      @media (max-width: 768px) {
        .header-actions-row {
          flex-direction: column;
          gap: 12px;
          align-items: center;
        }

        .particle-images {
          justify-content: center;
        }

        .particle-image {
          max-width: 60px;
          max-height: 60px;
        }

        .particle-type-entry-form {
          grid-template-columns: repeat(2, 1fr); /* 2 columns on mobile for better space usage */
        }

        .comment-actions {
          flex-direction: column;
          align-items: stretch;
          gap: 12px;
        }
      }
    `,
  ],
})
export class ParticleTypeCardComponent {
  private dialog = inject(MatDialog);

  // Input signals
  particleType = input.required<string>();
  particleTypeDefinition = input<ParticleTypeDefinition | null>(null);
  particleForm = input.required<FormGroup>();
  isVisible = input<boolean>(true);
  readOnly = input<boolean>(false);

  // Options inputs
  heatOptions = input.required<FerrographyHeat[]>();
  concentrationOptions = input.required<FerrographyConcentration[]>();
  sizeOptions = input.required<FerrographySize[]>();
  colorOptions = input.required<FerrographyColor[]>();
  textureOptions = input.required<FerrographyTexture[]>();
  compositionOptions = input.required<FerrographyComposition[]>();
  severityOptions = input.required<FerrographySeverity[]>();

  // Output signals
  selectionToggle = output<string>();
  visibilityToggle = output<string>();
  addCommentToOverall = output<string>();

  onSelectionToggle(): void {
    this.selectionToggle.emit(this.particleType());
  }

  onVisibilityToggle(): void {
    this.visibilityToggle.emit(this.particleType());
  }

  onAddCommentToOverall(): void {
    this.addCommentToOverall.emit(this.particleType());
  }

  /**
   * Convert JPG image filename to SVG and return full asset path
   */
  getImageUrl(originalFilename: string): string {
    if (!originalFilename) {
      return '';
    }
    // Replace .jpg extension with .svg
    const svgFilename = originalFilename.replace(/\.jpg$/i, '.svg');
    return `/assets/particle-images/${svgFilename}`;
  }

  /**
   * Open image in modal dialog
   */
  openImageModal(originalFilename: string, altText: string): void {
    if (!originalFilename || this.readOnly()) {
      return;
    }

    const imageUrl = this.getImageUrl(originalFilename);
    const particleDefinition = this.particleTypeDefinition();
    
    const dialogData: ParticleImageModalData = {
      imageUrl,
      title: altText,
      description: particleDefinition?.description,
      altText
    };

    this.dialog.open(ParticleImageModalComponent, {
      data: dialogData,
      maxWidth: '90vw',
      maxHeight: '90vh',
      width: '800px',
      panelClass: 'particle-image-modal-dialog',
      autoFocus: false,
      restoreFocus: true
    });
  }
}

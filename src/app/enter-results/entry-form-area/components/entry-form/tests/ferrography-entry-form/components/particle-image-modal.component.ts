import { Component, input, output, inject } from '@angular/core';
import { SharedModule } from '../../../../../../../shared-module';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface ParticleImageModalData {
  imageUrl: string;
  title: string;
  description?: string;
  altText: string;
}

@Component({
  selector: 'app-particle-image-modal',
  imports: [SharedModule],
  template: `
    <div class="particle-image-modal">
      <!-- Modal Header -->
      <div mat-dialog-title class="modal-header">
        <div class="header-content">
          <h2>{{ data.title }}</h2>
          <p *ngIf="data.description" class="description">{{ data.description }}</p>
        </div>
        <button
          mat-icon-button
          class="close-button"
          (click)="close()"
          matTooltip="Close"
        >
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Modal Content -->
      <div mat-dialog-content class="modal-content">
        <div class="image-container">
          <img
            [src]="data.imageUrl"
            [alt]="data.altText"
            class="particle-image"
            (load)="onImageLoad()"
            (error)="onImageError()"
          />
          
          <!-- Loading state -->
          <div *ngIf="isLoading" class="loading-overlay">
            <mat-spinner diameter="40"></mat-spinner>
            <p>Loading image...</p>
          </div>

          <!-- Error state -->
          <div *ngIf="hasError" class="error-overlay">
            <mat-icon color="warn">broken_image</mat-icon>
            <p>Failed to load image</p>
            <button mat-raised-button color="accent" (click)="retryLoad()">
              <mat-icon>refresh</mat-icon>
              Retry
            </button>
          </div>
        </div>
      </div>

      <!-- Modal Actions -->
      <div mat-dialog-actions class="modal-actions">
        <button mat-stroked-button (click)="close()">
          <mat-icon>close</mat-icon>
          Close
        </button>
        
        <button mat-raised-button color="primary" (click)="openInNewTab()">
          <mat-icon>open_in_new</mat-icon>
          Open in New Tab
        </button>
        
        <button mat-raised-button color="accent" (click)="downloadImage()">
          <mat-icon>download</mat-icon>
          Download
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .particle-image-modal {
        width: 100%;
        max-width: 800px;
        margin: 0 auto;
      }

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 16px;
        padding: 16px 0;
        border-bottom: 1px solid #e0e0e0;
      }

      .header-content {
        flex: 1;
      }

      .header-content h2 {
        margin: 0 0 8px 0;
        font-size: 1.5rem;
        font-weight: 600;
        color: #2c3e50;
      }

      .description {
        margin: 0;
        color: #666;
        line-height: 1.4;
      }

      .close-button {
        flex-shrink: 0;
      }

      .modal-content {
        padding: 24px 0;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 300px;
      }

      .image-container {
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        max-width: 600px;
        background-color: #f8f9fa;
        border-radius: 8px;
        border: 1px solid #dee2e6;
        overflow: hidden;
      }

      .particle-image {
        max-width: 100%;
        max-height: 500px;
        width: auto;
        height: auto;
        object-fit: contain;
        display: block;
        border-radius: 8px;
      }

      .loading-overlay,
      .error-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 16px;
        background-color: rgba(248, 249, 250, 0.95);
        backdrop-filter: blur(2px);
      }

      .loading-overlay p,
      .error-overlay p {
        margin: 0;
        color: #666;
        font-size: 0.9rem;
      }

      .error-overlay mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
      }

      .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        padding: 16px 0 0 0;
        border-top: 1px solid #e0e0e0;
      }

      .modal-actions button {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      /* Responsive design */
      @media (max-width: 768px) {
        .particle-image-modal {
          max-width: 95vw;
        }

        .modal-header {
          flex-direction: column;
          gap: 12px;
        }

        .close-button {
          align-self: flex-end;
        }

        .header-content h2 {
          font-size: 1.25rem;
        }

        .modal-content {
          padding: 16px 0;
          min-height: 200px;
        }

        .particle-image {
          max-height: 300px;
        }

        .modal-actions {
          flex-direction: column;
          gap: 8px;
        }

        .modal-actions button {
          width: 100%;
          justify-content: center;
        }
      }

      /* High contrast mode support */
      @media (prefers-contrast: high) {
        .modal-header,
        .modal-actions {
          border-color: #000;
        }

        .image-container {
          border-color: #000;
          border-width: 2px;
        }
      }

      /* Animation */
      .particle-image {
        transition: opacity 0.3s ease;
      }

      .loading-overlay,
      .error-overlay {
        animation: fadeIn 0.2s ease;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
    `,
  ],
})
export class ParticleImageModalComponent {
  data = inject<ParticleImageModalData>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<ParticleImageModalComponent>);

  isLoading = true;
  hasError = false;

  onImageLoad(): void {
    this.isLoading = false;
    this.hasError = false;
  }

  onImageError(): void {
    this.isLoading = false;
    this.hasError = true;
  }

  retryLoad(): void {
    this.isLoading = true;
    this.hasError = false;
    // Force image reload by updating src with cache buster
    const img = document.querySelector('.particle-image') as HTMLImageElement;
    if (img) {
      const originalSrc = this.data.imageUrl;
      img.src = originalSrc + '?t=' + Date.now();
    }
  }

  close(): void {
    this.dialogRef.close();
  }

  openInNewTab(): void {
    window.open(this.data.imageUrl, '_blank');
  }

  downloadImage(): void {
    const link = document.createElement('a');
    link.href = this.data.imageUrl;
    link.download = this.getImageFilename();
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private getImageFilename(): string {
    const url = this.data.imageUrl;
    const filename = url.split('/').pop() || 'particle-image';
    return filename;
  }
}

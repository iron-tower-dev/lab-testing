import { Component, input } from '@angular/core';
import { SharedModule } from '../../../../../../../shared-module';
import { ParticleTypeDefinition } from '../../../../../../enter-results.types';

@Component({
  selector: 'app-particle-type-header',
  imports: [SharedModule],
  template: `
    <div class="particle-header">
      <div class="particle-header-content">
        <h3 class="particle-type-title">{{ particleType().type }}</h3>
        <p class="particle-description">{{ particleType().description }}</p>
        
        <div class="particle-images" *ngIf="particleType().image1 || particleType().image2">
          <div class="image-container" *ngIf="particleType().image1">
            <img 
              [src]="'/assets/particle-images/' + particleType().image1" 
              [alt]="particleType().type + ' - Image 1'"
              class="particle-image"
            >
            <span class="image-caption">Image 1</span>
          </div>
          
          <div class="image-container" *ngIf="particleType().image2">
            <img 
              [src]="'/assets/particle-images/' + particleType().image2" 
              [alt]="particleType().type + ' - Image 2'"
              class="particle-image"
            >
            <span class="image-caption">Image 2</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .particle-header {
      padding: 16px;
      background-color: #f8f9fa;
      border-bottom: 1px solid #dee2e6;
    }
    
    .particle-header-content {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .particle-type-title {
      margin: 0;
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
    
    .particle-images {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }
    
    .image-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }
    
    .particle-image {
      max-width: 120px;
      max-height: 120px;
      border-radius: 4px;
      border: 1px solid #dee2e6;
      object-fit: contain;
    }
    
    .image-caption {
      font-size: 0.75rem;
      color: #6c757d;
      text-align: center;
    }
    
    @media (max-width: 768px) {
      .particle-header {
        padding: 12px;
      }
      
      .particle-images {
        justify-content: center;
      }
      
      .particle-image {
        max-width: 100px;
        max-height: 100px;
      }
    }
  `]
})
export class ParticleTypeHeaderComponent {
  // Input signal for particle type data
  particleType = input.required<ParticleTypeDefinition>();
}

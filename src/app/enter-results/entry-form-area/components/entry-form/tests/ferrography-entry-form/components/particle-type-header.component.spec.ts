import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ParticleTypeHeaderComponent } from './particle-type-header.component';
import { ParticleTypeDefinition } from '../../../../../../enter-results.types';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SharedModule } from '../../../../../../../shared-module';

describe('ParticleTypeHeaderComponent', () => {
  let component: ParticleTypeHeaderComponent;
  let fixture: ComponentFixture<ParticleTypeHeaderComponent>;

  const mockParticleType: ParticleTypeDefinition = {
    id: 1,
    type: 'Rubbing Wear (Platelet)',
    description: 'Free metal particles with smooth surfaces. (hints: a] -- any shape with exception of curved or curled are rubbing wear particles. b] -- less than 15 micron )',
    image1: 'rwp1.jpg',
    image2: 'rwp2.jpg',
    active: '1',
    sortOrder: 0
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ParticleTypeHeaderComponent,
        SharedModule,
        NoopAnimationsModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ParticleTypeHeaderComponent);
    component = fixture.componentInstance;
    
    // Set required input
    fixture.componentRef.setInput('particleType', mockParticleType);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display particle type title', () => {
    const titleElement = fixture.nativeElement.querySelector('.particle-type-title');
    expect(titleElement.textContent.trim()).toBe(mockParticleType.type);
  });

  it('should display particle description', () => {
    const descriptionElement = fixture.nativeElement.querySelector('.particle-description');
    expect(descriptionElement.textContent.trim()).toBe(mockParticleType.description);
  });

  it('should display images when provided', () => {
    const imageContainers = fixture.nativeElement.querySelectorAll('.image-container');
    expect(imageContainers.length).toBe(2);

    const firstImage = imageContainers[0].querySelector('img');
    const secondImage = imageContainers[1].querySelector('img');
    
    expect(firstImage.src).toContain(mockParticleType.image1);
    expect(secondImage.src).toContain(mockParticleType.image2);
  });

  it('should not display images section when no images provided', () => {
    const particleTypeWithoutImages: ParticleTypeDefinition = {
      ...mockParticleType,
      image1: '',
      image2: ''
    };

    fixture.componentRef.setInput('particleType', particleTypeWithoutImages);
    fixture.detectChanges();

    const imagesSection = fixture.nativeElement.querySelector('.particle-images');
    expect(imagesSection).toBeFalsy();
  });

  it('should display only one image when only image1 is provided', () => {
    const particleTypeWithOneImage: ParticleTypeDefinition = {
      ...mockParticleType,
      image2: ''
    };

    fixture.componentRef.setInput('particleType', particleTypeWithOneImage);
    fixture.detectChanges();

    const imageContainers = fixture.nativeElement.querySelectorAll('.image-container');
    expect(imageContainers.length).toBe(1);
    
    const image = imageContainers[0].querySelector('img');
    expect(image.src).toContain(mockParticleType.image1);
  });
});

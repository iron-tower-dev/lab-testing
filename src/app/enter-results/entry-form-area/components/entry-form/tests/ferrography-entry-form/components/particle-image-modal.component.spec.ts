import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SharedModule } from '../../../../../../../shared-module';
import { ParticleImageModalComponent, ParticleImageModalData } from './particle-image-modal.component';

describe('ParticleImageModalComponent', () => {
  let component: ParticleImageModalComponent;
  let fixture: ComponentFixture<ParticleImageModalComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<ParticleImageModalComponent>>;
  
  const mockDialogData: ParticleImageModalData = {
    imageUrl: '/assets/particle-images/rwp1.svg',
    title: 'Rubbing Wear Platelet - Image 1',
    description: 'Free metal particles with smooth surfaces.',
    altText: 'Rubbing Wear Platelet - Image 1'
  };

  beforeEach(async () => {
    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [
        ParticleImageModalComponent,
        SharedModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: MatDialogRef, useValue: dialogRefSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ParticleImageModalComponent);
    component = fixture.componentInstance;
    mockDialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<ParticleImageModalComponent>>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display modal header with title and description', () => {
    const titleElement = fixture.nativeElement.querySelector('.header-content h2');
    const descriptionElement = fixture.nativeElement.querySelector('.description');
    
    expect(titleElement.textContent.trim()).toBe(mockDialogData.title);
    expect(descriptionElement.textContent.trim()).toBe(mockDialogData.description);
  });

  it('should display image with correct src and alt attributes', () => {
    const imageElement = fixture.nativeElement.querySelector('.particle-image');
    
    expect(imageElement.src).toBe('http://localhost:9876' + mockDialogData.imageUrl);
    expect(imageElement.alt).toBe(mockDialogData.altText);
  });

  it('should show loading state initially', () => {
    const loadingOverlay = fixture.nativeElement.querySelector('.loading-overlay');
    
    expect(component.isLoading).toBe(true);
    expect(loadingOverlay).toBeTruthy();
  });

  it('should hide loading state when image loads', () => {
    const imageElement = fixture.nativeElement.querySelector('.particle-image');
    
    // Simulate image load event
    imageElement.dispatchEvent(new Event('load'));
    fixture.detectChanges();
    
    expect(component.isLoading).toBe(false);
    expect(component.hasError).toBe(false);
    
    const loadingOverlay = fixture.nativeElement.querySelector('.loading-overlay');
    expect(loadingOverlay).toBeFalsy();
  });

  it('should show error state when image fails to load', () => {
    const imageElement = fixture.nativeElement.querySelector('.particle-image');
    
    // Simulate image error event
    imageElement.dispatchEvent(new Event('error'));
    fixture.detectChanges();
    
    expect(component.isLoading).toBe(false);
    expect(component.hasError).toBe(true);
    
    const errorOverlay = fixture.nativeElement.querySelector('.error-overlay');
    expect(errorOverlay).toBeTruthy();
  });

  it('should display action buttons', () => {
    const closeButton = fixture.nativeElement.querySelector('button[mat-stroked-button]');
    const openInNewTabButton = fixture.nativeElement.querySelector('button[color="primary"]');
    const downloadButton = fixture.nativeElement.querySelector('button[color="accent"]');
    
    expect(closeButton).toBeTruthy();
    expect(closeButton.textContent).toContain('Close');
    
    expect(openInNewTabButton).toBeTruthy();
    expect(openInNewTabButton.textContent).toContain('Open in New Tab');
    
    expect(downloadButton).toBeTruthy();
    expect(downloadButton.textContent).toContain('Download');
  });

  it('should close dialog when close button is clicked', () => {
    const closeButton = fixture.nativeElement.querySelector('button[mat-stroked-button]');
    
    closeButton.click();
    
    expect(mockDialogRef.close).toHaveBeenCalled();
  });

  it('should close dialog when header close button is clicked', () => {
    const headerCloseButton = fixture.nativeElement.querySelector('.close-button');
    
    headerCloseButton.click();
    
    expect(mockDialogRef.close).toHaveBeenCalled();
  });

  it('should open image in new tab when open in new tab button is clicked', () => {
    spyOn(window, 'open');
    
    const openInNewTabButton = fixture.nativeElement.querySelector('button[color="primary"]');
    openInNewTabButton.click();
    
    expect(window.open).toHaveBeenCalledWith(mockDialogData.imageUrl, '_blank');
  });

  it('should trigger download when download button is clicked', () => {
    // Mock document.createElement and appendChild/removeChild
    const mockLink = jasmine.createSpyObj('HTMLAnchorElement', ['click']);
    spyOn(document, 'createElement').and.returnValue(mockLink);
    spyOn(document.body, 'appendChild');
    spyOn(document.body, 'removeChild');
    
    const downloadButton = fixture.nativeElement.querySelector('button[color="accent"]');
    downloadButton.click();
    
    expect(document.createElement).toHaveBeenCalledWith('a');
    expect(mockLink.href).toBe(mockDialogData.imageUrl);
    expect(mockLink.download).toBe('rwp1.svg');
    expect(mockLink.target).toBe('_blank');
    expect(document.body.appendChild).toHaveBeenCalledWith(mockLink);
    expect(mockLink.click).toHaveBeenCalled();
    expect(document.body.removeChild).toHaveBeenCalledWith(mockLink);
  });

  it('should retry loading image when retry button is clicked', () => {
    // First trigger error state
    const imageElement = fixture.nativeElement.querySelector('.particle-image');
    imageElement.dispatchEvent(new Event('error'));
    fixture.detectChanges();
    
    expect(component.hasError).toBe(true);
    
    // Click retry button
    const retryButton = fixture.nativeElement.querySelector('.error-overlay button');
    retryButton.click();
    
    expect(component.isLoading).toBe(true);
    expect(component.hasError).toBe(false);
  });

  it('should handle missing dialog data gracefully', () => {
    // Test with minimal data
    const minimalData: ParticleImageModalData = {
      imageUrl: '/test.svg',
      title: 'Test',
      altText: 'Test Alt'
    };
    
    component.data = minimalData;
    fixture.detectChanges();
    
    const titleElement = fixture.nativeElement.querySelector('.header-content h2');
    const descriptionElement = fixture.nativeElement.querySelector('.description');
    
    expect(titleElement.textContent.trim()).toBe('Test');
    expect(descriptionElement).toBeFalsy(); // Should not show if no description
  });

  it('should extract correct filename from image URL', () => {
    const filename = component['getImageFilename']();
    expect(filename).toBe('rwp1.svg');
  });

  it('should fallback to default filename for invalid URLs', () => {
    component.data = { ...mockDialogData, imageUrl: '' };
    const filename = component['getImageFilename']();
    expect(filename).toBe('particle-image');
  });
});

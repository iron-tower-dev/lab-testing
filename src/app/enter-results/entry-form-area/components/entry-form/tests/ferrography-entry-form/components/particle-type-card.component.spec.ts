import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ParticleTypeCardComponent } from './particle-type-card.component';
import { SharedModule } from '../../../../../../../shared-module';
import { 
  FerrographyParticleType,
  FerrographyHeat,
  FerrographyConcentration,
  FerrographySize,
  FerrographyColor,
  FerrographyTexture,
  FerrographyComposition,
  FerrographySeverity,
  ParticleTypeDefinition
} from '../../../../../../enter-results.types';

describe('ParticleTypeCardComponent', () => {
  let component: ParticleTypeCardComponent;
  let fixture: ComponentFixture<ParticleTypeCardComponent>;
  let fb: FormBuilder;

  const mockParticleType: FerrographyParticleType = 'Rubbing Wear (Platelet)';
  
  const mockParticleTypeDefinition: ParticleTypeDefinition = {
    id: 1,
    type: 'Rubbing Wear (Platelet)',
    description: 'Free metal particles with smooth surfaces.',
    image1: 'rwp1.jpg',
    image2: 'rwp2.jpg',
    active: '1',
    sortOrder: 0
  };

  let mockParticleForm: FormGroup;

  const heatOptions: FerrographyHeat[] = ['NA', 'Blue', 'Straw', 'Purple', 'No Change', 'Melted', 'Charred'];
  const concentrationOptions: FerrographyConcentration[] = ['Few', 'Moderate', 'Many', 'Heavy'];
  const sizeOptions: FerrographySize[] = [
    'Fine, <5µm',
    'Small, 5 to 15µm', 
    'Medium, 15 to 40µm', 
    'Large, 40 to 100µm', 
    'Huge, >100µm'
  ];
  const colorOptions: FerrographyColor[] = [
    'Red', 'Black', 'Tempered', 'Metallic', 'Straw', 'Copper', 'Brass', 'Other Color'
  ];
  const textureOptions: FerrographyTexture[] = [
    'Bright or Reflective', 'Dull or Oxidized', 'Pitted', 'Striated', 'Smeared', 'Amorphous', 'Other Texture'
  ];
  const compositionOptions: FerrographyComposition[] = [
    'Ferrous Metal', 'Cupric Metal', 'Other Metal', 'Dust', 'Organic', 'Sludge', 'Paint Chips', 'Other Material'
  ];
  const severityOptions: FerrographySeverity[] = [1, 2, 3, 4];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ParticleTypeCardComponent,
        SharedModule,
        ReactiveFormsModule,
        NoopAnimationsModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ParticleTypeCardComponent);
    component = fixture.componentInstance;
    fb = TestBed.inject(FormBuilder);
    
    // Create mock form
    mockParticleForm = fb.group({
      particleType: [mockParticleType],
      isVisible: [false],
      isSelected: [false],
      heat: [''],
      concentration: [''],
      sizeAvg: [''],
      sizeMax: [''],
      color: [''],
      texture: [''],
      composition: [''],
      severity: [''],
      comments: [''],
      includeCommentsInOverall: [false]
    });
    
    // Set required inputs
    fixture.componentRef.setInput('particleType', mockParticleType);
    fixture.componentRef.setInput('particleForm', mockParticleForm);
    fixture.componentRef.setInput('heatOptions', heatOptions);
    fixture.componentRef.setInput('concentrationOptions', concentrationOptions);
    fixture.componentRef.setInput('sizeOptions', sizeOptions);
    fixture.componentRef.setInput('colorOptions', colorOptions);
    fixture.componentRef.setInput('textureOptions', textureOptions);
    fixture.componentRef.setInput('compositionOptions', compositionOptions);
    fixture.componentRef.setInput('severityOptions', severityOptions);
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display particle type header when definition is provided', () => {
    fixture.componentRef.setInput('particleTypeDefinition', mockParticleTypeDefinition);
    fixture.detectChanges();
    
    const databaseHeader = fixture.nativeElement.querySelector('.database-header');
    expect(databaseHeader).toBeTruthy();
    
    const titleElement = fixture.nativeElement.querySelector('.particle-type-title');
    expect(titleElement.textContent.trim()).toBe(mockParticleTypeDefinition.type);
    
    const descriptionElement = fixture.nativeElement.querySelector('.particle-description');
    expect(descriptionElement.textContent.trim()).toBe(mockParticleTypeDefinition.description);
  });
  
  it('should display images when provided in particle definition', () => {
    fixture.componentRef.setInput('particleTypeDefinition', mockParticleTypeDefinition);
    fixture.detectChanges();
    
    const imagesContainer = fixture.nativeElement.querySelector('.particle-images');
    expect(imagesContainer).toBeTruthy();
    
    const imageContainers = fixture.nativeElement.querySelectorAll('.image-container');
    expect(imageContainers.length).toBe(2);
    
    const firstImage = imageContainers[0].querySelector('.particle-image');
    const secondImage = imageContainers[1].querySelector('.particle-image');
    
    expect(firstImage.src).toContain(mockParticleTypeDefinition.image1);
    expect(secondImage.src).toContain(mockParticleTypeDefinition.image2);
  });

  it('should display fallback header when no definition is provided', () => {
    const databaseHeader = fixture.nativeElement.querySelector('.database-header');
    expect(databaseHeader).toBeFalsy();
    
    const fallbackHeader = fixture.nativeElement.querySelector('.fallback-header');
    expect(fallbackHeader).toBeTruthy();
    
    const titleElement = fallbackHeader.querySelector('.particle-type-title');
    expect(titleElement.textContent.trim()).toBe(mockParticleType);
    
    const noInfoElement = fallbackHeader.querySelector('.no-database-info');
    expect(noInfoElement.textContent.trim()).toBe('No database information available');
  });

  it('should show selection checkbox and visibility toggle', () => {
    const checkbox = fixture.nativeElement.querySelector('mat-checkbox');
    const toggleButton = fixture.nativeElement.querySelector('button[mat-icon-button]');
    
    expect(checkbox).toBeTruthy();
    expect(toggleButton).toBeTruthy();
  });

  it('should emit selectionToggle when checkbox is clicked', () => {
    spyOn(component.selectionToggle, 'emit');
    
    const checkbox = fixture.nativeElement.querySelector('mat-checkbox input');
    checkbox.click();
    
    expect(component.selectionToggle.emit).toHaveBeenCalledWith(mockParticleType);
  });

  it('should emit visibilityToggle when toggle button is clicked', () => {
    spyOn(component.visibilityToggle, 'emit');
    
    const toggleButton = fixture.nativeElement.querySelector('button[mat-icon-button]');
    toggleButton.click();
    
    expect(component.visibilityToggle.emit).toHaveBeenCalledWith(mockParticleType);
  });

  it('should show evaluated severity when form has severity value', () => {
    mockParticleForm.get('severity')?.setValue(3);
    fixture.detectChanges();
    
    const severityDisplay = fixture.nativeElement.querySelector('.evaluated-severity');
    expect(severityDisplay).toBeTruthy();
    expect(severityDisplay.textContent).toContain('Severity: 3');
  });

  it('should not show evaluated severity when form has no severity value', () => {
    const severityDisplay = fixture.nativeElement.querySelector('.evaluated-severity');
    expect(severityDisplay).toBeFalsy();
  });

  it('should show entry form when isVisible is true and form isVisible is true', () => {
    mockParticleForm.get('isVisible')?.setValue(true);
    fixture.componentRef.setInput('isVisible', true);
    fixture.detectChanges();
    
    const entryForm = fixture.nativeElement.querySelector('.particle-type-entry-form');
    expect(entryForm).toBeTruthy();
  });

  it('should not show entry form when isVisible is false', () => {
    mockParticleForm.get('isVisible')?.setValue(true);
    fixture.componentRef.setInput('isVisible', false);
    fixture.detectChanges();
    
    const entryForm = fixture.nativeElement.querySelector('.particle-type-entry-form');
    expect(entryForm).toBeFalsy();
  });

  it('should show all form fields when entry form is visible', () => {
    mockParticleForm.get('isVisible')?.setValue(true);
    fixture.componentRef.setInput('isVisible', true);
    fixture.detectChanges();
    
    const formFields = fixture.nativeElement.querySelectorAll('mat-form-field');
    expect(formFields.length).toBe(9); // 8 select fields + 1 textarea
  });

  it('should populate select options correctly', () => {
    mockParticleForm.get('isVisible')?.setValue(true);
    fixture.componentRef.setInput('isVisible', true);
    fixture.detectChanges();
    
    const heatSelect = fixture.nativeElement.querySelector('mat-select[formControlName="heat"]');
    expect(heatSelect).toBeTruthy();
    
    // Check that options are being bound (we can't easily test the actual options without triggering the select)
    const heatField = fixture.nativeElement.querySelector('mat-form-field:has(mat-select[formControlName="heat"]) mat-label');
    expect(heatField.textContent.trim()).toBe('Heat');
  });

  it('should emit addCommentToOverall when button is clicked', () => {
    spyOn(component.addCommentToOverall, 'emit');
    
    mockParticleForm.get('isVisible')?.setValue(true);
    mockParticleForm.get('comments')?.setValue('Test comment');
    mockParticleForm.get('includeCommentsInOverall')?.setValue(true);
    fixture.componentRef.setInput('isVisible', true);
    fixture.detectChanges();
    
    const buttons = fixture.nativeElement.querySelectorAll('button');
    const addButton = Array.from(buttons).find((btn: any) => 
      btn.textContent && btn.textContent.includes('Add to Overall')
    );
    expect(addButton).toBeTruthy();
    (addButton as HTMLElement).click();
    
    expect(component.addCommentToOverall.emit).toHaveBeenCalledWith(mockParticleType);
  });

  it('should disable add comment button when no comments or not included', () => {
    mockParticleForm.get('isVisible')?.setValue(true);
    fixture.componentRef.setInput('isVisible', true);
    fixture.detectChanges();
    
    const buttons = fixture.nativeElement.querySelectorAll('button');
    const addButton = Array.from(buttons).find((btn: any) => 
      btn.textContent && btn.textContent.includes('Add to Overall')
    );
    expect(addButton).toBeTruthy();
    expect((addButton as HTMLButtonElement).disabled).toBeTruthy();
  });

  it('should enable add comment button when comments exist and are included', () => {
    mockParticleForm.get('isVisible')?.setValue(true);
    mockParticleForm.get('comments')?.setValue('Test comment');
    mockParticleForm.get('includeCommentsInOverall')?.setValue(true);
    fixture.componentRef.setInput('isVisible', true);
    fixture.detectChanges();
    
    const buttons = fixture.nativeElement.querySelectorAll('button');
    const addButton = Array.from(buttons).find((btn: any) => 
      btn.textContent && btn.textContent.includes('Add to Overall')
    );
    expect(addButton).toBeTruthy();
    expect((addButton as HTMLButtonElement).disabled).toBeFalsy();
  });

  it('should apply selected class when form is selected', () => {
    mockParticleForm.get('isSelected')?.setValue(true);
    fixture.detectChanges();
    
    const cardElement = fixture.nativeElement.querySelector('.particle-type-card');
    expect(cardElement.classList.contains('selected')).toBeTruthy();
  });

  it('should apply visible class when isVisible is true', () => {
    fixture.componentRef.setInput('isVisible', true);
    fixture.detectChanges();
    
    const cardElement = fixture.nativeElement.querySelector('.particle-type-card');
    expect(cardElement.classList.contains('visible')).toBeTruthy();
  });

  it('should disable form when readOnly is true', () => {
    fixture.componentRef.setInput('readOnly', true);
    fixture.detectChanges();
    
    const checkbox = fixture.nativeElement.querySelector('mat-checkbox input');
    const toggleButton = fixture.nativeElement.querySelector('button[mat-icon-button]');
    
    expect(checkbox.disabled).toBeTruthy();
    expect(toggleButton.disabled).toBeTruthy();
  });
});

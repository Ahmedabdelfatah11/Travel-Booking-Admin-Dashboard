import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { TourService } from '../../../../core/services/tour-service';
import { TourReadDto } from '../../../../shared/Interfaces/itour-create';
import { ITourCompany } from '../../../../shared/Interfaces/ItourCompany';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

interface ImagePreview {
  file: File;
  url: string;
}

@Component({
  selector: 'app-tour-edit',
  templateUrl: './tour-edit.html',
  styleUrls: ['./tour-edit.ts'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class TourEdit implements OnInit, OnDestroy {
  addTourForm!: FormGroup;
  categories = Object.values(TourCategory);
  readonly TourCategory = TourCategory;

  isEditMode = true; // ✅ Always true
  tourId: number | null = null;

  // Companies
  tourCompanies: ITourCompany[] = [];
  loadingCompanies = true;

  // File storage
  mainImage: File | null = null;
  galleryFiles: ImagePreview[] = [];

  // Previews
  mainImagePreview: string | null = null;

  private routeSub: Subscription = new Subscription();

  constructor(
    private fb: FormBuilder,
    private tourService: TourService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.addTourForm = this.fb.group({
      id: [null],
      name: ['', [Validators.required, Validators.minLength(3)]],
      destination: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      description: ['', [Validators.required, Validators.minLength(10)]],
      maxGuests: [1, [Validators.required, Validators.min(1)]],
      minGroupSize: [1, [Validators.min(1)]],
      maxGroupSize: [20, [Validators.max(50)]],
      price: [0, [Validators.required, Validators.min(0.01)]],
      category: [TourCategory.Adventure, Validators.required],
      languages: ['English', Validators.required],
      tourCompanyId: [null, Validators.required],
      tickets: this.fb.array([]),
      questions: this.fb.array([]),
      includedItems: this.fb.array([], [Validators.minLength(4), Validators.maxLength(10)]),
      excludedItems: this.fb.array([], [Validators.minLength(4), Validators.maxLength(10)])
    }, { validators: () => this.imagesRequiredValidator() });
  }

  ngOnInit(): void {
    this.loadingCompanies = true;

    // Load companies
    this.tourService.getMyTourCompanies().subscribe({
      next: (companies) => {
        this.tourCompanies = companies;
        this.loadingCompanies = false;
      },
      error: (err) => {
        console.error('Failed to load companies:', err);
        this.loadingCompanies = false;
      }
    });

    // Load tour by ID
    this.routeSub = this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.tourId = +id;
        this.loadTour(+id);
      }
    });
  }

  ngOnDestroy(): void {
    this.routeSub.unsubscribe();
    [this.mainImagePreview, ...this.galleryFiles.map(g => g.url)].forEach(url => {
      if (url) URL.revokeObjectURL(url);
    });
  }

  // === VALIDATORS ===
  private imagesRequiredValidator() {
    const hasMainImage = !!this.mainImage;
    const hasSixGalleryImages = this.galleryFiles.length === 6;
    return hasMainImage && hasSixGalleryImages ? null : { imagesRequired: true };
  }

  // === LOAD EXISTING TOUR ===
  loadTour(id: number): void {
    this.tourService.getTour(id).subscribe({
      next: (tour) => this.patchFormWithTour(tour),
      error: (err) => {
        console.error('Failed to load tour:', err);
        alert('Could not load tour details.');
        this.router.navigate(['/tour-admin/tours']);
      }
    });
  }
currentTour: TourReadDto | null = null;
currentGalleryUrls: string[] = [];

 private patchFormWithTour(tour: TourReadDto): void {
   this.currentTour = tour;
    this.currentGalleryUrls = tour.imageUrls?.map(url => this.getImageUrl(url)) || [];
  this.addTourForm.patchValue({
    id: tour.id,
    name: tour.name,
    startDate: new Date(tour.startDate).toISOString().split('T')[0],
    endDate: new Date(tour.endDate).toISOString().split('T')[0],
    description: tour.description,
    destination: tour.destination,
    maxGuests: tour.maxGuests,
    minGroupSize: tour.minGroupSize,
    maxGroupSize: tour.maxGroupSize,
    price: tour.price,
    category: tour.category,
    languages: tour.languages,
    tourCompanyId: tour.tourCompanyId
  });

  // Clear and repopulate form arrays
  this.includedItemsArray.clear();
  this.excludedItemsArray.clear();

  tour.includedItems?.forEach(item => this.addIncludedItem(item));
  tour.excludedItems?.forEach(item => this.addExcludedItem(item));

  this.tickets.clear();
  tour.tickets.forEach(t => this.addTicket(t));

  this.questions.clear();
  tour.questions.forEach(q => this.addQuestion(q));

  // ✅ Set the original image URL for preview
  if (tour.imageUrl) {
    this.mainImagePreview = this.getImageUrl(tour.imageUrl); // ✅ Use your method
  }

  this.updateFormValidity();
}

  // === FORM ARRAY HELPERS ===
  get tickets(): FormArray { return this.addTourForm.get('tickets') as FormArray; }
  get questions(): FormArray { return this.addTourForm.get('questions') as FormArray; }
  get includedItemsArray(): FormArray { return this.addTourForm.get('includedItems') as FormArray; }
  get excludedItemsArray(): FormArray { return this.addTourForm.get('excludedItems') as FormArray; }

  // === FILE HANDLERS ===
  onMainImageSelected(event: any): void {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      alert('Please select a valid image file.');
      return;
    }

    if (this.mainImagePreview) URL.revokeObjectURL(this.mainImagePreview);

    this.mainImage = file;
    this.mainImagePreview = URL.createObjectURL(file);
    this.updateFormValidity();
  }

  onGalleryImagesSelected(event: any): void {
    const files = Array.from(event.target.files).slice(0, 6 - this.galleryFiles.length) as File[];

    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        this.galleryFiles.push({
          file,
          url: URL.createObjectURL(file)
        });
      }
    });

    this.updateFormValidity();
  }

  removeGalleryImage(index: number): void {
    const item = this.galleryFiles[index];
    URL.revokeObjectURL(item.url);
    this.galleryFiles.splice(index, 1);
    this.updateFormValidity();
  }

  // === HELPERS ===
  public updateFormValidity(): void {
    this.addTourForm.updateValueAndValidity();
  }

  // === INCLUDED/EXCLUDED ITEMS ===
  addIncludedItem(value: string = '') {
    if (this.includedItemsArray.length >= 10) return;
    const control = this.fb.control(value, [Validators.required, Validators.maxLength(25)]);
    this.includedItemsArray.push(control);
    this.updateFormValidity();
  }

  addExcludedItem(value: string = '') {
    if (this.excludedItemsArray.length >= 10) return;
    const control = this.fb.control(value, [Validators.required, Validators.maxLength(25)]);
    this.excludedItemsArray.push(control);
    this.updateFormValidity();
  }

  removeIncludedItem(index: number) {
    if (this.includedItemsArray.length > 4) {
      this.includedItemsArray.removeAt(index);
      this.updateFormValidity();
    }
  }

  removeExcludedItem(index: number) {
    if (this.excludedItemsArray.length > 4) {
      this.excludedItemsArray.removeAt(index);
      this.updateFormValidity();
    }
  }

  // === TICKETS & QUESTIONS ===
  addTicket(ticket?: any) {
    const group = this.fb.group({
      type: [ticket?.type || '', Validators.required],
      price: [ticket?.price || 0, [Validators.required, Validators.min(0.01)]],
      availableQuantity: [ticket?.availableQuantity || 1, [Validators.required, Validators.min(1)]],
      isActive: [ticket?.isActive ?? true]
    });
    this.tickets.push(group);
    this.updateFormValidity();
  }

  removeTicket(index: number) {
    if (this.tickets.length > 1) {
      this.tickets.removeAt(index);
      this.updateFormValidity();
    }
  }

  addQuestion(question?: any) {
    const group = this.fb.group({
      questionText: [question?.questionText || '', Validators.required],
      answerText: [question?.answerText || '', Validators.required]
    });
    this.questions.push(group);
    this.updateFormValidity();
  }

  removeQuestion(index: number) {
    this.questions.removeAt(index);
    this.updateFormValidity();
  }

  // === SUBMIT ===
  onSubmit() {
    const formValue = this.addTourForm.value;

    // ✅ Validate dates
    const startDate = new Date(formValue.startDate);
    const endDate = new Date(formValue.endDate);

    if (startDate <= new Date()) {
      alert('Start date must be in the future.');
      return;
    }

    if (endDate <= startDate) {
      alert('End date must be after start date.');
      return;
    }

    if (!formValue.tourCompanyId) {
      alert('Tour Company is required.');
      return;
    }

    const formData = new FormData();

    // Append fields
    formData.append('Name', formValue.name.trim());
    formData.append('StartDate', startDate.toISOString());
    formData.append('EndDate', endDate.toISOString());
    formData.append('Description', formValue.description.trim());
    formData.append('Destination', formValue.destination.trim());
    formData.append('MaxGuests', formValue.maxGuests.toString());
    formData.append('MinGroupSize', formValue.minGroupSize.toString());
    formData.append('MaxGroupSize', formValue.maxGroupSize.toString());
    formData.append('Price', formValue.price.toString());
    formData.append('Category', formValue.category);
    formData.append('Languages', formValue.languages.trim());
    formData.append('TourCompanyId', formValue.tourCompanyId.toString());

    // Files (optional in edit mode)
    if (this.mainImage) {
      formData.append('Image', this.mainImage, this.mainImage.name);
    }

    if (this.galleryFiles.length > 0) {
      this.galleryFiles.forEach(item => {
        formData.append('GalleryImages', item.file, item.file.name);
      });
    }

    // Sanitize and append included/excluded
    const sanitize = (items: string[]) => items.map(i => i.trim()).filter(i => i);
    const includedItems = sanitize(formValue.includedItems);
    const excludedItems = sanitize(formValue.excludedItems);

    if (includedItems.length < 4 || excludedItems.length < 4) {
      alert('At least 4 items are required for both Included and Excluded.');
      return;
    }

    includedItems.forEach(item => formData.append('IncludedItems', item));
    excludedItems.forEach(item => formData.append('ExcludedItems', item));

    // Tickets
    formValue.tickets.forEach((t: any, i: number) => {
      formData.append(`Tickets[${i}].Type`, t.type.trim());
      formData.append(`Tickets[${i}].Price`, t.price.toString());
      formData.append(`Tickets[${i}].AvailableQuantity`, t.availableQuantity.toString());
      formData.append(`Tickets[${i}].IsActive`, t.isActive.toString());
    });

    // ✅ Submit using updateTour
    if (this.tourId) {
      this.tourService.updateTour(this.tourId, formData).subscribe({
        next: () => {
          alert('Tour updated successfully!');
          this.router.navigate(['/tour-admin/tours']);
        },
        error: (err) => {
          console.error('Update failed:', err);
          alert(`Error: ${err.message}`);
        }
      });
    }
  }

  // Helper to get company name
  getCompanyName(id: number | null): string {
    return this.tourCompanies.find(c => c.id === id)?.name || 'Unknown';
  }

  getImageUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl) {
    return 'https://via.placeholder.com/400x250?text=No+Image';
  }

  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  return `https://localhost:7277${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
}
}

// Add this to avoid TS error
export enum TourCategory {
  Adventure = 'Adventure',
  Historical = 'Historical',
  Cultural = 'Cultural',
  Luxury = 'Luxury'
}
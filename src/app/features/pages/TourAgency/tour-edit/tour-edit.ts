import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormArray,
  AbstractControl,
  ValidatorFn,
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

// Services
import { TourService } from '../../../../core/services/tour-service';
import { ToastService } from '../../../../core/services/toast-service';

// Interfaces
import { ITourCompany } from '../../../../shared/Interfaces/ItourCompany';

// Helpers
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { TourReadDto } from '../../../../shared/Interfaces/i-tour';

interface ImagePreview {
  file: File;
  url: string;
}

export enum TourCategory {
  Adventure = 'Adventure',
  Historical = 'Historical',
  Cultural = 'Cultural',
  Luxury = 'Luxury',
}

@Component({
  selector: 'app-tour-edit',
  templateUrl: './tour-edit.html',
  styleUrls: ['./tour-edit.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
})
export class TourEdit implements OnInit, OnDestroy {
  addTourForm!: FormGroup;
  categories = Object.values(TourCategory);
  readonly TourCategory = TourCategory;

  tourId: number | null = null;
  tourCompanies: ITourCompany[] = [];
  loadingCompanies = true;
  loadingTour = true;
  submitting = false;

  // File handling
  mainImage: File | null = null;
  galleryFiles: ImagePreview[] = [];
  mainImagePreview: string | null = null;
  currentGalleryUrls: string[] = [];

  currentTour: TourReadDto | null = null;
  private routeSub: Subscription = new Subscription();

  constructor(
    private fb: FormBuilder,
    private tourService: TourService,
    private router: Router,
    private route: ActivatedRoute,
    private cd: ChangeDetectorRef,
    public toastService: ToastService
  ) {
    this.addTourForm = this.fb.group({
      id: [null],
      name: ['', [Validators.required, Validators.minLength(3)]],
      destination: ['', Validators.required],
      startDate: ['', [Validators.required, this.futureDateValidator()]],
      endDate: ['', Validators.required],
      description: ['', [Validators.required, Validators.minLength(10)]],
      maxGuests: [1, [Validators.required, Validators.min(1)]],
      minGroupSize: [1, [Validators.min(1)]],
      maxGroupSize: [20, [Validators.max(50)]],
      price: [0, [Validators.required, Validators.min(0.01)]],
      category: [TourCategory.Adventure, Validators.required],
      languages: ['English', Validators.required],
      tourCompanyId: [{ value: null, disabled: true }, Validators.required],
      tickets: this.fb.array([]),
      questions: this.fb.array([]),
      includedItems: this.fb.array([], [Validators.minLength(4), Validators.maxLength(10)]),
      excludedItems: this.fb.array([], [Validators.minLength(4), Validators.maxLength(10)]),
    }, {
      validators: [this.endDateAfterStartDateValidator()],
    });
  }

  ngOnInit(): void {
    this.loadTourCompanies();
    this.loadTourFromRoute();
  }

  ngOnDestroy(): void {
    this.routeSub.unsubscribe();
    this.revokePreviews();
  }

  // === LOAD DATA ===
  loadTourCompanies(): void {
    this.loadingCompanies = true;
    this.cd.detectChanges();

    const startTime = Date.now();

    this.tourService.getMyTourCompanies().subscribe({
      next: (companies) => {
        this.tourCompanies = companies;
      },
      error: () => {
        this.toastService.show('Could not load tour companies.', 'error');
      },
      complete: () => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(1000 - elapsed, 0);

        setTimeout(() => {
          this.loadingCompanies = false;
          this.cd.detectChanges();
        }, remaining);
      }
    });
  }

  loadTourFromRoute(): void {
    this.routeSub = this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.tourId = +id;
        this.loadTour(+id);
      }
    });
  }

  loadTour(id: number): void {
    this.loadingTour = true;
    this.cd.detectChanges();

    const startTime = Date.now();

    this.tourService.getTour(id).subscribe({
      next: (tour) => {
        this.patchFormWithTour(tour);
      },
      error: () => {
        this.toastService.show('Could not load tour. Please try again.', 'error');
      },
      complete: () => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(1000 - elapsed, 0);

        setTimeout(() => {
          this.loadingTour = false;
          this.cd.detectChanges();
        }, remaining);
      }
    });
  }

  private patchFormWithTour(tour: TourReadDto): void {
    this.currentTour = tour;

    this.mainImagePreview = tour.imageUrl ? this.getImageUrl(tour.imageUrl) : null;
    this.currentGalleryUrls = tour.imageUrls?.map(url => this.getImageUrl(url)) || [];

    const startDate = this.formatDateForInput(tour.startDate);
    const endDate = this.formatDateForInput(tour.endDate);

    this.addTourForm.patchValue({
      id: tour.id,
      name: tour.name,
      startDate,
      endDate,
      description: tour.description,
      destination: tour.destination,
      maxGuests: tour.maxGuests,
      minGroupSize: tour.minGroupSize,
      maxGroupSize: tour.maxGroupSize,
      price: tour.price,
      category: tour.category,
      languages: tour.languages,
      tourCompanyId: tour.tourCompanyId,
    });

    this.clearFormArrays();
    this.populateFormArrays(tour);
  }

  private formatDateForInput(date: string | Date | null | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    d.setHours(12, 0, 0, 0);
    return d.toISOString().split('T')[0];
  }

  private clearFormArrays(): void {
    this.includedItemsArray.clear();
    this.excludedItemsArray.clear();
    this.tickets.clear();
    this.questions.clear();
  }

  private populateFormArrays(tour: TourReadDto): void {
    tour.includedItems?.forEach(item => this.addIncludedItem(item));
    tour.excludedItems?.forEach(item => this.addExcludedItem(item));
    tour.tickets?.forEach(t => this.addTicket(t));
    this.populateQuestions(tour.questions);
  }

  private populateQuestions(questions: any[] | null | undefined): void {
    if (Array.isArray(questions) && questions.length > 0) {
      questions.forEach(q => this.addQuestion(q));
    } else {
      this.addQuestion();
    }
  }

  // === GETTERS ===
  get tickets(): FormArray { return this.addTourForm.get('tickets') as FormArray; }
  get questions(): FormArray { return this.addTourForm.get('questions') as FormArray; }
  get includedItemsArray(): FormArray { return this.addTourForm.get('includedItems') as FormArray; }
  get excludedItemsArray(): FormArray { return this.addTourForm.get('excludedItems') as FormArray; }

  // === FILE HANDLERS ===
  onMainImageSelected(event: any): void {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      this.toastService.show('Please select a valid image file.', 'warning');
      return;
    }

    this.revokeMainImagePreview();
    this.mainImage = file;
    this.mainImagePreview = URL.createObjectURL(file);
  }

  onGalleryImagesSelected(event: any): void {
    const files = Array.from(event.target.files) as File[];
    const maxAllowed = 6 - this.getTotalGalleryCount();

    if (files.length > maxAllowed) {
      this.toastService.show(`You can only add ${maxAllowed} more image(s).`, 'warning');
      event.target.value = '';
      return;
    }

    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        this.galleryFiles.push({ file, url });
        this.currentGalleryUrls.push(url);
      }
    });

    this.updateGalleryCount();
    event.target.value = '';
  }

  removeGalleryImage(index: number): void {
    URL.revokeObjectURL(this.galleryFiles[index].url);
    const urlToRemove = this.galleryFiles[index].url;
    this.galleryFiles.splice(index, 1);

    const urlIndex = this.currentGalleryUrls.indexOf(urlToRemove);
    if (urlIndex !== -1) {
      this.currentGalleryUrls.splice(urlIndex, 1);
    }
  }

  deletedImageUrls: string[] = [];
  galleryCount = 0;

  removeCurrentGalleryImage(index: number): void {
    const urlToRemove = this.currentGalleryUrls[index];

    if (urlToRemove.startsWith('blob:')) {
      const fileIndex = this.galleryFiles.findIndex(f => f.url === urlToRemove);
      if (fileIndex !== -1) {
        URL.revokeObjectURL(this.galleryFiles[fileIndex].url);
        this.galleryFiles.splice(fileIndex, 1);
      }
    } else {
      if (this.currentTour?.imageUrls) {
        const serverUrl = this.currentTour.imageUrls[index];
        this.deletedImageUrls.push(serverUrl);
      }
    }

    this.currentGalleryUrls.splice(index, 1);
    this.updateGalleryCount();
  }

  revokePreviews(): void {
    this.revokeMainImagePreview();
    this.galleryFiles.forEach(f => URL.revokeObjectURL(f.url));
  }

  revokeMainImagePreview(): void {
    if (this.mainImagePreview) {
      URL.revokeObjectURL(this.mainImagePreview);
      this.mainImagePreview = null;
    }
  }

  // === ITEMS ===
  addIncludedItem(value: string = '') {
    if (this.includedItemsArray.length >= 10) return;
    const control = this.fb.control(value, [Validators.required, Validators.maxLength(45)]);
    this.includedItemsArray.push(control);
  }

  addExcludedItem(value: string = '') {
    if (this.excludedItemsArray.length >= 10) return;
    const control = this.fb.control(value, [Validators.required, Validators.maxLength(45)]);
    this.excludedItemsArray.push(control);
  }

  removeIncludedItem(index: number) {
    if (this.includedItemsArray.length > 4) {
      this.includedItemsArray.removeAt(index);
    }
  }

  removeExcludedItem(index: number) {
    if (this.excludedItemsArray.length > 4) {
      this.excludedItemsArray.removeAt(index);
    }
  }

  // === TICKETS & QUESTIONS ===
  addTicket(ticket?: any) {
    const group = this.fb.group({
      id: [ticket?.id || null],
      type: [ticket?.type || '', Validators.required],
      price: [ticket?.price && ticket.price > 0.01 ? ticket.price : 1, [Validators.required, Validators.min(0.01)]],
      availableQuantity: [ticket?.availableQuantity || 1, [Validators.required, Validators.min(1)]],
      isActive: [ticket?.isActive ?? true]
    });
    this.tickets.push(group);
  }

  removeTicket(index: number) {
    if (this.tickets.length > 1) {
      this.tickets.removeAt(index);
    }
  }

  addQuestion(question?: any) {
    const group = this.fb.group({
      id: [question?.id || null],
      questionText: [question?.questionText || '', [Validators.required, Validators.minLength(3)]],
      answerText: [question?.answerText || '', [Validators.required, Validators.minLength(3)]]
    });
    this.questions.push(group);
  }

  removeQuestion(index: number) {
    this.questions.removeAt(index);
  }

  // === VALIDATORS ===
  private futureDateValidator(): ValidatorFn {
    return (control: AbstractControl) => {
      const value = control.value;
      if (!value) return null;
      const date = new Date(value);
      return date > new Date() ? null : { pastDate: true };
    };
  }

  private endDateAfterStartDateValidator(): ValidatorFn {
    return (group: AbstractControl) => {
      const start = group.get('startDate')?.value;
      const end = group.get('endDate')?.value;
      if (!start || !end) return null;
      return new Date(end) > new Date(start) ? null : { endDateBeforeStart: true };
    };
  }

  // === SUBMIT ===
  onSubmit(): void {
    if (this.addTourForm.invalid || this.submitting) {
      this.toastService.show('Please fix form errors before submitting.', 'warning');
      return;
    }

    if (!this.tourId) return;

    this.submitting = true;
    this.cd.detectChanges();

    const startTime = Date.now();

    const formValue = this.addTourForm.getRawValue();
    const formData = new FormData();

    const finalTourCompanyId = formValue.tourCompanyId || this.currentTour?.tourCompanyId;
    if (!finalTourCompanyId) {
      this.toastService.show('Tour Company is required.', 'error');
      this.submitting = false;
      return;
    }

    const totalGalleryCount = this.currentGalleryUrls.length;
    if (totalGalleryCount < 6) {
      this.toastService.show(`You need at least 6 gallery images. Currently: ${totalGalleryCount}`, 'warning');
      this.submitting = false;
      return;
    }

    formData.append('Name', formValue.name.trim());
    formData.append('StartDate', this.localDateToISOString(formValue.startDate));
    formData.append('EndDate', this.localDateToISOString(formValue.endDate));
    formData.append('Description', formValue.description.trim());
    formData.append('Destination', formValue.destination.trim());
    formData.append('MaxGuests', formValue.maxGuests.toString());
    formData.append('MinGroupSize', formValue.minGroupSize.toString());
    formData.append('MaxGroupSize', formValue.maxGroupSize.toString());
    formData.append('Price', formValue.price.toString());
    formData.append('Category', formValue.category);
    formData.append('Languages', formValue.languages.trim());
    formData.append('TourCompanyId', finalTourCompanyId.toString());

    if (this.deletedImageUrls.length > 0) {
      this.deletedImageUrls.forEach(url => {
        formData.append('DeletedImageUrls', url);
      });
    }

    if (this.mainImage) {
      formData.append('Image', this.mainImage, this.mainImage.name);
    }

    this.galleryFiles.forEach(item => {
      formData.append('GalleryImages', item.file, item.file.name);
    });

    this.currentGalleryUrls
      .filter(url => !url.startsWith('blob:'))
      .forEach(url => {
        formData.append('ExistingImageUrls', url);
      });

    const sanitize = (items: string[]) => items.map(i => i.trim()).filter(i => i);
    const included = sanitize(formValue.includedItems);
    const excluded = sanitize(formValue.excludedItems);

    if (included.length < 4 || excluded.length < 4) {
      this.toastService.show('You need at least 4 items in "What’s Included" and "Excluded".', 'warning');
      this.submitting = false;
      return;
    }

    included.forEach(i => formData.append('IncludedItems', i));
    excluded.forEach(i => formData.append('ExcludedItems', i));

    if (!formValue.tickets || formValue.tickets.length === 0) {
      this.toastService.show('At least one ticket type is required.', 'warning');
      this.submitting = false;
      return;
    }

    for (let i = 0; i < formValue.tickets.length; i++) {
      const t = formValue.tickets[i];
      if (!t.type?.trim()) {
        this.toastService.show(`Ticket #${i + 1} type is required.`, 'warning');
        this.submitting = false;
        return;
      }
      if (t.price < 0.01) {
        this.toastService.show(`Ticket #${i + 1} price must be ≥ 0.01`, 'warning');
        this.submitting = false;
        return;
      }
    }

    formValue.tickets.forEach((t: any, i: number) => {
      formData.append(`Tickets[${i}].Id`, t.id?.toString() || '0');
      formData.append(`Tickets[${i}].Type`, t.type.trim());
      formData.append(`Tickets[${i}].Price`, t.price.toString());
      formData.append(`Tickets[${i}].AvailableQuantity`, t.availableQuantity.toString());
      formData.append(`Tickets[${i}].IsActive`, t.isActive.toString());
    });

    formValue.questions.forEach((q: any, i: number) => {
      formData.append(`Questions[${i}].QuestionText`, q.questionText.trim());
      formData.append(`Questions[${i}].AnswerText`, q.answerText.trim());
      if (q.id) formData.append(`Questions[${i}].Id`, q.id.toString());
    });

    this.tourService.updateTour(this.tourId, formData).subscribe({
      next: () => {
        this.toastService.show('🎉 Tour updated successfully!', 'success');
        this.router.navigate(['/tour-admin/tours']);
      },
      error: (err) => {
        if (err.error?.errors) {
          Object.keys(err.error.errors).forEach(field => {
            this.toastService.show(`${field}: ${err.error.errors[field].join(', ')}`, 'error');
          });
        } else {
          this.toastService.show('Update failed. Please try again.', 'error');
        }
      },
      complete: () => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(1000 - elapsed, 0);

        setTimeout(() => {
          this.submitting = false;
          this.cd.detectChanges();
        }, remaining);
      }
    });
  }

  // === UTILS ===
  getCompanyName(id: number | null): string {
    return this.tourCompanies.find(c => c.id === id)?.name || 'Unknown';
  }

  getImageUrl(imageUrl: string | null | undefined): string {
    if (!imageUrl) return 'https://placehold.co/400x250?text=No+Image';
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl;
    return `https://localhost:7277${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
  }

  getToday(): string {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    return today.toISOString().split('T')[0];
  }

  private localDateToISOString(dateStr: string): string {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setHours(12, 0, 0, 0);
    return date.toISOString();
  }

  getTotalGalleryCount(): number {
    return this.currentGalleryUrls.length;
  }

  onImageError(event: any) {
    event.target.src = 'https://placehold.co/400x250?text=Image+Not+Found';
  }

  updateGalleryCount(): void {
    this.galleryCount = this.getTotalGalleryCount();
    this.cd.detectChanges();
  }
}
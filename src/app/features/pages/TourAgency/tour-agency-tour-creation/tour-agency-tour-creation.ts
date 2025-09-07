import { Component, OnInit, OnDestroy } from '@angular/core';
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
import { TourCategory, TourQuestionDto, TourReadDto, TourTicketDto } from '../../../../shared/Interfaces/i-tour';

interface ImagePreview {
  file: File;
  url: string;
}

@Component({
  selector: 'app-add-tour',
  templateUrl: './tour-agency-tour-creation.html',
  styleUrls: ['./tour-agency-tour-creation.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
})
export class TourAgencyTourCreation implements OnInit, OnDestroy {
  addTourForm!: FormGroup;
  categories = Object.values(TourCategory);
  readonly TourCategory = TourCategory;

  isEditMode = false;
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
    private route: ActivatedRoute,
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
      tourCompanyId: [null, Validators.required],
      tickets: this.fb.array([]),
      questions: this.fb.array([]),
      includedItems: this.fb.array([], [Validators.minLength(4), Validators.maxLength(10)]),
      excludedItems: this.fb.array([], [Validators.minLength(4), Validators.maxLength(10)]),
    }, {
      validators: [this.endDateAfterStartDateValidator()],
    });

    this.initializeDefaultItems();
    this.addTicket();
    this.addQuestion();
    this.updateFormValidity();
  }

  ngOnInit(): void {
    this.loadCompanies();
    this.loadRouteParams();
  }

  ngOnDestroy(): void {
    this.routeSub.unsubscribe();
    this.revokePreviews();
  }

  // === DATA LOADING ===
  private loadCompanies(): void {
    this.loadingCompanies = true;
    this.tourService.getMyTourCompanies().subscribe({
      next: (companies: ITourCompany[]) => {
        this.tourCompanies = companies;
        this.loadingCompanies = false;

        if (!this.isEditMode && companies.length > 0) {
          this.addTourForm.patchValue({ tourCompanyId: companies[0].id });
        }
      },
      error: () => {
        this.loadingCompanies = false;
        this.toastService.show('Could not load tour companies.', 'error');
      },
    });
  }

  private loadRouteParams(): void {
    this.routeSub = this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.tourId = +id;
        this.loadTour(+id);
      }
    });
  }

  private loadTour(id: number): void {
    this.tourService.getTour(id).subscribe({
      next: (tour) => this.patchFormWithTour(tour),
      error: () => {
        this.toastService.show('Could not load tour details.', 'error');
        this.router.navigate(['/tour-admin/tours']);
      },
    });
  }

  private patchFormWithTour(tour: TourReadDto): void {
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
      tourCompanyId: tour.tourCompanyId,
    });

    this.includedItemsArray.clear();
    this.excludedItemsArray.clear();
    this.tickets.clear();
    this.questions.clear();

    tour.includedItems?.forEach((item:string) => this.addIncludedItem(item));
    tour.excludedItems?.forEach((item:string) => this.addExcludedItem(item));
    tour.tickets?.forEach((t:TourTicketDto) => this.addTicket(t));
    tour.questions.forEach((q:TourQuestionDto) => this.addQuestion(q));

    this.updateFormValidity();
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
    this.updateFormValidity();
  }

  onGalleryImagesSelected(event: any): void {
    const files = Array.from(event.target.files).slice(0, 6 - this.galleryFiles.length) as File[];

    files.forEach((file) => {
      if (file.type.startsWith('image/')) {
        this.galleryFiles.push({
          file,
          url: URL.createObjectURL(file),
        });
      }
    });

    this.updateFormValidity();
  }

  removeGalleryImage(index: number): void {
    URL.revokeObjectURL(this.galleryFiles[index].url);
    this.galleryFiles.splice(index, 1);
    this.updateFormValidity();
  }

  // === HELPERS ===
  updateFormValidity(): void {
    this.addTourForm.updateValueAndValidity();
  }

  private revokePreviews(): void {
    this.revokeMainImagePreview();
    this.galleryFiles.forEach((f) => URL.revokeObjectURL(f.url));
  }

  private revokeMainImagePreview(): void {
    if (this.mainImagePreview) {
      URL.revokeObjectURL(this.mainImagePreview);
      this.mainImagePreview = null;
    }
  }

  // === FORM ARRAY GETTERS ===
  get tickets(): FormArray {
    return this.addTourForm.get('tickets') as FormArray;
  }

  get questions(): FormArray {
    return this.addTourForm.get('questions') as FormArray;
  }

  get includedItemsArray(): FormArray {
    return this.addTourForm.get('includedItems') as FormArray;
  }

  get excludedItemsArray(): FormArray {
    return this.addTourForm.get('excludedItems') as FormArray;
  }

  // === INCLUDED/EXCLUDED ITEMS ===
  private initializeDefaultItems(): void {
    const defaults = [
      'Licensed Egyptologist guide',
      'Camel ride',
      'Entrance fees to Pyramids & Sphinx',
      'Hotel pickup and drop-off',
    ];
    defaults.forEach((item) => this.addIncludedItem(item));

    const excludes = ['Gratuities', 'Personal expenses', 'Lunch'];
    excludes.forEach((item) => this.addExcludedItem(item));
  }

  addIncludedItem(value: string = '') {
    if (this.includedItemsArray.length >= 10) return;
    const control = this.fb.control(value, [Validators.required, Validators.maxLength(45)]);
    this.includedItemsArray.push(control);
    this.updateFormValidity();
  }

  addExcludedItem(value: string = '') {
    if (this.excludedItemsArray.length >= 10) return;
    const control = this.fb.control(value, [Validators.required, Validators.maxLength(45)]);
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
      isActive: [ticket?.isActive ?? true],
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
      answerText: [question?.answerText || '', Validators.required],
    });
    this.questions.push(group);
    this.updateFormValidity();
  }

  removeQuestion(index: number) {
    this.questions.removeAt(index);
    this.updateFormValidity();
  }

  // === SUBMIT ===
  onSubmit(): void {
    this.markFormGroupTouched(this.addTourForm);

    // File validation
    if (!this.mainImage) {
      this.toastService.show('Please upload a main image.', 'warning');
      return;
    }
    if (this.galleryFiles.length !== 6) {
      this.toastService.show(`Please upload exactly 6 gallery images. Currently: ${this.galleryFiles.length}`, 'warning');
      return;
    }

    // Form validation
    if (this.addTourForm.invalid) {
      let message = 'Please fix the following:\n';
      let hasError = false;

      if (this.addTourForm.get('name')?.invalid) {
        message += '- Title is required (min 3 chars)\n';
        hasError = true;
      }
      if (this.addTourForm.get('destination')?.invalid) {
        message += '- Destination is required\n';
        hasError = true;
      }
      if (this.addTourForm.get('startDate')?.invalid) {
        message += '- Start date is required\n';
        hasError = true;
      }
      if (this.addTourForm.get('endDate')?.hasError('endDateBeforeStart')) {
        message += '- End date must be after start date\n';
        hasError = true;
      }
      if (this.includedItemsArray.length < 4) {
        message += `- Add ${4 - this.includedItemsArray.length} more 'Included' items\n`;
        hasError = true;
      }
      if (this.excludedItemsArray.length < 4) {
        message += `- Add ${4 - this.excludedItemsArray.length} more 'Excluded' items\n`;
        hasError = true;
      }

      if (hasError) {
        this.toastService.show(message, 'warning');
        return;
      }

      // Skip deep error logging in production
      this.toastService.show('Form has errors. Please check all fields.', 'warning');
      return;
    }

    const formValue = this.addTourForm.value;
    const formData = new FormData();

    // Append scalar fields
    formData.append('Name', formValue.name.trim());
    formData.append('StartDate', new Date(formValue.startDate).toISOString());
    formData.append('EndDate', new Date(formValue.endDate).toISOString());
    formData.append('Description', formValue.description.trim());
    formData.append('Destination', formValue.destination.trim());
    formData.append('MaxGuests', formValue.maxGuests.toString());
    formData.append('MinGroupSize', formValue.minGroupSize?.toString() || '1');
    formData.append('MaxGroupSize', formValue.maxGroupSize?.toString() || '20');
    formData.append('Price', formValue.price.toString());
    formData.append('Category', formValue.category);
    formData.append('Languages', formValue.languages.trim());

    if (!formValue.tourCompanyId) {
      this.toastService.show('Tour company is required.', 'error');
      return;
    }
    formData.append('TourCompanyId', formValue.tourCompanyId.toString());

    // Files
    formData.append('Image', this.mainImage, this.mainImage.name);
    this.galleryFiles.forEach(item => {
      formData.append('GalleryImages', item.file, item.file.name);
    });

    // Lists
    const sanitize = (items: string[]) => items.map(i => i.trim()).filter(i => i);
    const included = sanitize(formValue.includedItems);
    const excluded = sanitize(formValue.excludedItems);

    if (included.length < 4 || excluded.length < 4) {
      this.toastService.show('You need at least 4 items in "Included" and "Excluded".', 'warning');
      return;
    }

    included.forEach(item => formData.append('IncludedItems', item));
    excluded.forEach(item => formData.append('ExcludedItems', item));

    // Questions
    formValue.questions.forEach((q: any, i: number) => {
      formData.append(`Questions[${i}].QuestionText`, q.questionText.trim());
      formData.append(`Questions[${i}].AnswerText`, q.answerText.trim());
    });

    // Tickets
    formValue.tickets.forEach((t: any, i: number) => {
      formData.append(`Tickets[${i}].Type`, t.type.trim());
      formData.append(`Tickets[${i}].Price`, t.price.toString());
      formData.append(`Tickets[${i}].AvailableQuantity`, t.availableQuantity.toString());
      formData.append(`Tickets[${i}].IsActive`, t.isActive.toString());
    });

    const request$ = this.isEditMode
      ? this.tourService.updateTour(this.tourId!, formData)
      : this.tourService.createTour(formData);

    request$.subscribe({
      next: () => {
        this.toastService.show(
          this.isEditMode
            ? '🎉 Tour updated successfully!'
            : '🎉 Tour created successfully!',
          'success'
        );
        this.router.navigate(['/tour-admin/tours']);
      },
      error: (err) => {
        const serverErrors = err.error?.errors;
        if (serverErrors) {
          Object.keys(serverErrors).forEach(field => {
            this.toastService.show(`${field}: ${serverErrors[field].join(', ')}`, 'error');
          });
        } else {
          this.toastService.show('Request failed. Please try again.', 'error');
        }
      }
    });
  }

  // === UTILS ===
  getCompanyName(id: number | null): string {
    return this.tourCompanies.find((c) => c.id === id)?.name || 'Unknown';
  }

  getToday(): string {
    return new Date().toISOString().split('T')[0];
  }

  private markFormGroupTouched(group: FormGroup): void {
    Object.keys(group.controls).forEach((key) => {
      const control = group.get(key);
      control?.markAsTouched();
      if (control instanceof FormArray) {
        control.controls.forEach((c) => c.markAsTouched());
      }
    });
  }
}
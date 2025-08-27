import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CarRentalCompany, CarRentalService } from '../../../../core/services/CarRental-Services';
import { Car, CarCreateUpdate, CarService } from '../../../../core/services/Car-Services';

// Toast interface
interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
  visible: boolean;
}

@Component({
  selector: 'app-car-rental-agency-car-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './car-rental-agency-car-edit.html',
  styleUrls: ['./car-rental-agency-car-edit.css']
})
export class CarRentalAgencyCarEdit implements OnInit {
  carForm: FormGroup;
  selectedImage: File | null = null;
  imagePreview: string | null = null;
  currentImageUrl: string | null = null;
  loading = false;
  loadingCar = false;
  error = '';
  success = '';
  companies: CarRentalCompany[] = [];
  carId: number = 0;
  car: Car | null = null;

  // Toasts
  private toastId = 0;
  toasts: Toast[] = [];

  constructor(
    private fb: FormBuilder,
    private carService: CarService,
    private carRentalService: CarRentalService,
    private router: Router,
    private route: ActivatedRoute,
    private cd: ChangeDetectorRef
  ) {
    this.carForm = this.fb.group({
      model: ['', [Validators.required, Validators.minLength(2)]],
      price: ['', [Validators.required, Validators.min(0.01)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      isAvailable: [true],
      location: ['', [Validators.required, Validators.minLength(2)]],
      capacity: ['', [Validators.required, Validators.min(1), Validators.max(50)]],
      rentalCompanyId: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.carId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.carId) {
      this.loadCar();
      this.loadCompanies();
    } else {
      this.router.navigate(['/car-admin/Cars']);
    }
  }

  loadCar(): void {
    this.loadingCar = true;
    this.error = '';
    this.cd.detectChanges();

    this.carService.getCar(this.carId).subscribe({
      next: (car) => {
        this.car = car;
        this.currentImageUrl = car.imageUrl;
        this.carForm.patchValue({
          model: car.model,
          price: car.price,
          description: car.description,
          isAvailable: car.isAvailable,
          location: car.location,
          capacity: car.capacity,
          rentalCompanyId: car.rentalCompanyId
        });
        this.loadingCar = false;
        this.cd.detectChanges();
      },
      error: (error) => {
        this.showToast('Failed to load car details.', 'error');
        this.loadingCar = false;
        this.cd.detectChanges();
      }
    });
  }

  loadCompanies(): void {
    this.carRentalService.getMyCompanies().subscribe({
      next: (companies) => {
        this.companies = companies;
        this.cd.detectChanges();
      },
      error: (error) => {
        this.showToast('Failed to load rental companies.', 'error');
        this.cd.detectChanges();
      }
    });
  }

  onImageSelected(event: any): void {
    const file = event.target.files?.[0] || event.dataTransfer?.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      this.showToast('Please select a valid image file.', 'error');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      this.showToast('Image size should not exceed 5MB.', 'error');
      return;
    }

    this.selectedImage = file;
    this.error = '';

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result as string;
      this.cd.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  removeImage(): void {
    this.selectedImage = null;
    this.imagePreview = null;
    this.cd.detectChanges();
  }

  onSubmit(): void {
    if (this.carForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';
    this.cd.detectChanges();

    const startTime = Date.now();

    const formData: CarCreateUpdate = {
      ...this.carForm.value,
      image: this.selectedImage || undefined
    };

    this.carService.updateCar(this.carId, formData).subscribe({
      next: () => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(1000 - elapsed, 0);

        setTimeout(() => {
          this.loading = false;
          this.showToast('Car updated successfully!', 'success');
          setTimeout(() => {
            this.router.navigate(['/car-admin/Cars']);
          }, 1000);
        }, remaining);
      },
      error: (err) => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(1000 - elapsed, 0);

        setTimeout(() => {
          this.loading = false;
          this.showToast('Failed to update car. Please try again.', 'error');
        }, remaining);
      }
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.carForm.controls).forEach(key => {
      const control = this.carForm.get(key);
      control?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.carForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.carForm.get(fieldName);
    if (field && field.errors && (field.dirty || field.touched)) {
      if (field.errors['required']) return `${fieldName} is required.`;
      if (field.errors['minlength']) return `${fieldName} is too short.`;
      if (field.errors['min']) return `${fieldName} must be greater than 0.`;
      if (field.errors['max']) return `${fieldName} value is too high.`;
    }
    return '';
  }

  onCancel(): void {
    this.router.navigate(['/car-admin/Cars']);
  }

  getCurrentImage(): string | null {
    return this.imagePreview || this.currentImageUrl;
  }

  // Drag & Drop
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    (event.currentTarget as HTMLElement).classList.add('dragover');
  }

  onDragLeave(event: DragEvent): void {
    (event.currentTarget as HTMLElement).classList.remove('dragover');
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    (event.currentTarget as HTMLElement).classList.remove('dragover');
    this.onImageSelected(event);
  }

  // === Toast Management ===
  showToast(message: string, type: 'success' | 'error' | 'info'): void {
    const id = ++this.toastId;
    this.toasts.push({ id, message, type, visible: true });

    this.cd.detectChanges();

    setTimeout(() => {
      this.hideToast(id);
    }, 5000);
  }

  hideToast(id: number): void {
    const toast = this.toasts.find(t => t.id === id);
    if (toast) {
      toast.visible = false;
      setTimeout(() => {
        this.toasts = this.toasts.filter(t => t.id !== id);
        this.cd.detectChanges();
      }, 300);
    }
  }
}
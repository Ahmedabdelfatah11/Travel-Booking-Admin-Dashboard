import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CarRentalCompany, CarRentalService } from '../../../../core/services/CarRental-Services';
import { Car, CarCreateUpdate, CarService } from '../../../../core/services/Car-Services';

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
       this.cd.detectChanges();
    } else {
      this.router.navigate(['/car-admin/Cars']);
    }
  }

  loadCar(): void {
    this.loadingCar = true;
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
        this.error = 'Failed to load car details.';
        this.loadingCar = false;
         this.cd.detectChanges();
        console.error('Error loading car:', error);
      }
    });
  }

  loadCompanies(): void {
    this.carRentalService.getMyCompanies().subscribe({
      next: (companies) => {
        this.companies = companies;
      },
      error: (error) => {
        this.error = 'Failed to load rental companies.';
        console.error('Error loading companies:', error);
      }
    });
  }

onImageSelected(event: any): void {
  const file = event.target.files?.[0] || event.dataTransfer?.files?.[0];
  if (file) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      this.error = 'Please select a valid image file.';
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      this.error = 'Image size should not exceed 5MB.';
      return;
    }

    this.selectedImage = file;
    this.error = '';
    
    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }
}

  removeImage(): void {
    this.selectedImage = null;
    this.imagePreview = null;
  }

  onSubmit(): void {
    if (this.carForm.valid) {
      this.loading = true;
      this.error = '';
      this.success = '';

      const formData: CarCreateUpdate = {
        ...this.carForm.value,
        image: this.selectedImage || undefined
      };

      this.carService.updateCar(this.carId, formData).subscribe({
        next: () => {
          this.loading = false;
          this.success = 'Car updated successfully!';
          setTimeout(() => {
            this.router.navigate(['/car-admin/Cars']);
          }, 1500);
        },
        error: (error) => {
          this.loading = false;
          this.error = 'Failed to update car. Please try again.';
          console.error('Error updating car:', error);
        }
      });
    } else {
      this.markFormGroupTouched();
    }
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

  // Add these methods to your component class
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

}
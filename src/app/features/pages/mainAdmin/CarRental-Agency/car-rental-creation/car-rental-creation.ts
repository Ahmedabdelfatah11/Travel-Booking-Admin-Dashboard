import { Component, DOCUMENT, Inject, OnInit } from '@angular/core';
import { SuperadminServices } from '../../../../../core/services/superadmin-services';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ICarrental } from '../../../../../shared/Interfaces/i-carrental';

@Component({
  selector: 'app-car-rental-creation',
  imports: [ReactiveFormsModule, HttpClientModule, CommonModule],
  templateUrl: './car-rental-creation.html',
  styleUrl: './car-rental-creation.css'
})
export class CarRentalCreation implements OnInit {
  carRentalForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  selectedImage: File | null = null;
  imagePreview: string | null = null;
  admins: any[] = [];
  isLoadingAdmins = false;

  constructor(
    private superadminService: SuperadminServices,
    private router: Router,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.carRentalForm = new FormGroup({
      name: new FormControl('', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]),
      description: new FormControl('', [Validators.maxLength(500)]),
      location: new FormControl('', [Validators.required, Validators.maxLength(200)]),
      rating: new FormControl('', [Validators.min(0), Validators.max(5)]),
      adminId: new FormControl('', [Validators.required])
    });
  }

  ngOnInit(): void {
    this.loadAdmins();
  }

  loadAdmins(): void {
    this.isLoadingAdmins = true;
    this.superadminService.getAllUsers(1, 100).subscribe({
      next: (response: any) => {
        console.log('✅ Users loaded:', response);
        if (response.users && Array.isArray(response.users)) {
          // Filter users who have CarRentalAdmin role or no specific company role yet
          this.admins = response.users.filter((user: any) => 
            user.roles && (
              user.roles.includes('CarRentalAdmin') || 
              (!user.roles.includes('HotelAdmin') && !user.roles.includes('FlightAdmin') && !user.roles.includes('TourAdmin'))
            )
          );
        }
        this.isLoadingAdmins = false;
      },
      error: (error) => {
        console.error('❌ Error loading admins:', error);
        this.isLoadingAdmins = false;
      }
    });
  }

  onImageSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.errorMessage = 'Please select a valid image file.';
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.errorMessage = 'Image size must be less than 5MB.';
        return;
      }

      this.selectedImage = file;
      this.errorMessage = '';

      // Create image preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(): void {
    this.selectedImage = null;
    this.imagePreview = null;
    // Reset the file input
    const fileInput = this.document.getElementById('imageInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  // Method to trigger file input click
  triggerFileInput(): void {
    const fileInput = this.document.getElementById('imageInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  onSubmit(): void {
    if (this.carRentalForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const formData = this.carRentalForm.value;
      
      const carRentalData: ICarrental = {
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        location: formData.location.trim(),
        rating: formData.rating ? parseFloat(formData.rating) : undefined,
        adminId: formData.adminId,
        image: this.selectedImage || undefined
      };

      console.log('📝 Submitting car rental data:', carRentalData);

      this.superadminService.createCarRentalCompany(carRentalData).subscribe({
        next: (response) => {
          console.log('✅ Car rental company created successfully:', response);
          this.successMessage = 'Car rental company created successfully!';
          this.isLoading = false;

          // Reset form after successful creation
          setTimeout(() => {
            this.router.navigate(['/admin/car-rentals']);
          }, 1500);
        },
        error: (error) => {
          console.error('❌ Error creating car rental company:', error);
          this.errorMessage = error.userMessage || 'Failed to create car rental company. Please try again.';
          this.isLoading = false;
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  onCancel(): void {
    this.router.navigate(['/admin/car-rentals']);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.carRentalForm.controls).forEach(key => {
      const control = this.carRentalForm.get(key);
      if (control) {
        control.markAsTouched();
      }
    });
  }

  // Helper methods for template
  get name() { return this.carRentalForm.get('name'); }
  get description() { return this.carRentalForm.get('description'); }
  get location() { return this.carRentalForm.get('location'); }
  get rating() { return this.carRentalForm.get('rating'); }
  get adminId() { return this.carRentalForm.get('adminId'); }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.carRentalForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.carRentalForm.get(fieldName);
    if (field && field.errors && (field.dirty || field.touched)) {
      if (field.errors['required']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required.`;
      }
      if (field.errors['minlength']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least ${field.errors['minlength'].requiredLength} characters.`;
      }
      if (field.errors['maxlength']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} cannot exceed ${field.errors['maxlength'].requiredLength} characters.`;
      }
      if (field.errors['min']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} cannot be less than ${field.errors['min'].min}.`;
      }
      if (field.errors['max']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} cannot be greater than ${field.errors['max'].max}.`;
      }
    }
    return '';
  }
}
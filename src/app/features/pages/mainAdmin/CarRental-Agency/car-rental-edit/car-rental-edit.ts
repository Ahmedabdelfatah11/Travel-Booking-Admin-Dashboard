import { ChangeDetectorRef, Component, DOCUMENT, Inject, OnInit } from '@angular/core';
import { SuperadminServices } from '../../../../../core/services/superadmin-services';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-car-rental-edit',
  imports: [ReactiveFormsModule, HttpClientModule, CommonModule],
  templateUrl: './car-rental-edit.html',
  styleUrls: ['../car-rental-creation/car-rental-creation.css'] // Reuse the creation CSS
})
export class CarRentalEditComponent implements OnInit {
  carRentalForm: FormGroup;
  isLoading = false;
  isLoadingData = true;
  errorMessage = '';
  successMessage = '';
  selectedImage: File | null = null;
  imagePreview: string | null = null;
  currentImageUrl: string | null = null;
  admins: any[] = [];
  isLoadingAdmins = false;
  companyId: number = 0;
  originalData: any = null;

  constructor(
    private superadminService: SuperadminServices,
    private router: Router,
    private route: ActivatedRoute,
     private cd: ChangeDetectorRef, 
    @Inject(DOCUMENT) private document: Document
  ) {
    this.carRentalForm = new FormGroup({
      name: new FormControl('', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]),
      description: new FormControl('', [Validators.maxLength(500)]),
      location: new FormControl('', [Validators.required, Validators.maxLength(200)]),
      rating: new FormControl(''),
      adminId: new FormControl('')
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.companyId = +params['id'];
      if (this.companyId) {
        this.loadCompanyData();
        this.loadAdmins();
      } else {
        this.errorMessage = 'Invalid company ID';
        this.isLoadingData = false;
      }
    });
  }

  loadCompanyData(): void {
    this.isLoadingData = true;
    this.superadminService.getCarRentalCompany(this.companyId).subscribe({
      next: (company: any) => {
        console.log('✅ Company data loaded:', company);
        this.originalData = company;
        
        // Populate form with existing data
        this.carRentalForm.patchValue({
          name: company.name || '',
          description: company.description || '',
          location: company.location || '',
          rating: company.rating ? company.rating.toString() : '',
          adminId: company.adminId || ''
        });

        this.currentImageUrl = company.imageUrl;
        this.isLoadingData = false;
         this.cd.detectChanges();
      },
      error: (error) => {
        console.error('❌ Error loading company data:', error);
        this.errorMessage = error.userMessage || 'Failed to load company data';
        this.isLoadingData = false;
         this.cd.detectChanges();
      }
    });
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
         this.cd.detectChanges();
      },
      error: (error) => {
        console.error('❌ Error loading admins:', error);
        this.isLoadingAdmins = false;
         this.cd.detectChanges();
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
      
      const updateData = {
        id: this.companyId,
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        location: formData.location.trim(),
        rating: formData.rating ? parseFloat(formData.rating) : undefined,
        adminId: formData.adminId,
        image: this.selectedImage || undefined
      };

      console.log('📝 Updating car rental data:', updateData);

      this.superadminService.updateCarRentalCompany(this.companyId, updateData).subscribe({
        next: (response) => {
          console.log('✅ Car rental company updated successfully:', response);
          this.successMessage = 'Car rental company updated successfully!';
          this.isLoading = false;

          // Navigate back after successful update
          setTimeout(() => {
            this.router.navigate(['/admin/car-rentals']);
          }, 1500);
        },
        error: (error) => {
          console.error('❌ Error updating car rental company:', error);
          this.errorMessage = error.userMessage || 'Failed to update car rental company. Please try again.';
          this.isLoading = false;
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  onCancel(): void {
    this.router.navigate(['/car']);
  }

  resetForm(): void {
    if (this.originalData) {
      this.carRentalForm.patchValue({
        name: this.originalData.name || '',
        description: this.originalData.description || '',
        location: this.originalData.location || '',
        rating: this.originalData.rating ? this.originalData.rating.toString() : '',
        adminId: this.originalData.adminId || ''
      });
      
      this.selectedImage = null;
      this.imagePreview = null;
      const fileInput = this.document.getElementById('imageInput') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    }
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

  getCurrentImageSrc(): string {
    return this.imagePreview || this.currentImageUrl || 'assets/images/default-car-company.jpg';
  }

  hasImageChanged(): boolean {
    return this.selectedImage !== null;
  }
}
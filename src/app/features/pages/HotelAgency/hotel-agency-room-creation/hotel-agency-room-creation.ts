import { Component, OnInit, signal, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HotelService } from '../../../../core/services/hotel-service';
import { HotelDTO } from '../../../../shared/Interfaces/ihotel';
import { finalize } from 'rxjs';

// Interface for selected images
interface SelectedImage {
  file: File;
  preview: string;
}

// Custom Validators
function futureDateValidator(control: any) {
  if (!control.value) return null;
  const selectedDate = new Date(control.value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return selectedDate >= today ? null : { futureDate: true };
}

function endDateAfterStartValidator(group: FormGroup) {
  const from = group.get('from')?.value;
  const to = group.get('to')?.value;
  
  if (!from || !to) return null;
  
  return new Date(to) > new Date(from) ? null : { endDateInvalid: true };
}

@Component({
  selector: 'app-hotel-agency-room-creation',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './hotel-agency-room-creation.html',
  styleUrl: './hotel-agency-room-creation.css'
})
export class HotelAgencyRoomCreation implements OnInit {
  roomForm!: FormGroup;
  
  // Signals for reactive state management
  hotels = signal<HotelDTO[]>([]);
  selectedImages = signal<SelectedImage[]>([]);
  isDragOver = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  
  // Minimum date (today)
  minDate: string | undefined;
  
  // Maximum file size (5MB)
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024;
  private readonly MAX_IMAGES = 3;
  private readonly ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private hotelService = inject(HotelService);

  ngOnInit() {
    this.initializeForm();
    this.setMinDate();
    this.loadHotels();
  }

  private initializeForm() {
    this.roomForm = this.fb.group({
      roomType: ['', [Validators.required]],
      price: [0, [Validators.required, Validators.min(0)]],
      hotelCompanyId: ['', [Validators.required]],
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      from: ['', [Validators.required, futureDateValidator]],
      to: ['', [Validators.required, futureDateValidator]],
      isAvailable: [true]
    }, { 
      validators: endDateAfterStartValidator 
    });

    // Update minimum date for 'to' field when 'from' changes
    this.roomForm.get('from')?.valueChanges.subscribe(value => {
      if (value) {
        this.roomForm.get('to')?.updateValueAndValidity();
      }
    });
  }

  private setMinDate() {
    const today = new Date();
    this.minDate = today.toISOString().slice(0, 16);
  }

  private loadHotels() {
    this.hotelService.getMyHotels().subscribe({
      next: (hotels) => {
        this.hotels.set(hotels);
      },
      error: (error) => {
        console.error('Error loading hotels:', error);
        this.setErrorMessage('Failed to load hotels. Please refresh the page.');
      }
    });
  }

  // File handling methods
  onFilesSelected(event: any) {
    const files = Array.from(event.target.files) as File[];
    this.processFiles(files);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
    
    const files = Array.from(event.dataTransfer?.files || []) as File[];
    this.processFiles(files);
  }

  private processFiles(files: File[]) {
    const currentImages = this.selectedImages();
    const remainingSlots = this.MAX_IMAGES - currentImages.length;
    
    if (remainingSlots <= 0) {
      this.setErrorMessage('You can only upload up to 3 images.');
      return;
    }

    const filesToProcess = files.slice(0, remainingSlots);
    const validFiles: SelectedImage[] = [];

    for (const file of filesToProcess) {
      // Validate file type
      if (!this.ALLOWED_TYPES.includes(file.type)) {
        this.setErrorMessage(`Invalid file type: ${file.name}. Only JPG, JPEG, PNG, WEBP are allowed.`);
        continue;
      }

      // Validate file size
      if (file.size > this.MAX_FILE_SIZE) {
        this.setErrorMessage(`File too large: ${file.name}. Maximum size is 5MB.`);
        continue;
      }

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        validFiles.push({
          file: file,
          preview: e.target?.result as string
        });

        // Update selected images when all files are processed
        if (validFiles.length === filesToProcess.length) {
          this.selectedImages.set([...currentImages, ...validFiles]);
        }
      };
      reader.readAsDataURL(file);
    }

    if (files.length > remainingSlots) {
      this.setErrorMessage(`Only ${remainingSlots} more images can be added.`);
    }
  }

  removeImage(index: number) {
    const currentImages = this.selectedImages();
    const updatedImages = currentImages.filter((_, i) => i !== index);
    this.selectedImages.set(updatedImages);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Form validation helpers
  isFieldInvalid(fieldName: string): boolean {
    const field = this.roomForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.roomForm.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.errors['required']) return `${this.getFieldLabel(fieldName)} is required.`;
    if (field.errors['min']) return `${this.getFieldLabel(fieldName)} must be greater than 0.`;
    if (field.errors['minlength']) return `${this.getFieldLabel(fieldName)} must be at least ${field.errors['minlength'].requiredLength} characters.`;
    if (field.errors['maxlength']) return `${this.getFieldLabel(fieldName)} must not exceed ${field.errors['maxlength'].requiredLength} characters.`;
    if (field.errors['futureDate']) return `${this.getFieldLabel(fieldName)} must be in the future.`;
    
    // Handle form-level validator for date range
    if (fieldName === 'to' && this.roomForm.errors?.['endDateInvalid']) {
      return 'End date must be after start date.';
    }

    return 'Invalid value.';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      roomType: 'Room Type',
      price: 'Price',
      hotelCompanyId: 'Hotel',
      description: 'Description',
      from: 'Start Date',
      to: 'End Date'
    };
    return labels[fieldName] || fieldName;
  }

  // Message handling
  setSuccessMessage(message: string) {
    this.successMessage.set(message);
    this.errorMessage.set(null);
    setTimeout(() => this.successMessage.set(null), 5000);
  }

  setErrorMessage(message: string) {
    this.errorMessage.set(message);
    this.successMessage.set(null);
    setTimeout(() => this.errorMessage.set(null), 5000);
  }

  dismissSuccess() {
    this.successMessage.set(null);
  }

  dismissError() {
    this.errorMessage.set(null);
  }

  // Form submission
  onSubmit() {
    if (this.roomForm.invalid) {
      this.markFormGroupTouched();
      this.setErrorMessage('Please fix all validation errors before submitting.');
      return;
    }

    if (this.selectedImages().length === 0) {
      this.setErrorMessage('Please select at least one image for the room.');
      return;
    }

    this.isSubmitting.set(true);
    
    // Prepare form data
    const formData = new FormData();
    const formValue = this.roomForm.value;

    // Add form fields
    formData.append('roomType', formValue.roomType);
    formData.append('price', formValue.price.toString());
    formData.append('hotelCompanyId', formValue.hotelCompanyId);
    formData.append('description', formValue.description);
    formData.append('from', new Date(formValue.from).toISOString());
    formData.append('to', new Date(formValue.to).toISOString());
    formData.append('isAvailable', formValue.isAvailable.toString());

    // Add images
    this.selectedImages().forEach((imageData, index) => {
      formData.append('roomImages', imageData.file);
    });

    // Submit to API
    this.hotelService.createFlight(formData).pipe(
      finalize(() => this.isSubmitting.set(false))
    ).subscribe({
      next: (response) => {
        this.setSuccessMessage('Room created successfully!');
        
        // Reset form after successful creation
        setTimeout(() => {
          this.router.navigate(['/hotel-admin/Rooms']);
        }, 2000);
      },
      error: (error) => {
        console.error('Error creating room:', error);
        let errorMsg = 'Failed to create room. Please try again.';
        
        if (error.error?.message) {
          errorMsg = error.error.message;
        } else if (error.message) {
          errorMsg = error.message;
        }
        
        this.setErrorMessage(errorMsg);
      }
    });
  }

  private markFormGroupTouched() {
    Object.keys(this.roomForm.controls).forEach(field => {
      const control = this.roomForm.get(field);
      control?.markAsTouched({ onlySelf: true });
    });
  }

  // Reset form
  resetForm() {
    this.roomForm.reset({
      isAvailable: true,
      price: 0
    });
    this.selectedImages.set([]);
    this.successMessage.set(null);
    this.errorMessage.set(null);
  }
}
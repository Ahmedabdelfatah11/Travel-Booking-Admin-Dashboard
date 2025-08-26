import { Component, OnInit, signal, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { finalize, of } from 'rxjs';
import { HotelDTO, Room } from '../../../../shared/Interfaces/ihotel';
import { HotelService } from '../../../../core/services/hotel-service';

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
  selector: 'app-hotel-agency-room-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './hotel-agency-room-edit.html',
  styleUrl: './hotel-agency-room-edit.css'
})
export class HotelAgencyRoomEdit implements OnInit {
  roomForm!: FormGroup;
  roomId!: number;

  // Signals for reactive state management
  room = signal<Room | null>(null);
  hotels = signal<HotelDTO[]>([]);
  selectedImages = signal<SelectedImage[]>([]);
  existingImages = signal<string[]>([]);
  isDragOver = signal<boolean>(false);
  isLoading = signal<boolean>(false);
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
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private hotelService = inject(HotelService);

  ngOnInit(): void {
    this.initializeForm();
    this.setMinDate();
    this.getRoomId();
    this.loadHotels();
  }

  private initializeForm(): void {
    this.roomForm = this.fb.group({
      roomType: ['', [Validators.required]],
      price: [0, [Validators.required, Validators.min(0)]],
      hotelCompanyId: ['', [Validators.required]],
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      from: [''],
      to: [''],
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

  private getRoomId(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.roomId = +id;
      this.loadRoomData();
    } else {
      this.setErrorMessage('Room ID not found');
    }
  }

  private loadRoomData(): void {
    this.isLoading.set(true);
    this.hotelService.getRoomById(this.roomId).subscribe({
      next: (room) => {
        this.room.set(room);
        this.populateForm();
        const imageUrls: string[] = [];
        for (const img of room.roomImages || []) {
          if (img?.imageUrl) {
            imageUrls.push(img.imageUrl);
          }
        }
        this.existingImages.set(imageUrls);

        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading room:', error);
        this.setErrorMessage('Failed to load room data');
        this.isLoading.set(false);
      }
    });
  }

  private loadHotels(): void {
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

  private populateForm(): void {
    const roomData = this.room();
    if (roomData) {
      this.roomForm.patchValue({
        roomType: roomData.roomType,
        price: roomData.price,
        hotelCompanyId: roomData.hotelCompanyId,
        description: roomData.description,
        isAvailable: roomData.isAvailable
      });
    }
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
    setTimeout(() => this.errorMessage.set(null), 8000);
  }

  dismissSuccess() {
    this.successMessage.set(null);
  }

  dismissError() {
    this.errorMessage.set(null);
  }

  // Form submission

onSubmit(): void {
  if (this.roomForm.invalid) {
    this.markFormGroupTouched();
    this.setErrorMessage('Please fix all validation errors before submitting.');
    return;
  }

  this.isSubmitting.set(true);

  // Prepare form data
  const formData = new FormData();
  const formValue = this.roomForm.value;

  // Add form fields - matching the backend DTO property names
  formData.append('RoomType', formValue.roomType);
  formData.append('Price', formValue.price.toString());
  formData.append('HotelCompanyId', formValue.hotelCompanyId.toString());
  formData.append('IsAvailable', formValue.isAvailable.toString());
  
  // Add description if you have it in your DTO (you might need to add this to RoomUpdateDTO)
  if (formValue.description) {
    formData.append('Description', formValue.description);
  }

  // Add images only if new ones are selected
  this.selectedImages().forEach((imageData) => {
    formData.append('RoomImages', imageData.file, imageData.file.name);
  });

  // Log FormData for debugging
  console.log('Submitting FormData for room ID:', this.roomId);
  formData.forEach((value, key) => {
    console.log(`${key}:`, value);
  });

  // Submit to API
  this.hotelService.updateRoom(this.roomId, formData).pipe(
    finalize(() => this.isSubmitting.set(false))
  ).subscribe({
    next: () => {
      this.setSuccessMessage('Room updated successfully!');

      // Redirect after successful update
      setTimeout(() => {
        this.router.navigate(['/hotel-admin/rooms']);
      }, 2000);
    },
    error: (error) => {
      console.error('Error updating room:', error);
      let errorMsg = 'Failed to update room. Please try again.';

      if (error.error?.message) {
        errorMsg = error.error.message;
      } else if (error.error?.errors) {
        // Handle validation errors from ASP.NET Core
        const errors = Object.values(error.error.errors).flat().join(', ');
        errorMsg = errors || errorMsg;
      } else if (error.message) {
        errorMsg = error.message;
      }

      this.setErrorMessage(errorMsg);
    }
  });
}


  private markFormGroupTouched(): void {
    Object.keys(this.roomForm.controls).forEach(field => {
      const control = this.roomForm.get(field);
      control?.markAsTouched({ onlySelf: true });
    });
  }

  onCancel(): void {
    this.router.navigate(['/hotel-admin/Rooms']);
  }
}
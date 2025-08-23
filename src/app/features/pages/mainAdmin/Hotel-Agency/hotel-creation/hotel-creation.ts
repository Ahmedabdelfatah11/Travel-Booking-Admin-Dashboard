import { Component } from '@angular/core';
import { SuperadminServices } from '../../../../../core/services/superadmin-services';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-hotel-creation',
 imports: [ReactiveFormsModule, HttpClientModule],
  templateUrl: './hotel-creation.html',
  styleUrl: './hotel-creation.css'
})
export class HotelCreation {
constructor(private superadminServices: SuperadminServices) { }

  // للاختبار - أضف هذا الـ method
  testAPI() {
    this.superadminServices.testEndpoint().subscribe({
      next: (response) => {
        console.log('API test successful:', response);
      },
      error: (error) => {
        console.log('API test error:', error);
      }
    });
  }

  createhotelForm: FormGroup = new FormGroup({
    name: new FormControl('', [Validators.required]),
    description: new FormControl('', [Validators.required]),
    location: new FormControl('', [Validators.required]),
    rating: new FormControl(''),
    adminId: new FormControl('')
  });

  imageFile: File | null = null;

  onFileChange(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.imageFile = event.target.files[0];
      console.log('File selected:', this.imageFile!.name);
    }
  }

  createHotelCompany() {
    console.log('Form submitted');
    console.log('Form valid:', this.createhotelForm.valid);
    console.log('Image file:', this.imageFile);

    if (!this.createhotelForm.valid) {
      console.error('Form is invalid');
      console.log('Form errors:', this.createhotelForm.errors);
      return;
    }

    if (!this.imageFile) {
      console.error('Image is required');
      return;
    }

    // Create the model object that matches what SuperadminServices.createTour expects
    const model = {
      name: this.createhotelForm.get('name')?.value,
      description: this.createhotelForm.get('description')?.value || '',
      location: this.createhotelForm.get('location')?.value || '',
      rating: this.createhotelForm.get('rating')?.value || null,
      adminId: this.createhotelForm.get('adminId')?.value || '',
      image: this.imageFile
    };

    console.log('Sending model:', model);

    this.superadminServices.createHotelCompany(model).subscribe({
      next: (response) => {
        console.log('Tour created successfully', response);
        alert('Tour company created successfully!');
        
        // Reset form after successful creation
        this.createhotelForm.reset();
        this.imageFile = null;
        
        // Reset file input
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
      },
      error: (error) => {
        console.error('Error creating tour', error);
        
        if (error.status === 405) {
          console.error('405 Method Not Allowed - Check if the API endpoint exists and accepts POST requests');
        }
        
        if (error.error) {
          console.error('Server error details:', error.error);
        }
        
        alert('Error creating tour company. Check console for details.');
      }
    });
  }

}

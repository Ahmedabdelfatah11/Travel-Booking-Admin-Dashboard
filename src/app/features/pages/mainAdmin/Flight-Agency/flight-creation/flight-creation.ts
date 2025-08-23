import { Component } from '@angular/core';
import { SuperadminServices } from '../../../../../core/services/superadmin-services';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-flight-creation',
   imports: [ReactiveFormsModule, HttpClientModule],
  templateUrl: './flight-creation.html',
  styleUrl: './flight-creation.css'
})
export class FlightCreation {
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

  createflightForm: FormGroup = new FormGroup({
    name: new FormControl(''),
    description: new FormControl(''),
    location: new FormControl(''),
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

  createFlightCompany() {
    console.log('Form submitted');
    console.log('Form valid:', this.createflightForm.valid);
    console.log('Image file:', this.imageFile);

    if (!this.createflightForm.valid) {
      console.error('Form is invalid');
      console.log('Form errors:', this.createflightForm.errors);
      return;
    }

    if (!this.imageFile) {
      console.error('Image is required');
      return;
    }

    // Create the model object that matches what SuperadminServices.createTour expects
    const model = {
      name: this.createflightForm.get('name')?.value,
      description: this.createflightForm.get('description')?.value || '',
      location: this.createflightForm.get('location')?.value || '',
      rating: this.createflightForm.get('rating')?.value || null,
      adminId: this.createflightForm.get('adminId')?.value || '',
      image: this.imageFile
    };

    console.log('Sending model:', model);

    this.superadminServices.createHotelCompany(model).subscribe({
      next: (response) => {
        console.log('Tour created successfully', response);
        alert('Tour company created successfully!');
        
        // Reset form after successful creation
        this.createflightForm.reset();
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

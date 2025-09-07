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

  testAPI() {
    this.superadminServices.testEndpoint().subscribe({
      next: (response) => {
      },
      error: (error) => {
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
    }
  }

  createFlightCompany() {
  

    if (!this.createflightForm.valid) {
      return;
    }

    if (!this.imageFile) {
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


    this.superadminServices.createHotelCompany(model).subscribe({
      next: (response) => {
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
                alert('Error creating flight company. Check console for details.');

       
      }
    });
  }

}

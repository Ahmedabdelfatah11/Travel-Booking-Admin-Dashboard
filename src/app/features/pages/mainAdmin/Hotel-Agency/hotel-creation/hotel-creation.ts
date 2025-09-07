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
    }
  }

  createHotelCompany() {

    if (!this.createhotelForm.valid) {

      return;
    }

    if (!this.imageFile) {
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


    this.superadminServices.createHotelCompany(model).subscribe({
      next: (response) => {
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

        
        alert('Error creating tour company. Check console for details.');
      }
    });
  }

}

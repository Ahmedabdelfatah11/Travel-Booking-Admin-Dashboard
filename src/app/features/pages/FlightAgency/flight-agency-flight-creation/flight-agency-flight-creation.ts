// flight-agency-flight-creation.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FlightService } from '../../../../core/services/flight-service';
import { FlightCompanyDto, FlightCreated } from '../../../../shared/Interfaces/iflight';

@Component({
  selector: 'app-flight-agency-flight-creation',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './flight-agency-flight-creation.html',
  styleUrls: ['./flight-agency-flight-creation.css']
})
export class FlightAgencyFlightCreation implements OnInit {
  flightForm: FormGroup;
  flightCompanies: FlightCompanyDto[] = [];
  isLoading = false;
  successMessage = '';
  errorMessage = '';
  minDateTime = '';

  constructor(
    private fb: FormBuilder,
    private flightService: FlightService
  ) {
    this.flightForm = this.createForm();
  }

  ngOnInit() {
    this.setMinDateTime();
    this.loadFlightCompanies();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      departureAirport: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(100)
      ]],
      arrivalAirport: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(100)
      ]],
      departureTime: ['', [Validators.required, this.futureDateValidator]],
      arrivalTime: ['', [Validators.required]],
      economySeats: ['', [Validators.required, Validators.min(1)]],
      businessSeats: [0, [Validators.min(0)]],
      firstClassSeats: [0, [Validators.min(0)]],
      economyPrice: [0, [Validators.min(0)]],
      businessPrice: [0, [Validators.min(0)]],
      firstClassPrice: [0, [Validators.min(0)]],
      flightCompanyId: ['', [Validators.required]]
    }, { validators: this.arrivalAfterDepartureValidator });
  }

  private setMinDateTime() {
    const now = new Date();
    const isoString = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString().slice(0, 16);
    this.minDateTime = isoString;
  }

  private loadFlightCompanies() {
    this.flightService.getMyFlights().subscribe({
      next: (companies) => {
        this.flightCompanies = companies;
      },
      error: (error) => {
        console.error('Error loading flight companies:', error);
        this.showError('Failed to load flight companies');
      }
    });
  }

  // Custom validators
  private futureDateValidator(control: any) {
    if (!control.value) return null;
    const selectedDate = new Date(control.value);
    const now = new Date();
    return selectedDate <= now ? { futureDate: true } : null;
  }

  private arrivalAfterDepartureValidator(formGroup: FormGroup) {
    const departure = formGroup.get('departureTime')?.value;
    const arrival = formGroup.get('arrivalTime')?.value;
    
    if (departure && arrival) {
      const departureDate = new Date(departure);
      const arrivalDate = new Date(arrival);
      return arrivalDate <= departureDate ? { arrivalAfterDeparture: true } : null;
    }
    return null;
  }

  // Getter methods for easy template access
  get departureAirport() { return this.flightForm.get('departureAirport'); }
  get arrivalAirport() { return this.flightForm.get('arrivalAirport'); }
  get departureTime() { return this.flightForm.get('departureTime'); }
  get arrivalTime() { return this.flightForm.get('arrivalTime'); }
  get economySeats() { return this.flightForm.get('economySeats'); }
  get flightCompanyId() { return this.flightForm.get('flightCompanyId'); }

  onSubmit() {
    if (this.flightForm.valid) {
      this.isLoading = true;
      this.clearMessages();

      const formData = this.prepareFormData();
      const formValues = this.flightForm.value;

      this.flightService.createFlight(formValues).subscribe({
        next: (response: FlightCreated) => {
          this.showSuccess('Flight created successfully!');
          this.resetForm();
        },
        error: (error) => {
          console.error('Error creating flight:', error);
          this.showError('Failed to create flight. Please try again.');
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    } else {
      this.markFormGroupTouched();
      this.showError('Please fix the validation errors before submitting.');
    }
  }

  private prepareFormData(): FormData {
    const formData = new FormData();
    const formValues = this.flightForm.value;

    // Convert dates to ISO string format
    formData.append('departureTime', new Date(formValues.departureTime).toISOString());
    formData.append('arrivalTime', new Date(formValues.arrivalTime).toISOString());
    
    // Add other form fields
    Object.keys(formValues).forEach(key => {
      if (key !== 'departureTime' && key !== 'arrivalTime') {
        formData.append(key, formValues[key].toString());
      }
    });

    return formData;
  }

  private markFormGroupTouched() {
    Object.keys(this.flightForm.controls).forEach(key => {
      const control = this.flightForm.get(key);
      control?.markAsTouched();
    });
  }

  private resetForm() {
    this.flightForm.reset();
    this.setMinDateTime();
    // Reset form values to defaults
    this.flightForm.patchValue({
      businessSeats: 0,
      firstClassSeats: 0,
      economyPrice: 0,
      businessPrice: 0,
      firstClassPrice: 0
    });
  }

  private showSuccess(message: string) {
    this.successMessage = message;
    setTimeout(() => this.successMessage = '', 5000);
  }

  private showError(message: string) {
    this.errorMessage = message;
  }

  private clearMessages() {
    this.successMessage = '';
    this.errorMessage = '';
  }

  // Helper method to check if field has specific error
  hasError(fieldName: string, errorType: string): boolean {
    const field = this.flightForm.get(fieldName);
    return !!(field?.hasError(errorType) && (field?.dirty || field?.touched));
  }

  // Helper method to get error message
  getErrorMessage(fieldName: string): string {
    const field = this.flightForm.get(fieldName);
    if (field?.hasError('required')) {
      return `${this.getFieldDisplayName(fieldName)} is required.`;
    }
    if (field?.hasError('minlength')) {
      return `${this.getFieldDisplayName(fieldName)} must be at least ${field.errors?.['minlength']?.requiredLength} characters.`;
    }
    if (field?.hasError('maxlength')) {
      return `${this.getFieldDisplayName(fieldName)} must be no more than ${field.errors?.['maxlength']?.requiredLength} characters.`;
    }
    if (field?.hasError('min')) {
      return `${this.getFieldDisplayName(fieldName)} must be greater than ${field.errors?.['min']?.min}.`;
    }
    if (field?.hasError('futureDate')) {
      return 'Departure time must be in the future.';
    }
    if (this.flightForm.hasError('arrivalAfterDeparture')) {
      return 'Arrival time must be after departure time.';
    }
    return '';
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      'departureAirport': 'Departure Airport',
      'arrivalAirport': 'Arrival Airport',
      'departureTime': 'Departure Time',
      'arrivalTime': 'Arrival Time',
      'economySeats': 'Economy Seats',
      'businessSeats': 'Business Seats',
      'firstClassSeats': 'First Class Seats',
      'economyPrice': 'Economy Price',
      'businessPrice': 'Business Price',
      'firstClassPrice': 'First Class Price',
      'flightCompanyId': 'Flight Company'
    };
    return displayNames[fieldName] || fieldName;
  }
}
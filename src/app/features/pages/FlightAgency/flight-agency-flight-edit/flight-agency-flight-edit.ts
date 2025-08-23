import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Flight } from '../../../../shared/Interfaces/iflight';
import { FlightService } from '../../../../core/services/flight-service';
import { finalize } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-flight-agency-flight-edit',
  imports: [ReactiveFormsModule, RouterLink, CommonModule],
  templateUrl: './flight-agency-flight-edit.html',
  styleUrls: ['./flight-agency-flight-edit.css']
})
export class FlightAgencyFlightEdit implements OnInit {
  flightForm!: FormGroup;
  flightId!: number;
  originalFlight: Flight | null = null; // Store original flight data
  
  // Signals for state management
  loading = signal<boolean>(true);
  updating = signal<boolean>(false);
  error = signal<string | null>(null);
  updateSuccess = signal<boolean>(false);

  // Services
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private flightService = inject(FlightService);

  ngOnInit(): void {
    this.initializeForm();
    this.getFlightId();
    this.loadFlightDetails();
  }

  private initializeForm(): void {
    this.flightForm = this.fb.group({
      departureAirport: ['', [Validators.required, Validators.minLength(3)]],
      arrivalAirport: ['', [Validators.required, Validators.minLength(3)]],
      departureTime: ['', Validators.required],
      arrivalTime: ['', Validators.required],
      economySeats: [0, [Validators.required, Validators.min(0)]],
      businessSeats: [0, [Validators.required, Validators.min(0)]],
      firstClassSeats: [0, [Validators.required, Validators.min(0)]],
      economyPrice: [0, [Validators.required, Validators.min(0)]],
      businessPrice: [0, [Validators.required, Validators.min(0)]],
      firstClassPrice: [0, [Validators.required, Validators.min(0)]]
    });
  }

  private getFlightId(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('Flight ID not found in route parameters');
      this.loading.set(false);
      return;
    }
    this.flightId = parseInt(id, 10);
  }

  private loadFlightDetails(): void {
    this.loading.set(true);
    this.error.set(null);

    this.flightService.getFlightById(this.flightId)
      .pipe(
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (flight: Flight) => {
          this.originalFlight = flight; // Store original data
          this.populateForm(flight);
        },
        error: (err) => {
          console.error('Error loading flight details:', err);
          this.error.set('Failed to load flight details. Please try again.');
        }
      });
  }

  private populateForm(flight: Flight): void {
    // Convert ISO dates to datetime-local format
    const departureTime = this.formatDateForInput(flight.departureTime);
    const arrivalTime = this.formatDateForInput(flight.arrivalTime);

    this.flightForm.patchValue({
      departureAirport: flight.departureAirport,
      arrivalAirport: flight.arrivalAirport,
      departureTime: departureTime,
      arrivalTime: arrivalTime,
      economySeats: flight.economySeats,
      businessSeats: flight.businessSeats,
      firstClassSeats: flight.firstClassSeats,
      economyPrice: flight.economyPrice,
      businessPrice: flight.businessPrice,
      firstClassPrice: flight.firstClassPrice
    });
  }

  private formatDateForInput(dateString: string): string {
    try {
      const date = new Date(dateString);
      // Format as YYYY-MM-DDTHH:MM for datetime-local input
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  }

  onSubmit(): void {
    if (this.flightForm.valid) {
      this.updateFlight();
    } else {
      this.markFormGroupTouched();
    }
  }

  private updateFlight(): void {
    this.updating.set(true);
    this.error.set(null);
    this.updateSuccess.set(false);

    if (!this.originalFlight) {
      this.error.set('Original flight data not available. Please reload the page.');
      this.updating.set(false);
      return;
    }

    // Create updated flight object preserving all original data and only updating editable fields
    const updatedFlight: Flight = {
      ...this.originalFlight, // Spread all original properties first
      // Override with form values
      id: this.flightId,
      flightId: this.flightId,
      departureAirport: this.flightForm.value.departureAirport,
      arrivalAirport: this.flightForm.value.arrivalAirport,
      departureTime: new Date(this.flightForm.value.departureTime).toISOString(),
      arrivalTime: new Date(this.flightForm.value.arrivalTime).toISOString(),
      economySeats: this.flightForm.value.economySeats,
      businessSeats: this.flightForm.value.businessSeats,
      firstClassSeats: this.flightForm.value.firstClassSeats,
      economyPrice: this.flightForm.value.economyPrice,
      businessPrice: this.flightForm.value.businessPrice,
      firstClassPrice: this.flightForm.value.firstClassPrice
    };

    console.log('Sending flight update:', updatedFlight); // Debug log

    this.flightService.updateFlight(this.flightId, updatedFlight)
      .pipe(
        finalize(() => this.updating.set(false))
      )
      .subscribe({
        next: () => {
          this.updateSuccess.set(true);
          // Hide success message after 3 seconds
          setTimeout(() => {
            this.updateSuccess.set(false);
          }, 3000);
        },
        error: (err) => {
          console.error('Error updating flight:', err);
          this.error.set('Failed to update flight. Please check your input and try again.');
        }
      });
  }

  resetForm(): void {
    this.loadFlightDetails(); // Reload original data
  }

  private markFormGroupTouched(): void {
    Object.keys(this.flightForm.controls).forEach(key => {
      const control = this.flightForm.get(key);
      control?.markAsTouched();
    });
  }

  // Helper method to check if a form field has errors
  hasFieldError(fieldName: string): boolean {
    const field = this.flightForm.get(fieldName);
    return !!(field?.invalid && field?.touched);
  }

  // Helper method to get field error message
  getFieldError(fieldName: string): string {
    const field = this.flightForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['minlength']) return `${fieldName} must be at least ${field.errors['minlength'].requiredLength} characters`;
      if (field.errors['min']) return `${fieldName} must be ${field.errors['min'].min} or greater`;
    }
    return '';
  }
}
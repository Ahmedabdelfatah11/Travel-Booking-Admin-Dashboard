import { Component, computed, inject, signal } from '@angular/core';
import { Flight } from '../../../../shared/Interfaces/iflight';
import { FlightService } from '../../../../core/services/flight-service';
import { DatePipe } from '@angular/common';
import { finalize } from 'rxjs';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-flight-agency-flight-list',
  imports: [DatePipe, RouterLink],
  templateUrl: './flight-agency-flight-list.html',
  styleUrl: './flight-agency-flight-list.css'
})
export class FlightAgencyFlightList {
  Flights = signal<Flight[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  deletingFlightId = signal<number | null>(null);
  successMessage = signal<string | null>(null);
  
  // ✅ Computed: derived state
  noFlights = computed(() => !this.loading() && this.Flights().length === 0);

  Flightservice = inject(FlightService);
  constructor(){
    this.loadFlights();
  }
  loadFlights(): void {
    this.loading.set(true);
    this.error.set(null);
    
    this.Flightservice.getMyFlights().pipe(
      finalize(() => {
        this.loading.set(false);
      })
    ).subscribe({
      next: (data) => {
        // Handle array response - extract flights from all companies
        if (Array.isArray(data) && data.length > 0) {
          // Flatten all flights from all companies into a single array
          const allFlights: Flight[] = data.flatMap(company => company.flights || []);
          this.Flights.set(allFlights);
        } else {
          this.Flights.set([]);
        }
      },
      error: (err) => {
        console.error('Error loading Flights:', err);
        this.error.set('Failed to load Flights.');
      }
    });
  }

  deleteFlight(flightId: number): void {
    // Show confirmation dialog
    const confirmed = window.confirm(
      'Are you sure you want to delete this flight? This action cannot be undone.'
    );
    
    if (!confirmed) {
      return;
    }

    this.deletingFlightId.set(flightId);
    this.error.set(null);
    this.successMessage.set(null);

    this.Flightservice.deleteFlight(flightId).pipe(
      finalize(() => {
        this.deletingFlightId.set(null);
      })
    ).subscribe({
      next: () => {
        // Remove the deleted flight from the list
        const updatedFlights = this.Flights().filter(flight => flight.flightId !== flightId);
        this.Flights.set(updatedFlights);
        
        // Show success message
        this.successMessage.set('Flight deleted successfully!');
        
        // Hide success message after 3 seconds
        setTimeout(() => {
          this.successMessage.set(null);
        }, 3000);
      },
      error: (err) => {
        console.error('Error deleting flight:', err);
        this.error.set('Failed to delete flight. Please try again.');
      }
    });
  }

  // Helper method to check if a specific flight is being deleted
  isDeleting(flightId: number): boolean {
    return this.deletingFlightId() === flightId;
  }

  // Method to dismiss error message
  dismissError(): void {
    this.error.set(null);
  }

  // Method to dismiss success message
  dismissSuccess(): void {
    this.successMessage.set(null);
  }
}
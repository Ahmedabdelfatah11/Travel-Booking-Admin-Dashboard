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
  // ✅ Computed: derived state
  noFlights = computed(() => !this.loading() && this.Flights().length === 0);

  Flightservice = inject(FlightService);
  constructor(){
    this.loadFlights();
  }
  loadFlights(): void {
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
      }       // ✅ Stop loading
      },
      error: (err) => {
        console.error('Error loading Flights:', err);
        this.error.set('Failed to load Flights.');
        this.loading.set(false);
      }
    });
  }
}

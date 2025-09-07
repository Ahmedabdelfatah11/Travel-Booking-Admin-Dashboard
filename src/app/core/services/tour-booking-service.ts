// src/app/core/services/tour-booking.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BookingTourDto } from '../../shared/Interfaces/i-tour';

@Injectable({
  providedIn: 'root'
})
export class TourBookingService {
  private baseUrl = 'http://pyramigo.runasp.net/api/TourCompany';

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    if (!token) {
    }
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // Get all bookings for the current tour company
  getBookingsByCompany(companyId: number): Observable<BookingTourDto[]> {
    const url = `${this.baseUrl}/${companyId}/bookings`;

    return this.http.get<BookingTourDto[]>(url, { headers: this.getAuthHeaders() });
  }
}
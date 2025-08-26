// src/app/core/services/tour-booking.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BookingTourDto } from '../../shared/Interfaces/i-tour';

@Injectable({
  providedIn: 'root'
})
export class TourBookingService {
  private baseUrl = 'https://localhost:7277/api';

  constructor(private http: HttpClient) {}

  // ✅ Get token and create headers
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken'); // or 'token' — check your login logic
    if (!token) {
      console.warn('🔐 No auth token found in localStorage');
    }
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // Get all bookings for the current tour company
  getBookingsByCompany(companyId: number): Observable<BookingTourDto[]> {
    const url = `${this.baseUrl}/TourCompany/${companyId}/bookings`;
    console.log('Fetching bookings from:', url); // 🔍 Debug
    return this.http.get<BookingTourDto[]>(url, { headers: this.getAuthHeaders() });
  }
}
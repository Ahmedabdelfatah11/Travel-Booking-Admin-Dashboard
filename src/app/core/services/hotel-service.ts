// hotel.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { HotelDashboardStats, HotelDTO, Rooms } from '../../shared/Interfaces/ihotel';

export interface Room {
  id: number;
  roomNumber: string;
  type: string;
  price: number;
  isAvailable: boolean;
}

export interface Hotel {
  id: number;
  name: string;
  description: string;
  location: string;
  imageUrl: string;
  rating: string;
  adminId?: string;
  rooms: Room[];
}

@Injectable({
  providedIn: 'root'
})
export class HotelService {
  private baseUrl = 'http://pyramigo.runasp.net/api/HotelCompany';
  private ApiUrl = 'http://pyramigo.runasp.net/api/Room';
  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }
  private getJsonAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }
  getHotelById(id: string | null): Observable<Hotel> {
    return this.http.get<Hotel>(`${this.baseUrl}/${id}`);
  }
  // get All rooms
  getRooms(): Observable<Rooms> {
    return this.http.get<Rooms>(this.ApiUrl, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }
  getMyHotels(): Observable<HotelDTO[]> {
    const url = `${this.baseUrl}/my-hotels`;
    console.log('🚀 Calling my-Hotel And Rooms:', url); // 🔍 DEBUG
    return this.http.get<HotelDTO[]>(url, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }
  getDashboardStats(): Observable<HotelDashboardStats> {
    const url = `${this.baseUrl}/dashboard`;
    return this.http.get<HotelDashboardStats>(url, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

// POST: Create Flight
  createFlight(formData: FormData): Observable<Room> {
    return this.http.post<Room>(this.ApiUrl, formData, { headers: this.getAuthHeaders() });
  }

  // DELETE: Delete Room
  deleteRoom(id: number): Observable<void> {
    return this.http.delete<void>(`${this.ApiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    }).pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    let errorMsg = '';
    let errorDetails = '';

    if (error.error instanceof ErrorEvent) {
      // Client-side/network error
      errorMsg = `Client Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMsg = `Server Error: ${error.status} - ${error.message}`;

      // Log the full error from the server
      if (error.error) {
        try {
          errorDetails = JSON.stringify(error.error, null, 2);
          console.error('Backend Error Details:', error.error);
        } catch (e) {
          errorDetails = error.error;
        }
      }
    }

    console.error('API Error:', errorMsg);
    if (errorDetails) {
      console.error('Error Body:', errorDetails);
    }

    return throwError(() => new Error(`${errorMsg} | Details: ${errorDetails}`));
  }
}

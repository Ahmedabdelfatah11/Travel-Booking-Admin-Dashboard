// src/app/core/services/tour-service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, retry } from 'rxjs';
import { catchError } from 'rxjs/operators';

// Interfaces
import { ITourCompany } from '../../shared/Interfaces/ItourCompany';
import { DashboardStats } from '../../shared/Interfaces/admin-interfaces';
import { ITourStats, TourReadDto } from '../../shared/Interfaces/i-tour';

@Injectable({
  providedIn: 'root'
})
export class TourService {
  private readonly apiUrl = 'https://localhost:7277/api/Tour';
  private readonly tourCompanyApiUrl = 'https://localhost:7277/api/TourCompany';

  constructor(private http: HttpClient) {}

  /**
   * Get authorization headers
   */
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : ''
      // Do not set 'Content-Type' for FormData — browser sets it with boundary
    });
  }

  /* GET: All tours (public)*/
  getTours(): Observable<TourReadDto[]> {
    return this.http.get<TourReadDto[]>(this.apiUrl, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  /* GET: Single tour by ID*/
  getTour(id: number): Observable<TourReadDto> {
    return this.http.get<TourReadDto>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  /* POST: Create a new tour with images (FormData) */
  createTour(formData: FormData): Observable<TourReadDto> {
    return this.http.post<TourReadDto>(this.apiUrl, formData, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  /* PUT: Update existing tour*/
  updateTour(id: number, formData: FormData): Observable<TourReadDto> {
    return this.http.put<TourReadDto>(`${this.apiUrl}/${id}`, formData, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  /* DELETE: Delete a tour*/
  deleteTour(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  /* GET: Tours for current TourAdmin*/
  getMyTours(): Observable<TourReadDto[]> {
    const url = `${this.tourCompanyApiUrl}/my-tours`;
    return this.http.get<TourReadDto[]>(url, { headers: this.getAuthHeaders() })
      .pipe(
        retry(2),
        catchError(this.handleError)
      );
  }

  /* GET: Tour Companies where current user is admin*/
  getMyTourCompanies(): Observable<ITourCompany[]> {
    return this.http.get<ITourCompany[]>(`${this.tourCompanyApiUrl}/my-companies`, {
      headers: this.getAuthHeaders()
    }).pipe(
      retry(2),
      catchError(this.handleError)
    );
  }

  /*Global error handler */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMsg = '';
    let errorDetails = '';

    if (error.error instanceof ErrorEvent) {
      // Client-side/network error
      errorMsg = `Client Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMsg = `Server Error: ${error.status} - ${error.message}`;
      errorDetails = typeof error.error === 'object' ? JSON.stringify(error.error, null, 2) : error.error;
    }

    console.error('API Error:', errorMsg);
    if (errorDetails) console.error('Error Details:', errorDetails);

    return throwError(() => new Error(`${errorMsg} | Details: ${errorDetails}`));
  }
   getDashboardStats(): Observable<ITourStats> {
  return this.http.get<ITourStats>(`${this.tourCompanyApiUrl}/dashboard`, {
    headers: this.getAuthHeaders()
  }).pipe(
    catchError(this.handleError)
  );
}
}
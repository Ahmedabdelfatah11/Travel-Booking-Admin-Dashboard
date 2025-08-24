import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, retry, throwError } from 'rxjs';
import { Flight, FlightCompanyDto, FlightCreated, FlightDashboardStats, FlightDetailsDTO } from '../../shared/Interfaces/iflight';

@Injectable({
  providedIn: 'root'
})
export class FlightService {
  private apiUrl = 'http://pyramigo.runasp.net/flight';
  public flightCompanyApiUrl = 'http://pyramigo.runasp.net/flightcompany';

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

  // GET: All Flights
  getFlights(): Observable<FlightDetailsDTO> {
    return this.http.get<FlightDetailsDTO>(this.apiUrl, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  // GET: Single Flight by ID
  getFlightById(id: number): Observable<Flight> {
    return this.http.get<Flight>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  // POST: Create Flight
  createFlight(formData: FormData): Observable<FlightCreated> {
    return this.http.post<FlightCreated>(this.apiUrl, formData, { headers: this.getAuthHeaders() });
  }

  // PUT: Update Flight
  updateFlight(id: number, flightData: Flight): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, flightData, {
      headers: this.getJsonAuthHeaders()
    }).pipe(catchError(this.handleError));
  }

  // DELETE: Delete Flight
  deleteFlight(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
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
  
  // GET: Flights for current TourAdmin
  getMyFlights(): Observable<FlightCompanyDto[]> {
    const url = `${this.flightCompanyApiUrl}/my-companies`;
    console.log('🚀 Calling my-Flights:', url); // 🔍 DEBUG
    return this.http.get<FlightCompanyDto[]>(url, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }
  getDashboardStats(): Observable<FlightDashboardStats> {
  const url = `${this.flightCompanyApiUrl}/dashboard`;
  return this.http.get<FlightDashboardStats>(url, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError));
}
}
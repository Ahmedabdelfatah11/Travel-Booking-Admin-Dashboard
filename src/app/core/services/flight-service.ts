import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, retry, throwError } from 'rxjs';
import { Flight, FlightCompanyDto, FlightCreated, FlightDetailsDTO } from '../../shared/Interfaces/iflight';

@Injectable({
  providedIn: 'root'
})
export class FlightService {
  private apiUrl = 'https://localhost:7277/flight';
  public flightCompanyApiUrl = 'https://localhost:7277/flightcompany';

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      // 'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }
  // GET: All tours
  getFlights(): Observable<FlightDetailsDTO> {
    return this.http.get<FlightDetailsDTO>(this.apiUrl, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  // GET: Single tour by ID
  getFlightById(id: number): Observable<Flight> {
    return this.http.get<Flight>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  // POST: Create tour
  createFlight(formData: FormData): Observable<FlightCreated> {
    return this.http.post<FlightCreated>(this.apiUrl, formData, { headers: this.getAuthHeaders() });
  }

  // PUT: Update tour
  updateFlight(id: number, tourData: FormData): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, tourData, {
      headers: this.getAuthHeaders()
    }).pipe(catchError(this.handleError));
  }

  // DELETE: Delete tour
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

}

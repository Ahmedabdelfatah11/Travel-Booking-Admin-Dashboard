import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError,catchError, retry } from 'rxjs';
import { TourCreateDto, TourReadDto, TourUpdateDto } from '../../shared/Interfaces/itour-create';
import { ITourCompany } from '../../shared/Interfaces/ItourCompany';


@Injectable({
  providedIn: 'root'
})
export class TourService {
  private apiUrl = 'http://pyramigo.runasp.net/api/Tour';
  public tourCompanyApiUrl = 'http://pyramigo.runasp.net/api/TourCompany'; 

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      // 'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  // GET: All tours
  getTours(): Observable<TourReadDto[]> {
    return this.http.get<TourReadDto[]>(this.apiUrl, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  // GET: Single tour by ID
  getTour(id: number): Observable<TourReadDto> {
    return this.http.get<TourReadDto>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  // POST: Create tour
createTour(formData: FormData): Observable<TourReadDto> {
  return this.http.post<TourReadDto>(this.apiUrl, formData, { headers: this.getAuthHeaders() });
}

  // PUT: Update tour
updateTour(id: number, tourData: FormData): Observable<TourReadDto> {
  return this.http.put<TourReadDto>(`${this.apiUrl}/${id}`, tourData, {
    headers: this.getAuthHeaders()
  }).pipe(catchError(this.handleError));
}

  // DELETE: Delete tour
  deleteTour(id: number): Observable<void> {
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
// GET: Tours for current TourAdmin
getMyTours(): Observable<TourReadDto[]> {
  const url = `${this.tourCompanyApiUrl}/my-tours`;
  console.log('🚀 Calling my-tours:', url); // 🔍 DEBUG
  return this.http.get<TourReadDto[]>(url, { headers: this.getAuthHeaders() })
    .pipe(catchError(this.handleError));
}
// GET: Tour Companies where current user is admin
getMyTourCompanies(): Observable<ITourCompany[]> {
return this.http.get<ITourCompany[]>(`${this.tourCompanyApiUrl}/my-companies`, {
  headers: this.getAuthHeaders()
}).pipe(
  retry(2),
  catchError(this.handleError)
);
}
}
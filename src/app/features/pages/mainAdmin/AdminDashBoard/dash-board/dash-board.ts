import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, Subject, takeUntil, catchError, of } from 'rxjs';

// ... (keep all your interfaces the same)
interface UserStatistics {
  totalUsers: number;
  superAdmins: number;
  hotelAdmins: number;
  flightAdmins: number;
  carAdmins: number;
  tourAdmins: number;
  regularUsers: number;
}

interface CompanyStatistics {
  totalCompanies: number;
  hotelCompanies: number;
  flightCompanies: number;
  carRentalCompanies: number;
  tourCompanies: number;
}

interface ServiceStatistics {
  totalServices: number;
  rooms: number;
  flights: number;
  cars: number;
  tours: number;
}

interface BookingsByType {
  hotelBookings: number;
  flightBookings: number;
  carBookings: number;
  tourBookings: number;
}

interface BookingStatistics {
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  bookingsByType: BookingsByType;
}

interface DashboardData {
  userStatistics: UserStatistics;
  companyStatistics: CompanyStatistics;
  serviceStatistics: ServiceStatistics;
  bookingStatistics: BookingStatistics;
  message: string;
}

@Component({
  selector: 'app-dash-board',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './dash-board.html',
  styleUrls: ['./dash-board.css']
})
export class DashBoardComponent implements OnInit, OnDestroy {
  dashboardData: DashboardData | null = null;
  loading = true;
  error: string | null = null;
  debugInfo: string = '';
  
  private destroy$ = new Subject<void>();
  
  // Configuration - Update these based on your setup
  private baseUrl = 'http://pyramigo.runasp.net'; // Your API base URL
  private apiUrl = `${this.baseUrl}/api/SuperAdmin/dashboard`;

  constructor(private http: HttpClient, private cd: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private getHttpHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    // Get JWT token from localStorage, sessionStorage, or your auth service
    const token = this.getAuthToken();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  private getAuthToken(): string | null {
    // Update this method based on how you store your JWT token
    return localStorage.getItem('authToken') || 
           localStorage.getItem('token') || 
           sessionStorage.getItem('authToken') ||
           sessionStorage.getItem('token');
  }

  testApiConnection(): void {
    this.loading = true;
    this.error = null;
    this.debugInfo = 'Testing API connection...';

    // Test basic connectivity
    this.http.get(`${this.baseUrl}/api/SuperAdmin/users?pageIndex=1&pageSize=1`, { 
      headers: this.getHttpHeaders(),
      observe: 'response' 
    })
    .pipe(
      takeUntil(this.destroy$),
      catchError((error: HttpErrorResponse) => {
        this.handleApiError(error, 'API Connection Test');
        return of(null);
      })
    )
    .subscribe({
      next: (response) => {
        if (response) {
          this.debugInfo = 'API connection successful! Testing dashboard endpoint...';
          this.loadDashboardData();
        }
      }
    });
  }

  loadDashboardData(): void {
    this.loading = true;
    this.error = null;
    this.debugInfo = `Attempting to load dashboard from: ${this.apiUrl}`;
    
    const token = this.getAuthToken();
    if (!token) {
      this.error = 'Authentication token not found';
      this.debugInfo = 'Please log in to access the dashboard';
      this.loading = false;
      this.cd.detectChanges();
      return;
    }

    this.http.get<DashboardData>(this.apiUrl, { 
      headers: this.getHttpHeaders(),
      observe: 'response'
    })
    .pipe(
      takeUntil(this.destroy$),
      catchError((error: HttpErrorResponse) => {
        this.handleApiError(error, 'Dashboard Data Load');
         this.cd.detectChanges();
        return of(null);
      })
    )
    .subscribe({
      next: (response) => {
        if (response && response.body) {
          this.dashboardData = response.body;
          this.loading = false;
          this.debugInfo = '';
          this.cd.detectChanges();
        }
      }
    });
  }

  private handleApiError(error: HttpErrorResponse, context: string): void {
    this.loading = false;
    
    console.error(`${context} error:`, error);
    
    switch (error.status) {
      case 0:
        this.error = 'Cannot connect to server';
        this.debugInfo = 'Check if your API server is running and CORS is configured';
        break;
      case 401:
        this.error = 'Authentication failed';
        this.debugInfo = 'Please log in with Super Admin credentials';
        break;
      case 403:
        this.error = 'Access forbidden';
        this.debugInfo = 'You need Super Admin role to access this dashboard';
        break;
      case 404:
        this.error = 'Dashboard endpoint not found';
        this.debugInfo = `API endpoint ${this.apiUrl} does not exist. Check your API routing.`;
        break;
      case 500:
        this.error = 'Internal server error';
        this.debugInfo = 'There was a problem on the server. Check server logs.';
        break;
      default:
        this.error = `HTTP Error ${error.status}`;
        this.debugInfo = error.message || 'Unknown error occurred';
    }
  }

  refreshData(): void {
    this.cd.detectChanges();
    this.loadDashboardData();

  }

  calculatePercentage(value: number, total: number): number {

    return total > 0 ? Math.round((value / total) * 100) : 0;
     
  }
}
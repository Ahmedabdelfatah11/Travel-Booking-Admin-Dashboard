import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';

export interface DashboardStats {
  totalCars: number;
  totalBookings: number;
  activeBookings: number;
  totalRevenue: number;
  bookingsChart: ChartData[];
}

export interface ChartData {
  date: string;
  count: number;
}

export interface CarRentalCompany {
  id: number;
  name: string;
  description: string;
  location: string;
  imageUrl: string;
  rating: string;
  adminId: string;
}

@Injectable({
  providedIn: 'root'
})
export class CarRentalService {
  private apiUrl = 'http://pyramigo.runasp.net/api/CarRental';
  
  private currentCompanyIdSubject = new BehaviorSubject<number | null>(null);
  public currentCompanyId$ = this.currentCompanyIdSubject.asObservable();

  constructor(private http: HttpClient) { 
    const savedCompanyId = localStorage.getItem('currentCompanyId');
    if (savedCompanyId) {
      this.currentCompanyIdSubject.next(Number(savedCompanyId));
    }
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/dashboard`, { 
      headers: this.getHeaders() 
    });
  }

  getMyCompanies(): Observable<CarRentalCompany[]> {
    return this.http.get<CarRentalCompany[]>(`${this.apiUrl}/my-companies`, { 
      headers: this.getHeaders() 
    });
  }

  setCurrentCompanyId(companyId: number): void {
    this.currentCompanyIdSubject.next(companyId);
    localStorage.setItem('currentCompanyId', companyId.toString());
  }

  
  getCurrentCompanyIdSync(): number | null {
    return this.currentCompanyIdSubject.value;
  }

 updateCompany(id: number, company: CarRentalCompany): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, company, { 
      headers: this.getHeaders() 
    });
  }


  deleteCompany(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { 
      headers: this.getHeaders() 
    });
  }

  
  clearCurrentCompany(): void {
    this.currentCompanyIdSubject.next(null);
    localStorage.removeItem('currentCompanyId');
  }
}
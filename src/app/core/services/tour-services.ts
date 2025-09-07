// tour.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
export interface Tours {
  id: number;
  name: string;
  description?: string;
  destination?: string;
  startDate: string;
  endDate: string;
  price: number;
  imageUrl?: string;
  tourCompanyName?: string;
  tickets?: { id: number; type: string; price: number; availableQuantity: number }[];
}
@Injectable({
  providedIn: 'root'
})
export class TourService {
  private baseUrl = 'http://pyramigo.runasp.net/api/Tour'; 

  constructor(private http: HttpClient) {}

  getTour(id: string | null): Observable<Tours> {
    return this.http.get<Tours>(`${this.baseUrl}/${id}`);
  }
}
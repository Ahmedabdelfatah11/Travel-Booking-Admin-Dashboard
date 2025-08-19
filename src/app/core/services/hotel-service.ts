// hotel.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  private baseUrl = 'https://localhost:7277/api/HotelCompany';      

  constructor(private http: HttpClient) {}

  getHotelById(id: string | null): Observable<Hotel> {
    return this.http.get<Hotel>(`${this.baseUrl}/${id}`);
  }
}

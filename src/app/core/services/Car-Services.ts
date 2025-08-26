import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Car {
  id: number;
  model: string;
  price: number;
  description: string;
  isAvailable: boolean;
  location: string;
  imageUrl: string;
  capacity: number;
  rentalCompanyId: number;
  name: string; // company name
}

export interface CarCreateUpdate {
  model?: string;
  price?: number;
  description?: string;
  isAvailable: boolean;
  location?: string;
  image?: File;
  capacity?: number;
  rentalCompanyId: number;
}

export interface CarSpecParams {
  pageIndex: number;
  pageSize: number;
  search?: string;
  sort?: string;
  rentalCompanyId?: number;
}

export interface Pagination<T> {
  pageIndex: number;
  pageSize: number;
  count: number;
  data: T[];
}

@Injectable({
  providedIn: 'root'
})
export class CarService {
  private apiUrl = 'http://pyramigo.runasp.net/api/Car';

  constructor(private http: HttpClient) { }

  private getHeaders(isFormData: boolean = false): HttpHeaders {
    const token = localStorage.getItem('authToken');
    const headers: any = {
      'Authorization': `Bearer ${token}`
    };
    
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }
    
    return new HttpHeaders(headers);
  }

  getCars(params?: CarSpecParams): Observable<Pagination<Car>> {
    let httpParams = new HttpParams();
    
    if (params) {
      if (params.pageIndex) httpParams = httpParams.set('pageIndex', params.pageIndex.toString());
      if (params.pageSize) httpParams = httpParams.set('pageSize', params.pageSize.toString());
      if (params.search) httpParams = httpParams.set('search', params.search);
      if (params.sort) httpParams = httpParams.set('sort', params.sort);
      if (params.rentalCompanyId) httpParams = httpParams.set('rentalCompanyId', params.rentalCompanyId.toString());
    }

    return this.http.get<Pagination<Car>>(this.apiUrl, { 
      headers: this.getHeaders(),
      params: httpParams
    });
  }

  getCar(id: number): Observable<Car> {
    return this.http.get<Car>(`${this.apiUrl}/${id}`, { 
      headers: this.getHeaders() 
    });
  }

  createCar(carData: CarCreateUpdate): Observable<Car> {
    const formData = new FormData();
    
    if (carData.model) formData.append('model', carData.model);
    if (carData.price) formData.append('price', carData.price.toString());
    if (carData.description) formData.append('description', carData.description);
    formData.append('isAvailable', carData.isAvailable.toString());
    if (carData.location) formData.append('location', carData.location);
    if (carData.image) formData.append('image', carData.image);
    if (carData.capacity) formData.append('capacity', carData.capacity.toString());
    formData.append('rentalCompanyId', carData.rentalCompanyId.toString());

    return this.http.post<Car>(this.apiUrl, formData, { 
      headers: this.getHeaders(true) 
    });
  }

  updateCar(id: number, carData: CarCreateUpdate): Observable<any> {
    const formData = new FormData();
    
    if (carData.model) formData.append('model', carData.model);
    if (carData.price) formData.append('price', carData.price.toString());
    if (carData.description) formData.append('description', carData.description);
    formData.append('isAvailable', carData.isAvailable.toString());
    if (carData.location) formData.append('location', carData.location);
    if (carData.image) formData.append('image', carData.image);
    if (carData.capacity) formData.append('capacity', carData.capacity.toString());
    formData.append('rentalCompanyId', carData.rentalCompanyId.toString());

    return this.http.put(`${this.apiUrl}/${id}`, formData, { 
      headers: this.getHeaders(true) 
    });
  }

  deleteCar(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { 
      headers: this.getHeaders() 
    });
  }
}
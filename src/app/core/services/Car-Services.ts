import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, map } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

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
    
    if (!token) {
      throw new Error('Authentication token not found');
    }
    
    const headers: any = {
      'Authorization': `Bearer ${token}`
    };
    
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }
    
    return new HttpHeaders(headers);
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      switch (error.status) {
        case 401:
          errorMessage = 'Unauthorized. Please login again.';
          break;
        case 403:
          errorMessage = 'Access forbidden. You do not have permission.';
          break;
        case 404:
          errorMessage = 'Resource not found.';
          break;
        case 500:
          errorMessage = 'Internal server error. Please try again later.';
          break;
        default:
          errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      }
    }
    
    return throwError(() => new Error(errorMessage));
  }

  getCars(params?: CarSpecParams): Observable<Pagination<Car>> {
    let httpParams = new HttpParams();
    
    if (params) {
      if (params.pageIndex !== undefined) {
        httpParams = httpParams.set('pageIndex', params.pageIndex.toString());
      }
      if (params.pageSize !== undefined) {
        httpParams = httpParams.set('pageSize', params.pageSize.toString());
      }
      if (params.search && params.search.trim()) {
        httpParams = httpParams.set('search', params.search.trim());
      }
      if (params.sort) {
        httpParams = httpParams.set('sort', params.sort);
      }
      if (params.rentalCompanyId !== undefined && params.rentalCompanyId !== null) {
        httpParams = httpParams.set('rentalCompanyId', params.rentalCompanyId.toString());
      }
    }

    return this.http.get<Pagination<Car>>(this.apiUrl, { 
      headers: this.getHeaders(),
      params: httpParams
    }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  getCarsByCompanyFromMyCompanies(
    carRentalService: any, 
    companyId: number, 
    params?: Omit<CarSpecParams, 'rentalCompanyId'>
  ): Observable<Pagination<Car>> {
    return carRentalService.getMyCompanies().pipe(
      map((companies: any[]) => {
        const targetCompany = companies.find(company => company.id === companyId);
        
        if (!targetCompany) {
          throw new Error(`Company with ID ${companyId} not found in your companies`);
        }

        let companyCars: Car[] = targetCompany.cars || [];
        if (params?.search && params.search.trim()) {
          const searchLower = params.search.toLowerCase().trim();
          companyCars = companyCars.filter(car => 
            car.model?.toLowerCase().includes(searchLower) ||
            car.location?.toLowerCase().includes(searchLower) ||
            car.description?.toLowerCase().includes(searchLower)
          );
        }

        if (params?.sort) {
          companyCars = this.sortCars(companyCars, params.sort);
        }

        const pageIndex = params?.pageIndex || 1;
        const pageSize = params?.pageSize || 10;
        const startIndex = (pageIndex - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedCars = companyCars.slice(startIndex, endIndex);

        return {
          pageIndex: pageIndex,
          pageSize: pageSize,
          count: companyCars.length,
          data: paginatedCars
        };
      }),
      catchError(this.handleError.bind(this))
    );
  }

  private sortCars(cars: Car[], sortBy: string): Car[] {
    return cars.sort((a, b) => {
      switch (sortBy) {
        case 'model':
          return (a.model || '').localeCompare(b.model || '');
        case 'price':
          return (a.price || 0) - (b.price || 0);
        case 'capacity':
          return (a.capacity || 0) - (b.capacity || 0);
        case 'location':
          return (a.location || '').localeCompare(b.location || '');
        default:
          return 0;
      }
    });
  }

  getCar(id: number): Observable<Car> {
    return this.http.get<Car>(`${this.apiUrl}/${id}`, { 
      headers: this.getHeaders() 
    }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  createCar(carData: CarCreateUpdate): Observable<Car> {
    const formData = new FormData();
    
    if (carData.model) formData.append('model', carData.model);
    if (carData.price !== undefined) formData.append('price', carData.price.toString());
    if (carData.description) formData.append('description', carData.description);
    formData.append('isAvailable', carData.isAvailable.toString());
    if (carData.location) formData.append('location', carData.location);
    if (carData.image) formData.append('image', carData.image);
    if (carData.capacity !== undefined) formData.append('capacity', carData.capacity.toString());
    
    if (carData.rentalCompanyId !== undefined) {
      formData.append('rentalCompanyId', carData.rentalCompanyId.toString());
    } else {
      throw new Error('rentalCompanyId is required when creating a car');
    }

    return this.http.post<Car>(this.apiUrl, formData, { 
      headers: this.getHeaders(true) 
    }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  updateCar(id: number, carData: CarCreateUpdate): Observable<any> {
    const formData = new FormData();
    
    if (carData.model) formData.append('model', carData.model);
    if (carData.price !== undefined) formData.append('price', carData.price.toString());
    if (carData.description) formData.append('description', carData.description);
    formData.append('isAvailable', carData.isAvailable.toString());
    if (carData.location) formData.append('location', carData.location);
    if (carData.image) formData.append('image', carData.image);
    if (carData.capacity !== undefined) formData.append('capacity', carData.capacity.toString());
    
    if (carData.rentalCompanyId !== undefined) {
      formData.append('rentalCompanyId', carData.rentalCompanyId.toString());
    } else {
      throw new Error('rentalCompanyId is required when updating a car');
    }

    return this.http.put(`${this.apiUrl}/${id}`, formData, { 
      headers: this.getHeaders(true) 
    }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  deleteCar(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { 
      headers: this.getHeaders() 
    }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  verifyCarOwnership(carId: number, expectedCompanyId: number): Observable<boolean> {
    return this.getCar(carId).pipe(
      map(car => car.rentalCompanyId === expectedCompanyId),
      catchError(() => throwError(() => new Error('Could not verify car ownership')))
    );
  }

  getCarIfOwned(carId: number, companyId: number): Observable<Car> {
    return this.getCar(carId).pipe(
      map(car => {
        if (car.rentalCompanyId !== companyId) {
          throw new Error('Car does not belong to your company');
        }
        return car;
      })
    );
  }
}